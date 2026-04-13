<?php

namespace App\Services\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Models\Whatsapp\TenantWhatsappNotification;
use App\Models\Whatsapp\TenantWhatsappSetting;
use App\Services\WhatsappServiceClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Handles sending reply messages via WhatsApp broker
 * and recording them to the database.
 */
class WhatsappMessageReplySender
{
    public function __construct(
        private readonly WhatsappServiceClient $serviceClient,
    ) {
    }

    /**
     * Send a reply message and persist to database + notification log.
     */
    public function sendReply(Tenant $tenant, string $recipientJid, string $message): void
    {
        $setting = TenantWhatsappSetting::query()->where('tenant_id', $tenant->id)->first();
        $delivery = 'queued';
        $messageId = 'bot-' . Str::uuid()->toString();

        if ($this->serviceClient->isEnabled()) {
            $response = $this->serviceClient->sendMessage(
                $tenant->id,
                $recipientJid,
                $message,
                'finance-bot-' . Str::uuid()
            );

            if ($response['ok'] ?? false) {
                $messageId = (string) data_get($response, 'data.message_id', $messageId);
                $delivery = (string) data_get($response, 'data.delivery', 'queued');
            } else {
                $delivery = (string) ($response['code'] ?? 'service_unavailable');
                Log::warning('whatsapp.finance.reply.failed', [
                    'tenant_id' => $tenant->id,
                    'sender_jid' => $recipientJid,
                    'delivery' => $delivery,
                    'status' => $response['status'] ?? null,
                    'code' => $response['code'] ?? null,
                ]);
            }
        } else {
            $delivery = $setting?->connection_status === 'connected' ? 'queued_local' : 'not_connected';
        }

        $this->recordOutgoingMessage($tenant, $setting, $recipientJid, $messageId, $message, $delivery);
        $this->recordNotification($tenant, $recipientJid, $delivery);
    }

    private function recordOutgoingMessage(
        Tenant $tenant,
        ?TenantWhatsappSetting $setting,
        string $recipientJid,
        string $messageId,
        string $message,
        string $delivery,
    ): void {
        TenantWhatsappMessage::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'direction' => 'outgoing',
                'whatsapp_message_id' => $messageId,
            ],
            [
                'sender_jid' => $setting?->connected_jid,
                'recipient_jid' => $recipientJid,
                'chat_jid' => $recipientJid,
                'payload' => [
                    'text' => $message,
                    'delivery' => $delivery,
                ],
            ]
        );
    }

    private function recordNotification(
        Tenant $tenant,
        string $recipientJid,
        string $delivery,
    ): void {
        TenantWhatsappNotification::query()->create([
            'tenant_id' => $tenant->id,
            'member_id' => null,
            'notification_type' => 'finance_intent_reply',
            'notification_key' => 'finance-intent-' . Str::uuid(),
            'status' => in_array($delivery, ['queued', 'queued_local'], true) ? 'sent' : 'failed',
            'context' => ['to' => $recipientJid],
            'delivered_at' => in_array($delivery, ['queued', 'queued_local'], true) ? now() : null,
        ]);
    }
}
