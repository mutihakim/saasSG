<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\MonthlyReviewService;
use App\Support\SubscriptionEntitlements;
use App\Services\Finance\Transactions\FinanceTransactionPayloadService;
use App\Services\Finance\Transactions\FinanceTransactionPresenter;
use App\Services\Finance\Transactions\FinanceTransactionResourceResolverService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use RuntimeException;

class WalletSavingsGoalApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly FinanceTransactionResourceResolverService $resolver,
        private readonly FinanceTransactionPayloadService $payloads,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceLedgerService $ledger,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);
        $accessiblePocketIds = $this->access->accessiblePocketsQuery($tenant, $member)->pluck('finance_pockets.id');

        $goals = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->with([
                'pocket:id,name,real_account_id,current_balance,currency_code,scope,icon_key',
                'pocket.realAccount:id,name,currency_code,type',
                'ownerMember:id,full_name',
            ])
            ->withCount('financialTransactions as activities_count')
            ->whereIn('pocket_id', $accessiblePocketIds)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['ok' => true, 'data' => ['goals' => $goals]]);
    }

    public function show(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canViewGoal($goal, $tenant, $member), 404);

        return response()->json([
            'ok' => true,
            'data' => [
                'goal' => $goal->fresh($this->goalRelations())->loadCount('financialTransactions as activities_count'),
                'activities' => $this->goalFinancialHistory($tenant, $goal),
            ],
        ]);
    }

    public function activities(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canViewGoal($goal, $tenant, $member), 404);

        return response()->json(['ok' => true, 'data' => ['activities' => $this->goalFinancialHistory($tenant, $goal)]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);

        $data = $request->validate([
            'pocket_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'name' => ['required', 'string', 'max:120'],
            'target_amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $this->entitlements->assertUnderLimit(
                $tenant,
                'finance.goals.max',
                FinanceSavingsGoal::query()->where('tenant_id', $tenant->id)->count()
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'error_code' => 'PLAN_QUOTA_EXCEEDED',
                'message' => 'Batas savings goal pada plan ini sudah tercapai.',
            ], 422);
        }

        $pocket = $this->access->usablePocketsQuery($tenant, $member)->whereKey($data['pocket_id'])->first();
        if (! $pocket) {
            return response()->json(['ok' => false, 'message' => 'Wallet goal tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        $goal = FinanceSavingsGoal::create([
            'tenant_id' => $tenant->id,
            'pocket_id' => $pocket->id,
            'owner_member_id' => $member?->id,
            'name' => $data['name'],
            'target_amount' => $data['target_amount'],
            'current_amount' => 0,
            'target_date' => $data['target_date'] ?? null,
            'status' => 'active',
            'notes' => $data['notes'] ?? null,
            'row_version' => 1,
        ]);

        $this->writeGoalActivityLog($request, $tenant, $member, 'finance.goal.created', $goal, null, [
            'id' => $goal->id,
            'pocket_id' => $goal->pocket_id,
            'name' => $goal->name,
            'target_amount' => (string) $goal->target_amount,
            'current_amount' => (string) $goal->current_amount,
            'target_date' => optional($goal->target_date)->toDateString(),
            'status' => $goal->status,
            'notes' => $goal->notes,
            'row_version' => $goal->row_version,
        ]);

        return response()->json(['ok' => true, 'data' => ['goal' => $goal->fresh($this->goalRelations())->loadCount('financialTransactions as activities_count')]], 201);
    }

    public function update(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.update'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canManageGoal($goal, $member), 403);

        $data = $request->validate([
            'pocket_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'name' => ['required', 'string', 'max:120'],
            'target_amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'target_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'completed', 'paused'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ((int) $goal->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Savings goal diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $pocket = $this->access->usablePocketsQuery($tenant, $member)->whereKey($data['pocket_id'])->first();
        if (! $pocket) {
            return response()->json(['ok' => false, 'message' => 'Wallet goal tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if ((string) $goal->pocket_id !== (string) $pocket->id && (float) $goal->current_amount > 0) {
            return response()->json(['ok' => false, 'message' => 'Goal yang sudah memiliki dana teralokasi tidak bisa dipindah wallet.'], 422);
        }

        $before = $this->goalSnapshot($goal);

        $goal->update([
            'pocket_id' => $pocket->id,
            'name' => $data['name'],
            'target_amount' => $data['target_amount'],
            'target_date' => $data['target_date'] ?? null,
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
            'row_version' => $goal->row_version + 1,
        ]);

        $this->writeGoalActivityLog($request, $tenant, $member, 'finance.goal.updated', $goal, $before, $this->goalSnapshot($goal));

        return response()->json(['ok' => true, 'data' => ['goal' => $goal->fresh($this->goalRelations())->loadCount('financialTransactions as activities_count')]]);
    }

    public function fund(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canUseGoal($goal, $tenant, $member), 403);

        $data = $request->validate([
            'source_pocket_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'transaction_date' => ['required', 'date', 'before_or_equal:tomorrow'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $periodMonth = substr((string) $data['transaction_date'], 0, 7);
        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $periodMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        $sourcePocket = $this->resolver->resolveUsablePocket($tenant, $member, $data['source_pocket_id']);
        $targetGoal = $goal->fresh($this->goalRelations());
        $targetPocket = $targetGoal->pocket;

        if (! $sourcePocket || ! $targetPocket || ! $this->access->canUsePocket($targetPocket, $tenant, $member)) {
            return response()->json(['ok' => false, 'message' => 'Wallet sumber atau wallet goal tidak bisa diakses.'], 422);
        }

        if ((string) $sourcePocket->currency_code !== (string) $targetPocket->currency_code) {
            return response()->json(['ok' => false, 'message' => 'Top up goal hanya mendukung wallet dengan mata uang yang sama.'], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $tenant, $member, $targetGoal, $sourcePocket, $targetPocket, $data) {
                /** @var FinanceSavingsGoal|null $lockedGoal */
                $lockedGoal = FinanceSavingsGoal::query()->whereKey($targetGoal->id)->lockForUpdate()->first();
                $lockedPockets = FinancePocket::query()
                    ->whereIn('id', array_values(array_unique([$sourcePocket->id, $targetPocket->id])))
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
                $lockedAccounts = TenantBankAccount::query()
                    ->whereIn('id', array_values(array_unique([$sourcePocket->real_account_id, $targetPocket->real_account_id])))
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
                $reservedByPocket = FinanceSavingsGoal::query()
                    ->whereIn('pocket_id', $lockedPockets->keys())
                    ->selectRaw('pocket_id, COALESCE(SUM(current_amount), 0) as reserved_total')
                    ->groupBy('pocket_id')
                    ->get()
                    ->keyBy('pocket_id');

                $lockedSourcePocket = $lockedPockets->get($sourcePocket->id);
                $lockedTargetPocket = $lockedPockets->get($targetPocket->id);
                $lockedSourceAccount = $lockedAccounts->get($sourcePocket->real_account_id);
                $lockedTargetAccount = $lockedAccounts->get($targetPocket->real_account_id);

                if (! $lockedGoal || ! $lockedSourcePocket || ! $lockedTargetPocket || ! $lockedSourceAccount || ! $lockedTargetAccount) {
                    throw new \RuntimeException('Locked goal funding resources not found.');
                }

                $amount = round((float) $data['amount'], 2);
                $availableSource = round(
                    (float) ($lockedSourcePocket->current_balance ?? 0) - (float) ($reservedByPocket->get($lockedSourcePocket->id)?->reserved_total ?? 0),
                    2
                );
                if ((string) $lockedSourcePocket->id === (string) $lockedTargetPocket->id) {
                    $availableSource = round(
                        (float) $lockedTargetPocket->current_balance
                        - ((float) ($reservedByPocket->get($lockedTargetPocket->id)?->reserved_total ?? 0) - (float) $lockedGoal->current_amount),
                        2
                    );
                }

                if (! in_array($lockedSourceAccount->type, ['credit_card', 'paylater'], true) && $availableSource < $amount) {
                    return response()->json(['ok' => false, 'message' => 'Saldo wallet sumber tidak cukup untuk top up goal.'], 422);
                }

                $description = $data['description'] ?: "Top up goal {$lockedGoal->name}";
                $relatedTransactionId = null;

                if ((string) $lockedSourcePocket->id !== (string) $lockedTargetPocket->id) {
                    $currency = $this->resolver->resolveCurrency($tenant, (string) $lockedSourcePocket->currency_code);
                    if (! $currency) {
                        return response()->json(['ok' => false, 'message' => 'Mata uang wallet goal tidak ditemukan.'], 422);
                    }

                    $sourceTx = FinanceTransaction::create($this->payloads->transactionPayload(
                        tenant: $tenant,
                        actorMemberId: $member?->id,
                        ownerMemberId: $member?->id,
                        data: [
                            'type' => 'transfer',
                            'transaction_date' => $data['transaction_date'],
                            'amount' => $amount,
                            'currency_code' => $currency->code,
                            'description' => $description,
                            'notes' => $data['notes'] ?? null,
                            'source_type' => 'wallet_goal',
                            'source_id' => (string) $lockedGoal->id,
                            'bank_account_id' => $lockedSourceAccount->id,
                            'pocket_id' => $lockedSourcePocket->id,
                            'budget_id' => null,
                            'budget_status' => 'unbudgeted',
                            'budget_delta' => 0,
                            'transfer_direction' => 'out',
                        ],
                        currency: $currency,
                        rowVersion: 1,
                    ));

                    $targetTx = FinanceTransaction::create($this->payloads->transactionPayload(
                        tenant: $tenant,
                        actorMemberId: $member?->id,
                        ownerMemberId: $lockedGoal->owner_member_id ?: $member?->id,
                        data: [
                            'type' => 'transfer',
                            'transaction_date' => $data['transaction_date'],
                            'amount' => $amount,
                            'currency_code' => $currency->code,
                            'description' => $description,
                            'notes' => $data['notes'] ?? null,
                            'source_type' => 'wallet_goal',
                            'source_id' => (string) $lockedGoal->id,
                            'bank_account_id' => $lockedTargetAccount->id,
                            'pocket_id' => $lockedTargetPocket->id,
                            'budget_id' => null,
                            'budget_status' => 'unbudgeted',
                            'budget_delta' => 0,
                            'transfer_direction' => 'in',
                        ],
                        currency: $currency,
                        rowVersion: 1,
                    ));

                    $sourceTx->update(['transfer_pair_id' => $targetTx->id]);
                    $targetTx->update(['transfer_pair_id' => $sourceTx->id]);

                    $this->ledger->syncAfterCreate($sourceTx);
                    $this->ledger->syncAfterCreate($targetTx);
                    $relatedTransactionId = $targetTx->id;
                }

                $lockedGoal->update([
                    'current_amount' => round((float) $lockedGoal->current_amount + $amount, 2),
                    'row_version' => $lockedGoal->row_version + 1,
                ]);

                return $lockedGoal->fresh($this->goalRelations())->loadCount('financialTransactions as activities_count');
            });

            if ($result instanceof JsonResponse) {
                return $result;
            }

            $this->writeGoalActivityLog($request, $tenant, $member, 'finance.goal.funded', $result, null, $this->goalSnapshot($result), [
                'source_pocket_id' => $sourcePocket->id,
                'amount' => (float) $data['amount'],
                'transaction_date' => $data['transaction_date'],
            ]);

            return response()->json(['ok' => true, 'data' => ['goal' => $result, 'activities' => $this->goalFinancialHistory($tenant, $result)]]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal melakukan top up goal.'], 500);
        }
    }

    public function spend(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canUseGoal($goal, $tenant, $member), 403);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'transaction_date' => ['required', 'date', 'before_or_equal:tomorrow'],
            'category_id' => ['required', 'integer', Rule::exists('tenant_categories', 'id')->where('tenant_id', $tenant->id)->where('module', 'finance')],
            'description' => ['required', 'string', 'max:255'],
            'budget_id' => ['nullable', 'string', 'size:26', Rule::exists('tenant_budgets', 'id')->where('tenant_id', $tenant->id)],
            'payment_method' => ['nullable', 'in:tunai,transfer,kartu_kredit,kartu_debit,dompet_digital,qris,lainnya'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'merchant_name' => ['nullable', 'string', 'max:150'],
            'location' => ['nullable', 'string', 'max:200'],
        ]);

        $periodMonth = substr((string) $data['transaction_date'], 0, 7);
        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $periodMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $tenant, $member, $goal, $data) {
                /** @var FinanceSavingsGoal|null $lockedGoal */
                $lockedGoal = FinanceSavingsGoal::query()->whereKey($goal->id)->lockForUpdate()->first();
                if (! $lockedGoal) {
                    throw new \RuntimeException('Locked goal not found.');
                }

                /** @var FinancePocket|null $lockedPocket */
                $lockedPocket = FinancePocket::query()->whereKey($lockedGoal->pocket_id)->lockForUpdate()->first();
                /** @var TenantBankAccount|null $lockedAccount */
                $lockedAccount = $lockedPocket
                    ? TenantBankAccount::query()->whereKey($lockedPocket->real_account_id)->lockForUpdate()->first()
                    : null;

                if (! $lockedPocket || ! $lockedAccount) {
                    throw new \RuntimeException('Locked goal spend resources not found.');
                }

                $amount = round((float) $data['amount'], 2);
                if ((float) $lockedGoal->current_amount < $amount) {
                    return response()->json(['ok' => false, 'message' => 'Dana goal tidak cukup untuk dipakai.'], 422);
                }

                if (! in_array($lockedAccount->type, ['credit_card', 'paylater'], true) && (float) $lockedPocket->current_balance < $amount) {
                    return response()->json(['ok' => false, 'message' => 'Saldo wallet induk goal tidak cukup.'], 422);
                }

                $budget = $this->resolver->resolveBudgetForPocket($tenant, $member, $data['budget_id'] ?? null, $lockedPocket, $data['transaction_date']);
                if ($lockedPocket->budget_lock_enabled) {
                    $budget = $this->resolver->resolvePocketDefaultBudget($tenant, $member, $lockedPocket, $periodMonth);
                }
                if ($lockedPocket->budget_lock_enabled && ! $budget) {
                    return response()->json(['ok' => false, 'message' => 'Budget lock wallet tidak valid atau tidak bisa diakses.'], 422);
                }
                if (($data['budget_id'] ?? null) && ! $budget) {
                    return response()->json(['ok' => false, 'message' => 'Budget tidak ditemukan atau tidak bisa diakses.'], 422);
                }

                $currency = $this->resolver->resolveCurrency($tenant, (string) $lockedPocket->currency_code);
                if (! $currency) {
                    return response()->json(['ok' => false, 'message' => 'Mata uang wallet goal tidak ditemukan.'], 422);
                }

                [$budgetStatus, $budgetDelta] = $this->payloads->resolveBudgetStatus('pengeluaran', $budget, $amount);

                $transaction = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member?->id,
                    ownerMemberId: $lockedGoal->owner_member_id ?: $member?->id,
                    data: array_merge($data, [
                        'type' => 'pengeluaran',
                        'currency_code' => $currency->code,
                        'exchange_rate' => 1,
                        'bank_account_id' => $lockedAccount->id,
                        'pocket_id' => $lockedPocket->id,
                        'budget_id' => $budget?->id,
                        'budget_status' => $budgetStatus,
                        'budget_delta' => $budgetDelta,
                        'source_type' => 'wallet_goal',
                        'source_id' => (string) $lockedGoal->id,
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $this->ledger->syncAfterCreate($transaction);

                $lockedGoal->update([
                    'current_amount' => round((float) $lockedGoal->current_amount - $amount, 2),
                    'status' => round((float) $lockedGoal->current_amount - $amount, 2) <= 0 && $lockedGoal->status === 'completed'
                        ? 'completed'
                        : $lockedGoal->status,
                    'row_version' => $lockedGoal->row_version + 1,
                ]);

                return [
                    'goal' => $lockedGoal->fresh($this->goalRelations())->loadCount('financialTransactions as activities_count'),
                    'transaction' => $transaction->fresh($this->presenter->relations()),
                ];
            });

            if ($result instanceof JsonResponse) {
                return $result;
            }

            $this->writeGoalActivityLog($request, $tenant, $member, 'finance.goal.spent', $result['goal'], null, $this->goalSnapshot($result['goal']), [
                'transaction_id' => $result['transaction']->id,
                'amount' => (float) $data['amount'],
                'transaction_date' => $data['transaction_date'],
            ]);

            return response()->json([
                'ok' => true,
                'data' => [
                    'goal' => $result['goal'],
                    'transaction' => $this->presenter->transaction($tenant, $result['transaction']),
                    'activities' => $this->goalFinancialHistory($tenant, $result['goal']),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal memakai dana goal.'], 500);
        }
    }

    public function destroy(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.delete'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->canManageGoal($goal, $member), 403);

        if ((float) $goal->current_amount > 0) {
            return response()->json(['ok' => false, 'message' => 'Goal yang masih memiliki dana teralokasi tidak bisa dihapus.'], 422);
        }

        $before = $this->goalSnapshot($goal);
        $goal->delete();
        $this->writeGoalActivityLog($request, $tenant, $member, 'finance.goal.deleted', $goal, $before, null);

        return response()->json(['ok' => true]);
    }

    private function goalRelations(): array
    {
        return [
            'pocket:id,name,real_account_id,current_balance,currency_code,scope,icon_key,owner_member_id',
            'pocket.realAccount:id,name,currency_code,type',
            'ownerMember:id,full_name',
        ];
    }

    private function goalFinancialHistory(Tenant $tenant, FinanceSavingsGoal $goal): array
    {
        return FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->where('source_type', 'wallet_goal')
            ->where('source_id', (string) $goal->id)
            ->with($this->presenter->relations())
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (FinanceTransaction $transaction) => $this->presenter->transaction($tenant, $transaction))
            ->all();
    }

    private function canViewGoal(FinanceSavingsGoal $goal, Tenant $tenant, ?TenantMember $member): bool
    {
        $pocket = $goal->pocket ?: FinancePocket::query()->find($goal->pocket_id);

        return $pocket ? $this->access->accessiblePocketsQuery($tenant, $member)->whereKey($pocket->id)->exists() : false;
    }

    private function canUseGoal(FinanceSavingsGoal $goal, Tenant $tenant, ?TenantMember $member): bool
    {
        $pocket = $goal->pocket ?: FinancePocket::query()->find($goal->pocket_id);

        return $pocket ? $this->access->canUsePocket($pocket, $tenant, $member) : false;
    }

    private function canManageGoal(FinanceSavingsGoal $goal, ?TenantMember $member): bool
    {
        if (! $member) {
            return false;
        }

        return $this->access->isPrivileged($member) || (string) $goal->owner_member_id === (string) $member->id;
    }

    private function goalSnapshot(FinanceSavingsGoal $goal): array
    {
        return [
            'id' => $goal->id,
            'pocket_id' => $goal->pocket_id,
            'owner_member_id' => $goal->owner_member_id,
            'name' => $goal->name,
            'target_amount' => (string) $goal->target_amount,
            'current_amount' => (string) $goal->current_amount,
            'target_date' => optional($goal->target_date)->toDateString(),
            'status' => $goal->status,
            'notes' => $goal->notes,
            'row_version' => $goal->row_version,
        ];
    }

    private function writeGoalActivityLog(
        Request $request,
        Tenant $tenant,
        ?TenantMember $actor,
        string $action,
        FinanceSavingsGoal $goal,
        ?array $before,
        ?array $after,
        array $metadata = [],
    ): void {
        ActivityLog::create([
            'tenant_id' => $tenant->id,
            'actor_user_id' => $request->user()?->id,
            'actor_member_id' => $actor?->id,
            'action' => $action,
            'target_type' => 'finance_savings_goals',
            'target_id' => (string) $goal->id,
            'changes' => array_filter([
                'before' => $before,
                'after' => $after,
            ], fn ($value) => $value !== null),
            'metadata' => $metadata ?: null,
            'request_id' => (string) $request->header('X-Request-Id', $request->fingerprint()),
            'occurred_at' => Carbon::now()->utc(),
            'result_status' => 'success',
            'before_version' => $before['row_version'] ?? null,
            'after_version' => $after['row_version'] ?? null,
            'source_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
