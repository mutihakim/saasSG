<?php

namespace App\Services\Finance\Transactions;

use App\Http\Requests\StoreFinanceTransactionRequest;
use App\Models\Misc\ActivityLog;
use App\Models\Finance\FinanceTransaction;
use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\FinanceSummaryService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\TagService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FinanceTransactionStoreService
{
    public function __construct(
        private readonly FinanceSummaryService $summary,
        private readonly TagService $tags,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly FinanceAccessService $access,
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceTransactionAuditService $audit,
        private readonly FinanceTransactionPayloadService $payloads,
        private readonly FinanceTransactionResourceResolverService $resolver,
        private readonly FinanceTransferService $transfers,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function store(StoreFinanceTransactionRequest $request, Tenant $tenant): JsonResponse
    {
        $limit = $this->entitlements->limit($tenant, 'finance.monthly_tx.max');
        if ($limit === null) {
            $limit = -1;
        }

        if ($limit !== -1) {
            $monthlyCount = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', now()->year)
                ->whereMonth('transaction_date', now()->month)
                ->count();

            if ($monthlyCount >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'message' => "Batas {$limit} transaksi/bulan tercapai. Upgrade plan untuk lebih banyak.",
                ], 422);
            }
        }

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        if (! $member) {
            return response()->json(['ok' => false, 'message' => 'Profil anggota tidak ditemukan.'], 403);
        }

        $data = $request->validated();
        $isRecurring = (bool) ($data['is_recurring'] ?? false);

        $month = date('Y-m', strtotime($data['transaction_date']));
        if ($this->monthlyReview->isMonthClosed($tenant, $month)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_CLOSED',
                'message' => "Bulan {$month} sudah tutup buku dan tidak dapat ditambah transaksi baru.",
            ], 422);
        }

        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $month)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        if (($data['type'] ?? null) === 'transfer') {
            $response = $this->transfers->store($request, $tenant, $member, $data, $isRecurring);
            if ($response->getStatusCode() < 400) {
                $this->summary->invalidate($tenant->id, date('Y-m', strtotime($data['transaction_date'])));
            }

            return $response;
        }

        $currency = $this->resolver->resolveCurrency($tenant, $data['currency_code']);
        if (! $currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $ownerMember = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $account = $this->resolver->resolveTransactionAccount($tenant, $member, $data['bank_account_id'] ?? null, $data['wallet_id'] ?? null);
        $pocket = $this->resolver->resolveTransactionPocket($tenant, $member, $account, $data['wallet_id'] ?? null);
        $budget = $this->resolver->resolveBudgetForPocket($tenant, $member, $data['budget_id'] ?? null, $pocket, $data['transaction_date'] ?? null);

        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun sumber transaksi tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (! $pocket) {
            return response()->json(['ok' => false, 'message' => 'Pocket transaksi tidak ditemukan, tidak bisa diakses, atau tidak sesuai dengan akun yang dipilih.'], 422);
        }

        if ($pocket->budget_lock_enabled) {
            $budget = $this->resolver->resolvePocketDefaultBudget($tenant, $member, $pocket, date('Y-m', strtotime($data['transaction_date'] ?? now()->toDateString())));
        }

        if ($pocket->budget_lock_enabled && ! $budget) {
            return response()->json(['ok' => false, 'message' => 'Budget lock wallet tidak valid atau tidak bisa diakses.'], 422);
        }

        if (($data['budget_id'] ?? null) && ! $budget) {
            return response()->json(['ok' => false, 'message' => 'Budget tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if ($account->currency_code !== $data['currency_code']) {
            return response()->json(['ok' => false, 'message' => 'Mata uang transaksi harus sama dengan mata uang akun.'], 422);
        }

        try {
            $transaction = DB::transaction(function () use ($request, $tenant, $member, $ownerMember, $account, $pocket, $budget, $data, $currency, $isRecurring) {
                /** @var TenantBankAccount|null $lockedAccount */
                $lockedAccount = TenantBankAccount::query()
                    ->whereKey($account->id)
                    ->lockForUpdate()
                    ->first();

                /** @var FinanceWallet|null $lockedPocket */
                $lockedPocket = FinanceWallet::query()
                    ->whereKey($pocket->id)
                    ->lockForUpdate()
                    ->first();

                /** @var TenantBudget|null $lockedBudget */
                $lockedBudget = $budget
                    ? TenantBudget::query()->whereKey($budget->id)->lockForUpdate()->first()
                    : null;

                if (! $lockedAccount || ! $lockedPocket) {
                    throw new \RuntimeException('Locked finance resources not found.');
                }

                if ($balanceError = $this->guardNonNegativeBalance($data['type'], (float) $data['amount'], $lockedAccount, $lockedPocket)) {
                    return $balanceError;
                }

                [$budgetStatus, $budgetDelta] = $this->payloads->resolveBudgetStatus(
                    $data['type'],
                    $lockedBudget,
                    (float) $data['amount'] * (float) ($data['exchange_rate'] ?? 1),
                );

                $transaction = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $ownerMember?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $lockedAccount->id,
                        'wallet_id' => $lockedPocket->id,
                        'budget_id' => $lockedBudget?->id,
                        'budget_status' => $budgetStatus,
                        'budget_delta' => $budgetDelta,
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $this->tags->syncTags($transaction, $tenant->id, $data['tags'] ?? []);
                $this->payloads->syncRecurringRule($transaction, $tenant->id, $data, $isRecurring);
                $this->ledger->syncAfterCreate($transaction);

                $fresh = $transaction->fresh($this->presenter->relations());

                ActivityLog::create($this->audit->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $transaction->id,
                    before: null,
                    after: $this->audit->snapshotTransaction($fresh),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                return $fresh;
            });

            if ($transaction instanceof JsonResponse) {
                return $transaction;
            }

            $this->summary->invalidate($tenant->id, date('Y-m', strtotime($data['transaction_date'])));

            return response()->json([
                'ok' => true,
                'data' => ['transaction' => $this->presenter->transaction($tenant, $transaction)],
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal menyimpan transaksi.'], 500);
        }
    }

    private function guardNonNegativeBalance(
        string $type,
        float $amount,
        TenantBankAccount $account,
        FinanceWallet $pocket,
    ): ?JsonResponse {
        if ($this->isLiabilityType($account->type) || $type !== 'pengeluaran') {
            return null;
        }

        $projectedPocketBalance = round(((float) $pocket->current_balance) - $amount, 2);
        if ($projectedPocketBalance < 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Saldo wallet tidak cukup. Transfer dana ke wallet ini terlebih dahulu.',
            ], 422);
        }

        $projectedAccountBalance = round(((float) $account->current_balance) - $amount, 2);
        if ($projectedAccountBalance < 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Saldo akun tidak cukup untuk transaksi ini.',
            ], 422);
        }

        return null;
    }

    private function isLiabilityType(?string $accountType): bool
    {
        return in_array($accountType, ['credit_card', 'paylater'], true);
    }
}
