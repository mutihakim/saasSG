<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class FinanceTransactionAuditService
{
    public function snapshotTransaction(FinanceTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type?->value ?? $transaction->type,
            'transaction_date' => optional($transaction->transaction_date)->toDateString(),
            'amount' => (string) $transaction->amount,
            'amount_base' => (string) $transaction->amount_base,
            'description' => $transaction->description,
            'category_id' => $transaction->category_id,
            'currency_id' => $transaction->currency_id,
            'owner_member_id' => $transaction->owner_member_id,
            'payment_method' => $transaction->payment_method?->value ?? $transaction->payment_method,
            'merchant_name' => $transaction->merchant_name,
            'location' => $transaction->location,
            'notes' => $transaction->notes,
            'reference_number' => $transaction->reference_number,
            'source_type' => $transaction->source_type,
            'source_id' => $transaction->source_id,
            'budget_id' => $transaction->budget_id,
            'budget_status' => $transaction->budget_status,
            'budget_delta' => (string) $transaction->budget_delta,
            'bank_account_id' => $transaction->bank_account_id,
            'is_internal_transfer' => (bool) $transaction->is_internal_transfer,
            'transfer_direction' => $transaction->transfer_direction,
            'transfer_pair_id' => $transaction->transfer_pair_id,
            'row_version' => $transaction->row_version,
            'tags' => $transaction->relationLoaded('tags') ? $transaction->tags->pluck('name')->values()->all() : [],
            'recurring_rule' => $transaction->relationLoaded('recurringRule') && $transaction->recurringRule
                ? Arr::only($transaction->recurringRule->toArray(), ['frequency', 'interval', 'start_date', 'end_date', 'next_run_at', 'is_active'])
                : null,
        ];
    }

    public function makeActivityLogPayload(
        Request $request,
        int $tenantId,
        ?int $actorMemberId,
        string $action,
        string $targetId,
        ?array $before,
        ?array $after,
        ?int $beforeVersion,
        ?int $afterVersion,
    ): array {
        return [
            'tenant_id' => $tenantId,
            'actor_user_id' => $request->user()?->id,
            'actor_member_id' => $actorMemberId,
            'action' => $action,
            'target_type' => 'finance_transactions',
            'target_id' => $targetId,
            'changes' => array_filter([
                'before' => $before,
                'after' => $after,
            ], fn ($value) => $value !== null),
            'metadata' => [
                'channel' => 'api',
                'tags' => $after['tags'] ?? $before['tags'] ?? [],
                'has_recurring_rule' => ($after['recurring_rule'] ?? $before['recurring_rule'] ?? null) !== null,
                'is_internal_transfer' => $after['is_internal_transfer'] ?? $before['is_internal_transfer'] ?? false,
                'transfer_direction' => $after['transfer_direction'] ?? $before['transfer_direction'] ?? null,
                'source_type' => $after['source_type'] ?? $before['source_type'] ?? null,
                'source_id' => $after['source_id'] ?? $before['source_id'] ?? null,
            ],
            'request_id' => (string) $request->header('X-Request-Id', $request->fingerprint()),
            'occurred_at' => now()->utc(),
            'result_status' => 'success',
            'before_version' => $beforeVersion,
            'after_version' => $afterVersion,
            'source_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];
    }
}
