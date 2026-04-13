<?php

namespace App\Services;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappCommandContext;
use App\Models\Whatsapp\TenantWhatsappIntent;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Whatsapp\Actions\CreateFinanceIntentAction;
use App\Services\Finance\Whatsapp\Managers\WhatsappReplyManager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsappFinanceIntentService
{
    public function __construct(
        private readonly CreateFinanceIntentAction $createAction,
        private readonly WhatsappReplyManager $replyManager,
    ) {}

    public function handleIncomingMessage(Tenant $tenant, string $senderJid, string $text, ?TenantWhatsappMessage $message = null): void
    {
        if (! (bool) config('whatsapp.finance.enabled', true)) {
            return;
        }

        $member = $this->resolveMember($tenant, $senderJid);
        $command = $this->resolveCommand($text);
        $activeContext = $this->activeContext($tenant->id, $senderJid);

        if (! $command && ! $activeContext) {
            return;
        }

        if (! $member) {
            $this->replyManager->sendReply($tenant, $senderJid, 'Nomor WhatsApp ini belum terhubung ke member tenant. Silakan hubungkan WhatsApp JID di profil/member terlebih dahulu.');

            return;
        }

        $commandName = $command['name'] ?? data_get($activeContext?->payload, 'command');
        if (! $commandName || ! in_array($commandName, ['tx', 'bulk'], true)) {
            return;
        }

        $payloadText = trim((string) ($command['payload'] ?? ''));
        if ($payloadText === '' && ! $activeContext) {
            $this->createWaitContext($tenant->id, $senderJid, $commandName, $message?->id);
            Log::info('whatsapp.finance.wait_context.created', [
                'tenant_id' => $tenant->id,
                'sender_jid' => $senderJid,
                'command' => $commandName,
                'source_message_id' => $message?->id,
            ]);
            $this->replyManager->sendReply($tenant, $senderJid, $commandName === 'bulk'
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

        $this->createAction->handle($tenant, $member, $senderJid, $commandName, $payloadText, $message, null);

        if ($activeContext) {
            $activeContext->delete();
        }
    }

    public function handleIncomingMedia(Tenant $tenant, string $senderJid, TenantWhatsappMedia $media): void
    {
        if (! (bool) config('whatsapp.finance.enabled', true)) {
            return;
        }

        $activeContext = $this->activeContext($tenant->id, $senderJid);
        if (! $activeContext) {
            $intent = $this->latestAttachableIntent($tenant->id, $senderJid);
            if (! $intent) {
                return;
            }

            $this->appendMediaToIntent($intent, $media);
            Log::info('whatsapp.finance.intent.media_appended', [
                'tenant_id' => $tenant->id,
                'sender_jid' => $senderJid,
                'intent_id' => $intent->id,
                'media_id' => $media->id,
            ]);

            $this->replyManager->sendReply($tenant, $senderJid, 'Lampiran berhasil ditambahkan ke draft transaksi terakhir. Buka link review yang tadi untuk melihat lampirannya.');

            return;
        }

        $member = $this->resolveMember($tenant, $senderJid);
        if (! $member) {
            $this->replyManager->sendReply($tenant, $senderJid, 'Nomor WhatsApp ini belum terhubung ke member tenant. Silakan hubungkan WhatsApp JID di profil/member terlebih dahulu.');

            return;
        }

        $commandName = (string) data_get($activeContext->payload, 'command', '');
        if (! in_array($commandName, ['tx', 'bulk'], true)) {
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

        $this->createAction->handle($tenant, $member, $senderJid, $commandName, null, null, $media);
        $activeContext->delete();
    }

    public function canOpenIntent(TenantWhatsappIntent $intent, ?TenantMember $currentMember, FinanceAccessService $access): bool
    {
        if (! $currentMember) {
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

        $this->replyManager->sendReply(
            $tenant,
            $intent->sender_jid,
            $this->replyManager->buildSubmissionConfirmationMessage($tenant, $intent, null, $submittedCount, $transactionIds)
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
        if ($text === '' || ! preg_match('/^([\/!])(tx|bulk|help)\b/i', $text, $matches)) {
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
            'input_type' => $this->determineInputType($rawInput['text'] ?? null, ! empty($mediaIds)),
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
}
