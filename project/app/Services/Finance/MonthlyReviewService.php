<?php

namespace App\Services\Finance;

use App\Models\FinanceMonthReview;
use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBudget;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Services\Finance\Transactions\FinanceTransactionPayloadService;
use App\Services\Finance\Wallet\WalletCashflowService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MonthlyReviewService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceTransactionPayloadService $payloads,
        private readonly WalletCashflowService $cashflow,
    ) {
    }

    public function buildStatus(Tenant $tenant, ?TenantMember $member): array
    {
        $currentMonth = now()->format('Y-m');
        $previousMonth = now()->startOfMonth()->subMonthNoOverflow()->format('Y-m');
        $eligibleMonths = $this->eligibleMonths($tenant, $member);
        $reviews = FinanceMonthReview::query()
            ->forTenant($tenant->id)
            ->whereIn('period_month', collect([$previousMonth, ...$eligibleMonths])->unique()->values()->all())
            ->get()
            ->keyBy('period_month');

        $eligibleMonths = collect($eligibleMonths)
            ->map(fn (string $periodMonth) => [
                'period_month' => $periodMonth,
                'status' => $reviews->get($periodMonth)?->status ?? 'open',
                'closed_at' => $reviews->get($periodMonth)?->closed_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $previousReview = $reviews->get($previousMonth);
        $suggested = collect($eligibleMonths)
            ->sortByDesc('period_month')
            ->first(fn (array $month) => $month['status'] !== 'closed')
            ?? ($eligibleMonths[0] ?? null);

        return [
            'current_month' => $currentMonth,
            'previous_month' => $previousMonth,
            'previous_month_status' => $previousReview?->status ?? 'open',
            'planning_blocked' => $this->isPlanningBlockedForPeriod($tenant, $currentMonth),
            'eligible_months' => $eligibleMonths,
            'suggested_period_month' => $suggested['period_month'] ?? null,
        ];
    }

    public function isPlanningBlockedForPeriod(Tenant $tenant, string $periodMonth): bool
    {
        if ($periodMonth !== now()->format('Y-m')) {
            return false;
        }

        $previousMonth = now()->startOfMonth()->subMonthNoOverflow()->format('Y-m');
        if (! in_array($previousMonth, $this->eligibleMonths($tenant, null), true)) {
            return false;
        }

        $review = FinanceMonthReview::query()
            ->forTenant($tenant->id)
            ->where('period_month', $previousMonth)
            ->first();

        return ($review?->status ?? 'open') !== 'closed';
    }

    public function isMonthClosed(Tenant $tenant, string $periodMonth): bool
    {
        $review = FinanceMonthReview::query()
            ->forTenant($tenant->id)
            ->where('period_month', $periodMonth)
            ->first();

        return ($review?->status ?? 'open') === 'closed';
    }

    public function planningBlockedMessage(Tenant $tenant): string
    {
        $previousMonth = now()->startOfMonth()->subMonthNoOverflow()->translatedFormat('F Y');

        return "Tutup buku {$previousMonth} dulu sebelum membuat target budget atau transfer wallet bulan ini.";
    }

    public function preview(Tenant $tenant, ?TenantMember $member, string $periodMonth, string $budgetMethod = 'copy_last_month'): array
    {
        $this->assertReviewableMonth($tenant, $member, $periodMonth);

        $monthStart = CarbonImmutable::createFromFormat('Y-m', $periodMonth)->startOfMonth();
        $monthEnd = $monthStart->endOfMonth();
        $nextMonth = $monthStart->addMonth()->format('Y-m');
        $review = FinanceMonthReview::query()
            ->forTenant($tenant->id)
            ->where('period_month', $periodMonth)
            ->first();

        $accounts = $this->access->accessibleAccountsQuery($tenant, $member)
            ->active()
            ->orderBy('scope')
            ->orderBy('name')
            ->get();
        $pockets = $this->access->accessiblePocketsQuery($tenant, $member)
            ->active()
            ->with(['realAccount:id,name,type,currency_code', 'ownerMember:id,full_name'])
            ->orderBy('scope')
            ->orderBy('real_account_id')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
        $goals = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->with(['pocket:id,name,real_account_id'])
            ->whereIn('pocket_id', $pockets->pluck('id'))
            ->orderBy('name')
            ->get();

        $accountDeltas = $this->cumulativeDeltas($tenant, $member, 'bank_account_id', $monthEnd->toDateString());
        $pocketDeltas = $this->cumulativeDeltas($tenant, $member, 'pocket_id', $monthEnd->toDateString());
        $periodFlows = $this->periodPocketFlows($tenant, $member, $monthStart->toDateString(), $monthEnd->toDateString());

        $accountsPreview = $accounts->map(function ($account) use ($pockets, $accountDeltas, $pocketDeltas) {
            $ending = round((float) ($account->opening_balance ?? 0) + (float) ($accountDeltas[$account->id] ?? 0), 2);
            $accountPockets = $pockets->where('real_account_id', $account->id)->values();
            $allocated = round((float) $accountPockets
                ->filter(fn ($pocket) => ! $pocket->is_system)
                ->sum(fn ($pocket) => (float) ($pocketDeltas[$pocket->id] ?? 0)), 2);
            $unallocated = round($ending - $allocated, 2);

            return [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->type,
                'currency_code' => $account->currency_code,
                'ending_balance' => $ending,
                'allocated_amount' => $allocated,
                'unallocated_amount' => $unallocated,
            ];
        })->values();

        $walletsPreview = $pockets->map(function ($pocket) use ($pocketDeltas, $periodFlows) {
            $flows = $periodFlows[$pocket->id] ?? ['inflow' => 0, 'outflow' => 0];
            $ending = round((float) ($pocketDeltas[$pocket->id] ?? 0), 2);

            return [
                'id' => $pocket->id,
                'name' => $pocket->name,
                'scope' => $pocket->scope,
                'is_system' => (bool) $pocket->is_system,
                'purpose_type' => $pocket->purpose_type,
                'real_account_id' => $pocket->real_account_id,
                'real_account_name' => $pocket->realAccount?->name,
                'owner_member_name' => $pocket->ownerMember?->full_name,
                'ending_balance' => $ending,
                'period_inflow' => round((float) $flows['inflow'], 2),
                'period_outflow' => round((float) $flows['outflow'], 2),
                'suggested_action' => $ending > 0 ? 'rollover' : 'rollover',
                'suggested_amount' => max($ending, 0),
            ];
        })->values();

        return [
            'period_month' => $periodMonth,
            'next_period_month' => $nextMonth,
            'status' => $review?->status ?? 'open',
            'budget_method' => $budgetMethod,
            'accounts' => $accountsPreview->all(),
            'wallets' => $walletsPreview->all(),
            'goals' => $goals->map(fn ($goal) => [
                'id' => $goal->id,
                'name' => $goal->name,
                'pocket_id' => $goal->pocket_id,
                'pocket_name' => $goal->pocket?->name,
            ])->values()->all(),
            'sweep_actions' => $walletsPreview
                ->filter(fn (array $wallet) => (float) $wallet['ending_balance'] > 0 && ! $wallet['is_system'] && $wallet['purpose_type'] === 'spending')
                ->map(fn (array $wallet) => [
                    'source_pocket_id' => $wallet['id'],
                    'action' => 'rollover',
                    'amount' => $wallet['suggested_amount'],
                    'target_pocket_id' => null,
                    'goal_id' => null,
                ])
                ->values()
                ->all(),
            'budget_drafts' => $this->buildBudgetDrafts($tenant, $member, $periodMonth, $budgetMethod)->all(),
        ];
    }

    public function submit(Tenant $tenant, ?TenantMember $member, array $data): array
    {
        if (! $member) {
            throw new RuntimeException('Member context is required.');
        }

        $periodMonth = $data['period_month'];
        $existingReview = FinanceMonthReview::query()
            ->forTenant($tenant->id)
            ->where('period_month', $periodMonth)
            ->first();

        if ($existingReview?->status === 'closed') {
            throw new RuntimeException('Periode ' . $periodMonth . ' sudah ditutup oleh member lain.');
        }

        $preview = $this->preview($tenant, $member, $periodMonth, $data['budget_method']);
        $nextMonthDate = CarbonImmutable::createFromFormat('Y-m', $preview['next_period_month'])->startOfMonth()->toDateString();
        $currency = $this->resolveBaseCurrency($tenant);

        return DB::transaction(function () use ($tenant, $member, $data, $preview, $nextMonthDate, $currency) {
            $review = FinanceMonthReview::query()
                ->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'period_month' => $data['period_month']],
                    [
                        'status' => 'closed',
                        'started_by' => $member->id,
                        'started_at' => now(),
                        'closed_by' => $member->id,
                        'closed_at' => now(),
                        'snapshot_payload' => [
                            'budget_method' => $data['budget_method'],
                            'sweep_actions' => $data['sweep_actions'] ?? [],
                            'budget_drafts' => $data['budget_drafts'] ?? [],
                        ],
                    ]
                );

            if ($review->wasRecentlyCreated === false && $review->status === 'closed') {
                throw new RuntimeException('Periode ini sudah ditutup.');
            }

            if ($review->wasRecentlyCreated === false) {
                $review->update([
                    'status' => 'closed',
                    'closed_by' => $member->id,
                    'closed_at' => now(),
                    'snapshot_payload' => [
                        'budget_method' => $data['budget_method'],
                        'sweep_actions' => $data['sweep_actions'] ?? [],
                        'budget_drafts' => $data['budget_drafts'] ?? [],
                    ],
                ]);
            }

            foreach ($data['budget_drafts'] ?? [] as $draft) {
                $budget = TenantBudget::query()->firstOrNew([
                    'tenant_id' => $tenant->id,
                    'period_month' => $preview['next_period_month'],
                    'budget_key' => $draft['budget_key'],
                ]);

                $budget->fill([
                    'owner_member_id' => $draft['owner_member_id'] ?? null,
                    'pocket_id' => $draft['pocket_id'] ?? null,
                    'name' => $draft['name'],
                    'code' => $budget->code ?: strtoupper(substr($draft['budget_key'], 0, 40)),
                    'scope' => $draft['scope'],
                    'allocated_amount' => round((float) $draft['allocated_amount'], 2),
                    'spent_amount' => $budget->exists ? $budget->spent_amount : 0,
                    'remaining_amount' => round((float) $draft['allocated_amount'] - (float) ($budget->spent_amount ?? 0), 2),
                    'is_active' => true,
                    'row_version' => $budget->exists ? ((int) $budget->row_version + 1) : 1,
                ]);
                $budget->save();
            }

            foreach ($data['sweep_actions'] ?? [] as $action) {
                $amount = round((float) ($action['amount'] ?? 0), 2);
                if ($amount <= 0 || ($action['action'] ?? 'rollover') === 'rollover') {
                    continue;
                }

                $sourcePocket = $this->access->accessiblePocketsQuery($tenant, $member)
                    ->active()
                    ->whereKey($action['source_pocket_id'])
                    ->with('realAccount')
                    ->first();

                if (! $sourcePocket || ! $sourcePocket->realAccount) {
                    throw new RuntimeException('Wallet sumber sweep tidak valid.');
                }

                $targetPocket = null;
                if (($action['action'] ?? null) === 'sweep_to_wallet') {
                    $targetPocket = $this->access->accessiblePocketsQuery($tenant, $member)
                        ->active()
                        ->whereKey($action['target_pocket_id'] ?? null)
                        ->with('realAccount')
                        ->first();
                } elseif (($action['action'] ?? null) === 'sweep_to_goal') {
                    $goal = FinanceSavingsGoal::query()
                        ->forTenant($tenant->id)
                        ->with('pocket.realAccount')
                        ->find($action['goal_id'] ?? null);
                    $targetPocket = $goal?->pocket;
                }

                if (! $targetPocket || ! $targetPocket->realAccount) {
                    throw new RuntimeException('Tujuan sweep tidak valid.');
                }

                if ((string) $sourcePocket->id === (string) $targetPocket->id) {
                    continue;
                }

                if ($sourcePocket->currency_code !== $targetPocket->currency_code) {
                    throw new RuntimeException('Sweep hanya mendukung wallet dengan mata uang yang sama.');
                }

                if (! in_array($sourcePocket->realAccount->type, ['credit_card', 'paylater'], true)
                    && (float) $sourcePocket->current_balance < $amount) {
                    throw new RuntimeException("Saldo wallet {$sourcePocket->name} tidak cukup untuk sweep.");
                }

                $source = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $sourcePocket->owner_member_id ?: $member->id,
                    data: [
                        'type' => 'transfer',
                        'transaction_date' => $nextMonthDate,
                        'amount' => $amount,
                        'currency_code' => $sourcePocket->currency_code,
                        'description' => "Monthly review sweep ke {$targetPocket->name}",
                        'payment_method' => 'transfer',
                        'notes' => 'Generated by monthly review',
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'bank_account_id' => $sourcePocket->real_account_id,
                        'pocket_id' => $sourcePocket->id,
                        'transfer_direction' => 'out',
                        'is_internal_transfer' => true,
                    ],
                    currency: $currency,
                    rowVersion: 1,
                ));

                $target = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $targetPocket->owner_member_id ?: $member->id,
                    data: [
                        'type' => 'transfer',
                        'transaction_date' => $nextMonthDate,
                        'amount' => $amount,
                        'currency_code' => $targetPocket->currency_code,
                        'description' => "Monthly review sweep dari {$sourcePocket->name}",
                        'payment_method' => 'transfer',
                        'notes' => 'Generated by monthly review',
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'bank_account_id' => $targetPocket->real_account_id,
                        'pocket_id' => $targetPocket->id,
                        'transfer_direction' => 'in',
                        'is_internal_transfer' => true,
                    ],
                    currency: $currency,
                    rowVersion: 1,
                ));

                $source->update(['transfer_pair_id' => $target->id]);
                $target->update(['transfer_pair_id' => $source->id]);
                $this->ledger->syncAfterCreate($source);
                $this->ledger->syncAfterCreate($target);
            }

            return [
                'period_month' => $review->period_month,
                'status' => $review->status,
                'closed_at' => $review->closed_at?->toIso8601String(),
                'next_period_month' => $preview['next_period_month'],
            ];
        });
    }

    private function eligibleMonths(Tenant $tenant, ?TenantMember $member): array
    {
        $currentMonth = now()->format('Y-m');

        return $this->access->visibleTransactionsQuery($tenant, $member)
            ->selectRaw("substr(cast(transaction_date as text), 1, 7) as period_month")
            ->whereRaw("substr(cast(transaction_date as text), 1, 7) < ?", [$currentMonth])
            ->distinct()
            ->orderByDesc('period_month')
            ->pluck('period_month')
            ->filter()
            ->values()
            ->all();
    }

    private function assertReviewableMonth(Tenant $tenant, ?TenantMember $member, string $periodMonth): void
    {
        if (! in_array($periodMonth, $this->eligibleMonths($tenant, $member), true)) {
            throw new RuntimeException('Periode monthly review tidak tersedia.');
        }
    }

    private function cumulativeDeltas(Tenant $tenant, ?TenantMember $member, string $groupColumn, string $dateTo): array
    {
        return $this->access->visibleTransactionsQuery($tenant, $member)
            ->whereNotNull($groupColumn)
            ->whereDate('transaction_date', '<=', $dateTo)
            ->selectRaw("{$groupColumn} as aggregate_key")
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type = 'pemasukan' THEN amount
                        WHEN type = 'pengeluaran' THEN -amount
                        WHEN type = 'transfer' AND transfer_direction = 'in' THEN amount
                        WHEN type = 'transfer' AND transfer_direction = 'out' THEN -amount
                        ELSE 0
                    END
                ), 0) as delta
            ")
            ->groupBy($groupColumn)
            ->get()
            ->mapWithKeys(fn ($row) => [$row->aggregate_key => (float) $row->delta])
            ->all();
    }

    private function periodPocketFlows(Tenant $tenant, ?TenantMember $member, string $dateFrom, string $dateTo): array
    {
        return $this->access->visibleTransactionsQuery($tenant, $member)
            ->whereNotNull('pocket_id')
            ->whereBetween('transaction_date', [$dateFrom, $dateTo])
            ->selectRaw('pocket_id')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'pemasukan' OR (type = 'transfer' AND transfer_direction = 'in') THEN amount ELSE 0 END), 0) as inflow
            ")
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' OR (type = 'transfer' AND transfer_direction = 'out') THEN amount ELSE 0 END), 0) as outflow
            ")
            ->groupBy('pocket_id')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->pocket_id => ['inflow' => (float) $row->inflow, 'outflow' => (float) $row->outflow]])
            ->all();
    }

    private function buildBudgetDrafts(Tenant $tenant, ?TenantMember $member, string $periodMonth, string $budgetMethod): Collection
    {
        $sourceBudgets = $this->access->accessibleBudgetsQuery($tenant, $member)
            ->active()
            ->forPeriod($periodMonth)
            ->orderBy('name')
            ->get();
        $nextMonth = CarbonImmutable::createFromFormat('Y-m', $periodMonth)->addMonth()->format('Y-m');

        return $sourceBudgets->map(function ($budget) use ($tenant, $member, $budgetMethod, $periodMonth, $nextMonth) {
            $allocated = match ($budgetMethod) {
                'zero_based' => 0.0,
                'average_3_months' => $this->averageSpentByBudgetKey($tenant, $member, (string) $budget->budget_key, $periodMonth),
                default => (float) $budget->allocated_amount,
            };

            $nextBudget = TenantBudget::query()
                ->forTenant($tenant->id)
                ->where('period_month', $nextMonth)
                ->where('budget_key', $budget->budget_key)
                ->first();

            return [
                'budget_key' => (string) $budget->budget_key,
                'name' => $budget->name,
                'scope' => $budget->scope,
                'owner_member_id' => $budget->owner_member_id,
                'pocket_id' => $budget->pocket_id,
                'period_month' => $nextMonth,
                'allocated_amount' => round($allocated, 2),
                'existing_budget_id' => $nextBudget?->id,
                'existing_allocated_amount' => $nextBudget ? round((float) $nextBudget->allocated_amount, 2) : null,
            ];
        })->values();
    }

    private function averageSpentByBudgetKey(Tenant $tenant, ?TenantMember $member, string $budgetKey, string $periodMonth): float
    {
        if ($budgetKey === '') {
            return 0.0;
        }

        $months = collect(range(0, 2))
            ->map(fn (int $offset) => CarbonImmutable::createFromFormat('Y-m', $periodMonth)->subMonths($offset)->format('Y-m'))
            ->values();

        $spent = $this->access->visibleTransactionsQuery($tenant, $member)
            ->where('type', 'pengeluaran')
            ->whereHas('budget', function ($query) use ($months, $budgetKey): void {
                $query->where('budget_key', $budgetKey)->whereIn('period_month', $months);
            })
            ->selectRaw("substr(cast(transaction_date as text), 1, 7) as period_month")
            ->selectRaw('COALESCE(SUM(amount_base), 0) as spent')
            ->groupBy('period_month')
            ->get();

        if ($spent->isEmpty()) {
            return 0.0;
        }

        return round((float) $spent->avg('spent'), 2);
    }

    private function resolveBaseCurrency(Tenant $tenant): TenantCurrency
    {
        return TenantCurrency::query()
            ->where('tenant_id', $tenant->id)
            ->where('code', $tenant->currency_code ?? 'IDR')
            ->firstOrFail();
    }
}
