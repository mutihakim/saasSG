<?php

namespace App\Services;

use App\Exceptions\WhatsappIntentExtractionException;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\TenantWhatsappCommandContext;
use App\Models\TenantWhatsappIntent;
use App\Models\TenantWhatsappMedia;
use App\Models\TenantWhatsappMessage;
use App\Models\TenantWhatsappNotification;
use App\Models\TenantWhatsappSetting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsappFinanceIntentService
{
    public function __construct(
        private readonly WhatsappAiExtractionService $extractor,
        private readonly WhatsappServiceClient $serviceClient,
    ) {
    }

    public function handleIncomingMessage(Tenant $tenant, string $senderJid, string $text, ?TenantWhatsappMessage $message = null): void
    {
        if (!(bool) config('whatsapp.finance.enabled', true)) {
            return;
        }

        $member = $this->resolveMember($tenant, $senderJid);
        $command = $this->resolveCommand($text);
        $activeContext = $this->activeContext($tenant->id, $senderJid);

        if (!$command && !$activeContext) {
            return;
        }

        if (!$member) {
            $this->sendReply($tenant, $senderJid, 'Nomor WhatsApp ini belum terhubung ke member tenant. Silakan hubungkan WhatsApp JID di profil/member terlebih dahulu.');
            return;
        }

        $commandName = $command['name'] ?? data_get($activeContext?->payload, 'command');
        if (!$commandName || !in_array($commandName, ['tx', 'bulk'], true)) {
            return;
        }

        $payloadText = trim((string) ($command['payload'] ?? ''));
        if ($payloadText === '' && !$activeContext) {
            $this->createWaitContext($tenant->id, $senderJid, $commandName, $message?->id);
            Log::info('whatsapp.finance.wait_context.created', [
                'tenant_id' => $tenant->id,
                'sender_jid' => $senderJid,
                'command' => $commandName,
                'source_message_id' => $message?->id,
            ]);
            $this->sendReply($tenant, $senderJid, $commandName === 'bulk'
                ? 'Oke, kirim daftar belanja atau foto bon dalam 2 menit ya.'
                : 'Oke, kirim detail transaksi atau foto struk dalam 2 menit ya.');
            return;
        }

        if ($activeContext) {
            $payloadText = $payloadText !== '' ? $payloadText : $text;

            // If text is empty, wait for media callback or next text message
            // to avoid processing empty intent before image arrives
            if ($payloadText === '') {
                Log::info('whatsapp.finance.wait_context.awaiting_content', [
                    'tenant_id' => $tenant->id,
                    'sender_jid' => $senderJid,
                    'command' => $commandName,
                    'context_id' => $activeContext->id,
                ]);
                return;
            }

            Log::info('whatsapp.finance.wait_context.resumed', [
                'tenant_id' => $tenant->id,
                'sender_jid' => $senderJid,
                'command' => $commandName,
                'context_id' => $activeContext->id,
            ]);
        }

        $this->processIntent($tenant, $member, $senderJid, $commandName, $payloadText, $message, null);

        if ($activeContext) {
            $activeContext->delete();
        }
    }

    public function handleIncomingMedia(Tenant $tenant, string $senderJid, TenantWhatsappMedia $media): void
    {
        if (!(bool) config('whatsapp.finance.enabled', true)) {
            return;
        }

        $activeContext = $this->activeContext($tenant->id, $senderJid);
        if (!$activeContext) {
            $intent = $this->latestAttachableIntent($tenant->id, $senderJid);
            if (!$intent) {
                return;
            }

            $this->appendMediaToIntent($intent, $media);
            Log::info('whatsapp.finance.intent.media_appended', [
                'tenant_id' => $tenant->id,
                'sender_jid' => $senderJid,
                'intent_id' => $intent->id,
                'media_id' => $media->id,
            ]);

            $this->sendReply($tenant, $senderJid, 'Lampiran berhasil ditambahkan ke draft transaksi terakhir. Buka link review yang tadi untuk melihat lampirannya.');
            return;
        }

        $member = $this->resolveMember($tenant, $senderJid);
        if (!$member) {
            $this->sendReply($tenant, $senderJid, 'Nomor WhatsApp ini belum terhubung ke member tenant. Silakan hubungkan WhatsApp JID di profil/member terlebih dahulu.');
            return;
        }

        $commandName = (string) data_get($activeContext->payload, 'command', '');
        if (!in_array($commandName, ['tx', 'bulk'], true)) {
            return;
        }

        Log::info('whatsapp.finance.wait_context.resumed', [
            'tenant_id' => $tenant->id,
            'sender_jid' => $senderJid,
            'command' => $commandName,
            'context_id' => $activeContext->id,
            'via' => 'media',
            'media_id' => $media->id,
        ]);
        $this->processIntent($tenant, $member, $senderJid, $commandName, null, null, $media);
        $activeContext->delete();
    }

    public function canOpenIntent(TenantWhatsappIntent $intent, ?TenantMember $currentMember, FinanceAccessService $access): bool
    {
        if (!$currentMember) {
            return false;
        }

        if ($access->canManageSharedStructures($currentMember)) {
            return true;
        }

        return (string) $intent->member_id === (string) $currentMember->id;
    }

    public function finalizeSubmittedIntent(
        Tenant $tenant,
        TenantWhatsappIntent $intent,
        ?string $linkedResourceType = null,
        mixed $linkedResourceId = null,
        ?int $submittedCount = null,
        ?array $transactionIds = null,
    ): void {
        $alreadySubmitted = $intent->status === 'submitted';

        $intent->forceFill([
            'status' => 'submitted',
            'linked_resource_type' => $linkedResourceType ?? $intent->linked_resource_type,
            'linked_resource_id' => $linkedResourceId ?? $intent->linked_resource_id,
        ])->save();

        if ($alreadySubmitted) {
            return;
        }

        $this->sendReply(
            $tenant,
            $intent->sender_jid,
            $this->buildSubmissionConfirmationMessage($tenant, $intent, $submittedCount, $transactionIds)
        );
    }

    public function resolveAdditionalMediaIds(TenantWhatsappIntent $intent): array
    {
        $rawInput = is_array($intent->raw_input) ? $intent->raw_input : [];

        return collect($rawInput['media_ids'] ?? [])
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function processIntent(
        Tenant $tenant,
        TenantMember $member,
        string $senderJid,
        string $commandName,
        ?string $text,
        ?TenantWhatsappMessage $message,
        ?TenantWhatsappMedia $media
    ): void {
        $intentType = $commandName === 'bulk' ? 'bulk_shopping' : 'single_transaction';
        $inputType = $media && $text ? 'text_image' : ($media ? 'image' : 'text');

        Log::info('whatsapp.finance.intent.create.start', [
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'sender_jid' => $senderJid,
            'command' => $commandName,
            'intent_type' => $intentType,
            'input_type' => $inputType,
            'source_message_id' => $message?->id,
            'media_id' => $media?->id,
        ]);

        $intent = TenantWhatsappIntent::query()->create([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'sender_jid' => $senderJid,
            'source_message_id' => $message?->id,
            'media_id' => $media?->id,
            'token' => Str::random(64),
            'command' => $commandName,
            'intent_type' => $intentType,
            'input_type' => $inputType,
            'status' => 'processing',
            'raw_input' => [
                'text' => $text,
                'media_id' => $media?->id,
                'media_ids' => $media ? [$media->id] : [],
            ],
            'expires_at' => now()->addMinutes((int) config('whatsapp.finance.intent_ttl_minutes', 60)),
        ]);

        $this->sendReply($tenant, $senderJid, $media
            ? 'Sedang membaca lampiran kamu. Tunggu sebentar ya, nanti aku kirim link review.'
            : 'Sedang menyiapkan draft transaksi kamu. Tunggu sebentar ya.');

        try {
            $result = $this->extractor->extract($tenant, $member, $commandName, $text, $media);
        } catch (WhatsappIntentExtractionException $exception) {
            $intent->forceFill([
                'status' => 'failed',
                'error_payload' => $exception->debugPayload(),
            ])->save();

            Log::warning('whatsapp.finance.intent.failed', [
                'tenant_id' => $tenant->id,
                'intent_id' => $intent->id,
                'command' => $commandName,
                'sender_jid' => $senderJid,
                'error_payload' => $exception->debugPayload(),
            ]);

            $this->sendReply($tenant, $senderJid, $exception->userMessage());

            return;
        }

        DB::transaction(function () use ($intent, $result, $commandName) {
            $intent->fill([
                'status' => 'parsed',
                'ai_provider' => $result['provider'] ?? null,
                'ai_model' => $result['model'] ?? null,
                'confidence_score' => $result['confidence_score'] ?? null,
                'processing_time_ms' => $result['processing_time_ms'] ?? null,
                'extracted_payload' => $result['payload'] ?? null,
                'ai_raw_response' => $result['raw_response'] ?? null,
                'error_payload' => null,
            ])->save();

            $intent->items()->delete();

            if ($commandName === 'bulk') {
                foreach (($result['items'] ?? []) as $item) {
                    $intent->items()->create([
                        'sort_order' => (int) ($item['sort_order'] ?? 0),
                        'description' => $item['description'] ?? null,
                        'amount' => $item['amount'] ?? null,
                        'currency_code' => $item['currency_code'] ?? null,
                        'payload' => $item['payload'] ?? null,
                    ]);
                }
            }
        });

        Log::info('whatsapp.finance.intent.parsed', [
            'tenant_id' => $tenant->id,
            'intent_id' => $intent->id,
            'command' => $commandName,
            'status' => $intent->status,
            'confidence_score' => $intent->confidence_score,
            'raw_input' => $intent->raw_input,
            'ai_raw_response' => $intent->ai_raw_response,
            'extracted_payload' => $intent->extracted_payload,
        ]);

        $reviewUrl = $this->buildReviewUrl($tenant, $intent);
        $summary = $commandName === 'bulk'
            ? 'Draft belanja berhasil dibuat.'
            : 'Draft transaksi berhasil dibuat.';

        $this->sendReply($tenant, $senderJid, $summary . "\nReview di aplikasi: {$reviewUrl}");
    }

    private function buildReviewUrl(Tenant $tenant, TenantWhatsappIntent $intent): string
    {
        $base = str_replace('{tenant}', $tenant->slug, (string) config('whatsapp.finance.app_url_template'));
        $action = $intent->intent_type === 'bulk_shopping' ? 'batch-review' : 'create';

        return $base . '?' . http_build_query([
            'source' => 'wa',
            'action' => $action,
            'intent' => $intent->token,
        ]);
    }

    private function buildSubmissionConfirmationMessage(
        Tenant $tenant,
        TenantWhatsappIntent $intent,
        ?int $submittedCount = null,
        ?array $transactionIds = null,
    ): string
    {
        $transactions = $this->resolveSubmittedTransactions($tenant, $transactionIds);
        if ($transactions->isNotEmpty()) {
            $memberName = trim((string) ($intent->member?->full_name ?? $this->resolveMember($tenant, $intent->sender_jid)?->full_name ?? 'Member'));
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
                    $budgetName !== '' ? ', Budget: ' . $budgetName : ''
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

    private function resolveSubmittedTransactions(Tenant $tenant, ?array $transactionIds = null)
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

    private function resolveMember(Tenant $tenant, string $senderJid): ?TenantMember
    {
        return TenantMember::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->where('whatsapp_jid', $senderJid)
            ->first();
    }

    private function resolveCommand(string $text): ?array
    {
        $text = trim($text);
        if ($text === '' || !preg_match('/^([\/!])(tx|bulk|help)\b/i', $text, $matches)) {
            return null;
        }

        return [
            'name' => Str::lower($matches[2]),
            'payload' => trim(Str::after($text, $matches[0])),
        ];
    }

    private function activeContext(int $tenantId, string $senderJid): ?TenantWhatsappCommandContext
    {
        return TenantWhatsappCommandContext::query()
            ->where('tenant_id', $tenantId)
            ->where('sender_jid', $senderJid)
            ->where('context_type', 'finance_waiting_payload')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();
    }

    private function latestAttachableIntent(int $tenantId, string $senderJid): ?TenantWhatsappIntent
    {
        return TenantWhatsappIntent::query()
            ->where('tenant_id', $tenantId)
            ->where('sender_jid', $senderJid)
            ->whereIn('status', ['processing', 'parsed', 'app_opened'])
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest('id')
            ->first();
    }

    private function appendMediaToIntent(TenantWhatsappIntent $intent, TenantWhatsappMedia $media): void
    {
        $rawInput = is_array($intent->raw_input) ? $intent->raw_input : [];
        $mediaIds = collect([
            $rawInput['media_id'] ?? null,
            ...($rawInput['media_ids'] ?? []),
            $intent->media_id,
            $media->id,
        ])
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $rawInput['media_id'] = $rawInput['media_id'] ?? $intent->media_id ?? $media->id;
        $rawInput['media_ids'] = $mediaIds;

        $intent->forceFill([
            'media_id' => $intent->media_id ?: $media->id,
            'input_type' => $this->determineInputType($rawInput['text'] ?? null, !empty($mediaIds)),
            'raw_input' => $rawInput,
        ])->save();
    }

    private function determineInputType(?string $text, bool $hasMedia): string
    {
        $hasText = trim((string) $text) !== '';

        return $hasMedia && $hasText
            ? 'text_image'
            : ($hasMedia ? 'image' : 'text');
    }

    private function createWaitContext(int $tenantId, string $senderJid, string $commandName, ?int $messageId): void
    {
        TenantWhatsappCommandContext::query()
            ->where('tenant_id', $tenantId)
            ->where('sender_jid', $senderJid)
            ->where('context_type', 'finance_waiting_payload')
            ->delete();

        TenantWhatsappCommandContext::query()->create([
            'tenant_id' => $tenantId,
            'sender_jid' => $senderJid,
            'context_type' => 'finance_waiting_payload',
            'payload' => [
                'command' => $commandName,
                'source_message_id' => $messageId,
            ],
            'expires_at' => Carbon::now()->addSeconds((int) config('whatsapp.finance.wait_window_seconds', 120)),
        ]);
    }

    private function sendReply(Tenant $tenant, string $senderJid, string $message): void
    {
        $setting = TenantWhatsappSetting::query()->where('tenant_id', $tenant->id)->first();
        $delivery = 'queued';
        $messageId = 'bot-' . Str::uuid()->toString();

        if ($this->serviceClient->isEnabled()) {
            $response = $this->serviceClient->sendMessage($tenant->id, $senderJid, $message, 'finance-bot-' . Str::uuid());
            if ($response['ok'] ?? false) {
                $messageId = (string) data_get($response, 'data.message_id', $messageId);
                $delivery = (string) data_get($response, 'data.delivery', 'queued');
            } else {
                $delivery = (string) ($response['code'] ?? 'service_unavailable');
                Log::warning('whatsapp.finance.reply.failed', [
                    'tenant_id' => $tenant->id,
                    'sender_jid' => $senderJid,
                    'delivery' => $delivery,
                    'status' => $response['status'] ?? null,
                    'code' => $response['code'] ?? null,
                ]);
            }
        } else {
            $delivery = $setting?->connection_status === 'connected' ? 'queued_local' : 'not_connected';
        }

        TenantWhatsappMessage::query()->create([
            'tenant_id' => $tenant->id,
            'direction' => 'outgoing',
            'whatsapp_message_id' => $messageId,
            'sender_jid' => $setting?->connected_jid,
            'recipient_jid' => $senderJid,
            'chat_jid' => $senderJid,
            'payload' => [
                'text' => $message,
                'delivery' => $delivery,
            ],
        ]);

        TenantWhatsappNotification::query()->create([
            'tenant_id' => $tenant->id,
            'member_id' => null,
            'notification_type' => 'finance_intent_reply',
            'notification_key' => 'finance-intent-' . Str::uuid(),
            'status' => $delivery === 'queued' || $delivery === 'queued_local' ? 'sent' : 'failed',
            'context' => ['to' => $senderJid],
            'service_response' => ['delivery' => $delivery],
            'sent_at' => now()->utc(),
        ]);
    }
}
