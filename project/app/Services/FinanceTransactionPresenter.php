<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;

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
            'budget:id,name,period_month,allocated_amount,spent_amount,remaining_amount',
            'tags:id,name,color',
            'attachments',
            'recurringRule',
        ];
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

        return $payload;
    }
}
