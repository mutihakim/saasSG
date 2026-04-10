<?php

namespace App\Services\Finance\Transactions;

use App\Http\Requests\StoreFinanceTransactionRequest;
use App\Models\Misc\ActivityLog;
use App\Models\Finance\FinanceWallet;
use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FinanceTransferService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceTransactionAuditService $audit,
        private readonly FinanceTransactionPayloadService $payloads,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceTransactionResourceResolverService $resolver,
        private readonly FinanceWalletService $walletPockets,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function store(
        StoreFinanceTransactionRequest $request,
        Tenant $tenant,
        TenantMember $member,
        array $data,
        bool $isRecurring,
    ): JsonResponse {
        if ($isRecurring) {
            return response()->json(['ok' => false, 'message' => 'Transfer internal tidak mendukung recurring.'], 422);
        }

        $periodMonth = substr((string) ($data['transaction_date'] ?? now()->toDateString()), 0, 7);
        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $periodMonth)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        $currency = $this->resolver->resolveCurrency($tenant, $data['currency_code']);
        if (! $currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $fromPocket = $this->resolver->resolveUsablePocket($tenant, $member, $data['from_wallet_id'] ?? null);
        $toPocket = $this->resolver->resolveTenantActivePocket($tenant, $data['to_wallet_id'] ?? null);

        if (! $fromPocket && ! empty($data['from_account_id'])) {
            $fromAccount = $this->resolver->resolveUsableAccount($tenant, $member, $data['from_account_id']);
            $fromPocket = $fromAccount ? $this->walletPockets->resolveMainPocketForAccount($fromAccount) : null;
        }

        if (! $toPocket && ! empty($data['to_account_id'])) {
            $toAccount = $this->resolver->resolveTenantActiveAccount($tenant, $data['to_account_id']);
            $toPocket = $toAccount ? $this->walletPockets->resolveMainPocketForAccount($toAccount) : null;
        }

        $fromAccount = $fromPocket
            ? $this->resolver->resolveUsableAccount($tenant, $member, (string) $fromPocket->real_account_id)
            : null;
        $toAccount = $toPocket
            ? $this->resolver->resolveTenantActiveAccount($tenant, (string) $toPocket->real_account_id)
            : null;

        if (! $fromAccount || ! $toAccount || ! $fromPocket || ! $toPocket) {
            return response()->json(['ok' => false, 'message' => 'Wallet asal atau tujuan tidak ditemukan / tidak dapat diakses.'], 422);
        }

        if ($fromPocket->id === $toPocket->id) {
            return response()->json(['ok' => false, 'message' => 'Wallet asal dan tujuan harus berbeda.'], 422);
        }

        if ($fromAccount->currency_code !== $toAccount->currency_code || $fromAccount->currency_code !== $data['currency_code']) {
            return response()->json(['ok' => false, 'message' => 'Transfer hanya mendukung wallet dengan mata uang yang sama.'], 422);
        }

        $sourceOwner = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $targetOwner = $this->access->resolveTransactionOwner($member, $tenant, $data['recipient_member_id'] ?? null) ?? $sourceOwner;

        try {
            $transactions = DB::transaction(function () use ($request, $tenant, $member, $sourceOwner, $targetOwner, $fromAccount, $toAccount, $fromPocket, $toPocket, $data, $currency) {
                $lockedAccounts = TenantBankAccount::query()
                    ->whereIn('id', array_values(array_unique([$fromAccount->id, $toAccount->id])))
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $lockedPockets = FinanceWallet::query()
                    ->whereIn('id', array_values(array_unique([$fromPocket->id, $toPocket->id])))
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                /** @var TenantBankAccount|null $lockedFromAccount */
                $lockedFromAccount = $lockedAccounts->get($fromAccount->id);
                /** @var TenantBankAccount|null $lockedToAccount */
                $lockedToAccount = $lockedAccounts->get($toAccount->id);
                /** @var FinanceWallet|null $lockedFromPocket */
                $lockedFromPocket = $lockedPockets->get($fromPocket->id);
                /** @var FinanceWallet|null $lockedToPocket */
                $lockedToPocket = $lockedPockets->get($toPocket->id);

                if (! $lockedFromAccount || ! $lockedToAccount || ! $lockedFromPocket || ! $lockedToPocket) {
                    throw new \RuntimeException('Locked transfer resources not found.');
                }

                if (! in_array($lockedFromAccount->type, ['credit_card', 'paylater'], true) && (float) $lockedFromPocket->current_balance < (float) $data['amount']) {
                    return response()->json(['ok' => false, 'message' => 'Saldo wallet asal tidak cukup untuk transfer.'], 422);
                }

                $source = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $sourceOwner?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $lockedFromAccount->id,
                        'wallet_id' => $lockedFromPocket->id,
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'transfer_direction' => 'out',
                        'description' => $data['description'] ?: "Transfer ke {$lockedToPocket->name}",
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $target = FinanceTransaction::create($this->payloads->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $targetOwner?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $lockedToAccount->id,
                        'wallet_id' => $lockedToPocket->id,
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'transfer_direction' => 'in',
                        'description' => $data['description'] ?: "Transfer dari {$lockedFromPocket->name}",
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $source->update(['transfer_pair_id' => $target->id]);
                $target->update(['transfer_pair_id' => $source->id]);

                $this->ledger->syncAfterCreate($source);
                $this->ledger->syncAfterCreate($target);

                ActivityLog::create($this->audit->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $source->id,
                    before: null,
                    after: $this->audit->snapshotTransaction($source->fresh($this->presenter->relations())),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                ActivityLog::create($this->audit->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $target->id,
                    before: null,
                    after: $this->audit->snapshotTransaction($target->fresh($this->presenter->relations())),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                return [
                    $source->fresh($this->presenter->relations()),
                    $target->fresh($this->presenter->relations()),
                ];
            });

            if ($transactions instanceof JsonResponse) {
                return $transactions;
            }

            return response()->json([
                'ok' => true,
                'data' => [
                    'transaction' => $this->presenter->transaction($tenant, $transactions[0]),
                    'paired_transaction' => $this->presenter->transaction($tenant, $transactions[1]),
                ],
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal menyimpan transfer.'], 500);
        }
    }
}
