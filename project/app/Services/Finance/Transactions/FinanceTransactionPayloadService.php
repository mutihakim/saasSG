<?php

namespace App\Services\Finance\Transactions;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBudget;
use App\Models\TenantCurrency;
use App\Models\TenantRecurringRule;

class FinanceTransactionPayloadService
{
    public function transactionPayload(
        Tenant $tenant,
        ?int $actorMemberId,
        ?int $ownerMemberId,
        array $data,
        TenantCurrency $currency,
        int $rowVersion,
        bool $isUpdate = false,
    ): array {
        $baseCurrency = $tenant->currency_code ?? 'IDR';
        $exchangeRate = (float) ($data['exchange_rate'] ?? 1.0);

        if ($data['currency_code'] === $baseCurrency) {
            $exchangeRate = 1.0;
        }

        $payload = [
            'tenant_id' => $tenant->id,
            'category_id' => $data['category_id'] ?? null,
            'currency_id' => $currency->id,
            'base_currency_code' => $baseCurrency,
            'type' => $data['type'],
            'transaction_date' => $data['transaction_date'],
            'amount' => $data['amount'],
            'exchange_rate' => $exchangeRate,
            'description' => $data['description'],
            'payment_method' => $data['payment_method'] ?? null,
            'notes' => $data['notes'] ?? null,
            'reference_number' => $data['reference_number'] ?? null,
            'merchant_name' => $data['merchant_name'] ?? null,
            'location' => $data['location'] ?? null,
            'source_type' => $data['source_type'] ?? null,
            'source_id' => $data['source_id'] ?? null,
            'budget_id' => $data['budget_id'] ?? null,
            'budget_status' => $data['budget_status'] ?? 'unbudgeted',
            'budget_delta' => $data['budget_delta'] ?? 0,
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'pocket_id' => $data['pocket_id'] ?? null,
            'is_internal_transfer' => (bool) ($data['is_internal_transfer'] ?? $data['type'] === 'transfer'),
            'transfer_direction' => $data['transfer_direction'] ?? null,
            'transfer_pair_id' => $data['transfer_pair_id'] ?? null,
            'row_version' => $rowVersion,
        ];

        $payload[$isUpdate ? 'updated_by' : 'created_by'] = $actorMemberId;
        $payload['owner_member_id'] = $ownerMemberId ?? $actorMemberId;

        return $payload;
    }

    public function syncRecurringRule(FinanceTransaction $transaction, int $tenantId, array $data, bool $isRecurring): void
    {
        if ($isRecurring && ! empty($data['recurring_freq'])) {
            TenantRecurringRule::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'ruleable_type' => FinanceTransaction::class,
                    'ruleable_id' => $transaction->id,
                ],
                [
                    'frequency' => $data['recurring_freq'],
                    'interval' => 1,
                    'start_date' => $data['transaction_date'],
                    'end_date' => $data['recurring_end_date'] ?? null,
                    'next_run_at' => $data['transaction_date'],
                    'is_active' => true,
                    'row_version' => 1,
                ]
            );

            return;
        }

        $transaction->recurringRule?->delete();
    }

    public function resolveBudgetStatus(string $type, ?TenantBudget $budget, float $amountBase): array
    {
        if ($type !== 'pengeluaran' || ! $budget) {
            return ['unbudgeted', 0];
        }

        $remainingAfter = round((float) $budget->remaining_amount - $amountBase, 2);

        return [
            $remainingAfter < 0 ? 'over_budget' : 'within_budget',
            $remainingAfter,
        ];
    }
}
