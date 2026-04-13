<?php

namespace App\Services\Finance\Whatsapp\Actions;

use App\Jobs\WhatsappFinanceIntentJob;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappIntent;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Services\Finance\Whatsapp\Managers\WhatsappReplyManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CreateFinanceIntentAction
{
    public function __construct(
        private readonly WhatsappReplyManager $replyManager,
        private readonly ExecuteFinanceIntentAction $executeAction,
    ) {}

    public function handle(
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

        $this->replyManager->sendReply(
            $tenant,
            $senderJid,
            $media
                ? 'Sedang membaca lampiran kamu. Tunggu sebentar ya, nanti aku kirim link review.'
                : 'Sedang menyiapkan draft transaksi kamu. Tunggu sebentar ya.'
        );

        if ((bool) config('whatsapp.dispatch_async', true) && (string) config('queue.default', 'sync') !== 'sync') {
            WhatsappFinanceIntentJob::dispatch($intent->id);
        } else {
            $this->executeAction->handle($intent);
        }
    }
}
