<?php

namespace App\Services\Finance\Transactions;

use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Misc\TenantAttachment;
use App\Services\Finance\FinanceAttachmentService;

class FinanceTransactionPresenter
{
    public function __construct(
        private readonly FinanceAttachmentService $attachments,
    ) {
    }

    public function relations(): array
    {
        return [
            'category:id,name,icon,color',
            'currency:id,code,symbol,decimal_places',
            'createdBy:id,full_name',
            'ownerMember:id,full_name',
            'updatedBy:id,full_name',
            'approvedBy:id,full_name',
            'bankAccount:id,name,type,currency_code',
            'wallet:id,name,type,reference_code,real_account_id,currency_code,icon_key,default_budget_id,default_budget_key,budget_lock_enabled',
            'wallet.defaultBudget:id,name,period_month,wallet_id,budget_key',
            'budget:id,name,period_month,allocated_amount,spent_amount,remaining_amount,wallet_id,budget_key',
            'tags:id,name,color',
            'attachments',
            'recurringRule',
            'pairedTransfer:id,tenant_id,type,transaction_date,amount,description,bank_account_id,wallet_id,transfer_direction,transfer_pair_id',
            'pairedTransfer.bankAccount:id,name,type,currency_code',
            'pairedTransfer.wallet:id,name,type,reference_code,real_account_id,currency_code,icon_key,default_budget_id,default_budget_key,budget_lock_enabled',
            'pairedTransfer.wallet.defaultBudget:id,name,period_month,wallet_id,budget_key',
        ];
    }

    public function relationsForList(): array
    {
        return [
            'category:id,name,icon,color',
            'currency:id,code,symbol,decimal_places',
            'ownerMember:id,full_name',
            'bankAccount:id,name',
        ];
    }

    public function transactionForList(FinanceTransaction $transaction): array
    {
        return $transaction->toArray();
    }

    public function transaction(Tenant $tenant, FinanceTransaction $transaction): array
    {
        $payload = $transaction->toArray();
        $attachments = $transaction->relationLoaded('attachments')
            ? $transaction->attachments
            : $transaction->attachments()->get();

        $payload['attachments'] = collect($attachments)
            ->map(fn (TenantAttachment $attachment) => $this->attachments->payload($tenant, $transaction, $attachment))
            ->values()
            ->all();

        // Backward compatibility: keep both wallet and pocket keys during transition.
        $resolvedWallet = $payload['wallet'] ?? ($transaction->relationLoaded('wallet') ? $transaction->wallet?->toArray() : null);
        $payload['wallet'] = $resolvedWallet;
        if (! array_key_exists('pocket', $payload) || $payload['pocket'] === null) {
            $payload['pocket'] = $resolvedWallet;
        }

        if ($transaction->relationLoaded('pairedTransfer') && $transaction->pairedTransfer) {
            $pair = $transaction->pairedTransfer;
            $pairWallet = $pair->relationLoaded('wallet') ? $pair->wallet?->toArray() : null;
            $payload['paired_transaction'] = [
                'id' => $pair->id,
                'type' => $pair->type?->value ?? $pair->type,
                'transaction_date' => $pair->transaction_date,
                'amount' => $pair->amount,
                'description' => $pair->description,
                'transfer_direction' => $pair->transfer_direction,
                'bank_account_id' => $pair->bank_account_id,
                'bank_account' => $pair->relationLoaded('bankAccount') ? $pair->bankAccount?->toArray() : null,
                'wallet_id' => $pair->wallet_id,
                'wallet' => $pairWallet,
                'pocket' => $pairWallet,
                'transfer_pair_id' => $pair->transfer_pair_id,
            ];
        }

        return $payload;
    }
}
