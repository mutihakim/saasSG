<?php

namespace App\Services\Finance\Transactions;

use App\Http\Requests\UpdateFinanceTransactionRequest;
use App\Models\ActivityLog;
use App\Models\FinanceTransaction;
use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\FinanceSummaryService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\TagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FinanceTransactionUpdateService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceSummaryService $summary,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceTransactionAuditService $audit,
        private readonly FinanceTransactionPayloadService $payloads,
        private readonly FinanceTransactionResourceResolverService $resolver,
        private readonly TagService $tags,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function update(UpdateFinanceTransactionRequest $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $data = $request->validated();
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $oldMonth = date('Y-m', strtotime((string) $transaction->transaction_date));
        $newMonth = date('Y-m', strtotime($data['transaction_date'] ?? $transaction->transaction_date));

        if ($this->monthlyReview->isMonthClosed($tenant, $oldMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_CLOSED',
                'message' => "Bulan {$oldMonth} sudah tutup buku dan tidak dapat diubah lagi.",
            ], 422);
        }

        if ($this->monthlyReview->isMonthClosed($tenant, $newMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_CLOSED',
                'message' => "Bulan {$newMonth} sudah tutup buku dan tidak dapat dipindah ke bulan tersebut.",
            ], 422);
        }

        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $oldMonth) || $this->monthlyReview->isPlanningBlockedForPeriod($tenant, $newMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        if (($transaction->type?->value ?? $transaction->type) === 'transfer' || ($data['type'] ?? null) === 'transfer') {
            return response()->json([
                'ok' => false,
                'error_code' => 'TRANSFER_UPDATE_NOT_SUPPORTED',
                'message' => 'Transfer internal harus dihapus dan dibuat ulang agar saldo tetap konsisten.',
            ], 422);
        }

        if ((int) $transaction->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Transaksi diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $currency = $this->resolver->resolveCurrency($tenant, $data['currency_code']);
        if (! $currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $ownerMember = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $account = $this->resolver->resolveTransactionAccount($tenant, $member, $data['bank_account_id'] ?? null, $data['pocket_id'] ?? null);
        $pocket = $this->resolver->resolveTransactionPocket($tenant, $member, $account, $data['pocket_id'] ?? null);
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

        $oldAccount = TenantBankAccount::query()->find($transaction->bank_account_id);
        $oldPocket = FinancePocket::query()->find($transaction->pocket_id);

        if ($balanceError = $this->guardNonNegativeBalance($transaction, $oldAccount, $oldPocket, $data['type'], (float) $data['amount'], $account, $pocket)) {
            return $balanceError;
        }

        [$budgetStatus, $budgetDelta] = $this->payloads->resolveBudgetStatus(
            $data['type'],
            $budget,
            (float) $data['amount'] * (float) ($data['exchange_rate'] ?? 1),
        );
        $isRecurring = (bool) ($data['is_recurring'] ?? false);

        try {
            $beforeModel = $transaction->fresh(['tags', 'recurringRule', 'bankAccount', 'budget', 'ownerMember']);
            $before = $this->audit->snapshotTransaction($beforeModel);

            $updated = DB::transaction(function () use ($request, $tenant, $member, $ownerMember, $account, $pocket, $budget, $data, $currency, $isRecurring, $transaction, $beforeModel, $before, $budgetStatus, $budgetDelta) {
                $nextVersion = $transaction->row_version + 1;

                $transaction->update($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member?->id,
                    ownerMemberId: $ownerMember?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $account->id,
                        'pocket_id' => $pocket->id,
                        'budget_id' => $budget?->id,
                        'budget_status' => $budgetStatus,
                        'budget_delta' => $budgetDelta,
                    ]),
                    currency: $currency,
                    rowVersion: $nextVersion,
                    isUpdate: true,
                ));

                $this->tags->syncTags($transaction, $tenant->id, $data['tags'] ?? []);
                $this->payloads->syncRecurringRule($transaction, $tenant->id, $data, $isRecurring);
                $this->ledger->syncAfterUpdate($beforeModel, $transaction->fresh());

                $fresh = $transaction->fresh($this->presenter->relations());

                ActivityLog::create($this->audit->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member?->id,
                    action: 'finance.transaction.updated',
                    targetId: $transaction->id,
                    before: $before,
                    after: $this->audit->snapshotTransaction($fresh),
                    beforeVersion: (int) $before['row_version'],
                    afterVersion: $nextVersion,
                ));

                return $fresh;
            });

            $this->summary->invalidate($tenant->id, $oldMonth);
            if ($newMonth !== $oldMonth) {
                $this->summary->invalidate($tenant->id, $newMonth);
            }

            return response()->json([
                'ok' => true,
                'data' => ['transaction' => $this->presenter->transaction($tenant, $updated)],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal memperbarui transaksi.'], 500);
        }
    }

    private function guardNonNegativeBalance(
        FinanceTransaction $existingTransaction,
        ?TenantBankAccount $oldAccount,
        ?FinancePocket $oldPocket,
        string $newType,
        float $newAmount,
        TenantBankAccount $newAccount,
        FinancePocket $newPocket,
    ): ?JsonResponse {
        $oldDelta = $this->transactionDelta(
            $existingTransaction->type?->value ?? (string) $existingTransaction->type,
            (float) $existingTransaction->amount,
        );
        $newDelta = $this->transactionDelta($newType, $newAmount);

        $accountProjections = [];
        if ($oldAccount) {
            $accountProjections[(string) $oldAccount->id] = [
                'account' => $oldAccount,
                'balance' => round(((float) $oldAccount->current_balance) - $oldDelta, 2),
            ];
        }

        if (isset($accountProjections[(string) $newAccount->id])) {
            $accountProjections[(string) $newAccount->id]['balance'] = round($accountProjections[(string) $newAccount->id]['balance'] + $newDelta, 2);
        } else {
            $accountProjections[(string) $newAccount->id] = [
                'account' => $newAccount,
                'balance' => round(((float) $newAccount->current_balance) + $newDelta, 2),
            ];
        }

        $pocketProjections = [];
        if ($oldPocket) {
            $pocketProjections[(string) $oldPocket->id] = [
                'pocket' => $oldPocket,
                'balance' => round(((float) $oldPocket->current_balance) - $oldDelta, 2),
            ];
        }

        if (isset($pocketProjections[(string) $newPocket->id])) {
            $pocketProjections[(string) $newPocket->id]['balance'] = round($pocketProjections[(string) $newPocket->id]['balance'] + $newDelta, 2);
        } else {
            $pocketProjections[(string) $newPocket->id] = [
                'pocket' => $newPocket,
                'balance' => round(((float) $newPocket->current_balance) + $newDelta, 2),
            ];
        }

        foreach ($accountProjections as $projection) {
            /** @var TenantBankAccount $account */
            $account = $projection['account'];
            if ($this->isLiabilityType($account->type)) {
                continue;
            }

            if ((float) $projection['balance'] < 0) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Saldo akun tidak cukup untuk perubahan transaksi ini.',
                ], 422);
            }
        }

        foreach ($pocketProjections as $projection) {
            /** @var FinancePocket $pocket */
            $pocket = $projection['pocket'];
            $account = isset($accountProjections[(string) $pocket->real_account_id])
                ? $accountProjections[(string) $pocket->real_account_id]['account']
                : TenantBankAccount::query()->find($pocket->real_account_id);

            if (! $account || $this->isLiabilityType($account->type)) {
                continue;
            }

            if ((float) $projection['balance'] < 0) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Saldo wallet tidak cukup. Transfer dana ke wallet ini terlebih dahulu.',
                ], 422);
            }
        }

        return null;
    }

    private function transactionDelta(string $type, float $amount): float
    {
        return match ($type) {
            'pemasukan' => $amount,
            'pengeluaran' => -$amount,
            default => 0.0,
        };
    }

    private function isLiabilityType(?string $accountType): bool
    {
        return in_array($accountType, ['credit_card', 'paylater'], true);
    }
}
