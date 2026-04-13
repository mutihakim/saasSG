<?php

namespace App\Services\Finance\Whatsapp\Managers;

use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappIntent;
use App\Services\Whatsapp\WhatsappMessageReplySender;

class WhatsappReplyManager
{
    public function __construct(
        private readonly WhatsappMessageReplySender $replySender,
    ) {}

    public function sendReply(Tenant $tenant, string $senderJid, string $message): void
    {
        $this->replySender->sendReply($tenant, $senderJid, $message);
    }

    public function buildReviewUrl(Tenant $tenant, TenantWhatsappIntent $intent): string
    {
        $base = str_replace('{tenant}', $tenant->slug, (string) config('whatsapp.finance.app_url_template'));
        $action = $intent->intent_type === 'bulk_shopping' ? 'batch-review' : 'create';

        return $base.'?'.http_build_query([
            'source' => 'wa',
            'action' => $action,
            'intent' => $intent->token,
        ]);
    }

    public function buildSubmissionConfirmationMessage(
        Tenant $tenant,
        TenantWhatsappIntent $intent,
        ?TenantMember $member,
        ?int $submittedCount = null,
        ?array $transactionIds = null,
    ): string {
        $transactions = $this->resolveSubmittedTransactions($tenant, $transactionIds);
        if ($transactions->isNotEmpty()) {
            $memberName = trim((string) ($intent->member?->full_name ?? $member?->full_name ?? 'Member'));
            $count = $transactions->count();
            $lines = $transactions->values()->map(function (FinanceTransaction $transaction, int $index) {
                $description = trim((string) ($transaction->description ?: $transaction->merchant_name ?: 'Transaksi tanpa deskripsi'));
                $amount = $transaction->formatted_amount;
                $accountName = trim((string) ($transaction->bankAccount?->name ?: 'Tanpa akun'));
                $budgetName = trim((string) ($transaction->budget?->name ?: ''));

                return sprintf(
                    '%d. %s - %s (Akun: %s%s)',
                    $index + 1,
                    $description,
                    $amount,
                    $accountName,
                    $budgetName !== '' ? ', Budget: '.$budgetName : ''
                );
            })->implode("\n");

            return "Hai, {$memberName}! {$count} transaksi berhasil dicatat:\n\n{$lines}";
        }

        if ($intent->intent_type === 'bulk_shopping') {
            $count = max(1, (int) ($submittedCount ?? 0));

            return $count === 1
                ? 'Siap, 1 transaksi dari draft WhatsApp berhasil dicatat.'
                : "Siap, {$count} transaksi dari draft WhatsApp berhasil dicatat.";
        }

        return 'Siap, transaksi dari draft WhatsApp berhasil dicatat.';
    }

    public function resolveSubmittedTransactions(Tenant $tenant, ?array $transactionIds = null)
    {
        $ids = collect($transactionIds ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->map(fn ($id) => trim($id))
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $transactions = FinanceTransaction::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids->all())
            ->with([
                'currency:id,code,symbol,decimal_places',
                'bankAccount:id,name',
                'budget:id,name',
            ])
            ->get()
            ->keyBy(fn (FinanceTransaction $transaction) => (string) $transaction->id);

        return $ids
            ->map(fn (string $id) => $transactions->get($id))
            ->filter();
    }
}
