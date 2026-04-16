<?php

namespace Tests\Feature\Integrations\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Models\Whatsapp\TenantWhatsappSetting;
use App\Models\Identity\User;

use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsappChatApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('broadcasting.default', 'log');
    }

    public function test_send_message_accepts_lid_us_destination_without_polling_flow(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', false);

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
        ]);

        $jid = '1234567890@lid.us';
        $encodedJid = rawurlencode($jid);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$encodedJid}/send", [
            'message' => 'hello lid',
        ]);

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.to', $jid);

        $this->assertDatabaseHas('tenant_whatsapp_messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'outgoing',
            'recipient_jid' => $jid,
            'chat_jid' => $jid,
        ]);
    }

    public function test_send_message_updates_existing_outgoing_message_instead_of_failing_on_duplicate_message_id(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');
        config()->set('whatsapp.internal_token', 'internal-secret');

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
        ]);

        TenantWhatsappMessage::query()->create([
            'tenant_id' => $tenant->id,
            'direction' => 'outgoing',
            'whatsapp_message_id' => 'wamid-duplicate-1',
            'sender_jid' => '628111111111@c.us',
            'recipient_jid' => '628222222222@c.us',
            'chat_jid' => '628222222222@c.us',
            'payload' => [
                'text' => 'older copy',
                'delivery' => 'queued',
            ],
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => true,
                'data' => [
                    'message_id' => 'wamid-duplicate-1',
                    'delivery' => 'queued',
                ],
            ], 200),
        ]);

        $jid = rawurlencode('628222222222@c.us');
        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$jid}/send", [
            'message' => 'updated copy',
        ]);

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.message_id', 'wamid-duplicate-1');

        $this->assertSame(1, TenantWhatsappMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('direction', 'outgoing')
            ->where('whatsapp_message_id', 'wamid-duplicate-1')
            ->count());

        $message = TenantWhatsappMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('direction', 'outgoing')
            ->where('whatsapp_message_id', 'wamid-duplicate-1')
            ->firstOrFail();

        $this->assertSame('updated copy', $message->payload['text'] ?? null);
    }

    public function test_send_message_returns_validation_error_when_service_rejects_invalid_recipient(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');
        config()->set('whatsapp.internal_token', 'internal-secret');

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => false,
                'error' => [
                    'code' => 'INVALID_RECIPIENT',
                    'message' => 'Recipient WhatsApp JID is invalid.',
                ],
            ], 422),
        ]);

        $jid = rawurlencode('114096510877750@lid');
        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$jid}/send", [
            'message' => 'hello lid',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error.code', 'WHATSAPP_INVALID_RECIPIENT');
    }

    public function test_chat_messages_requires_authentication(): void
    {
        config()->set('whatsapp.enabled', true);

        [$tenant] = $this->seedTenantOwner('pro');
        $jid = rawurlencode('628111111111@c.us');

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$jid}/messages");

        $response->assertUnauthorized();
    }

    public function test_chat_messages_returns_forbidden_when_plan_has_no_whatsapp_chat_feature(): void
    {
        config()->set('whatsapp.enabled', true);

        [$tenant, $user] = $this->seedTenantOwner('free');
        Sanctum::actingAs($user);
        $jid = rawurlencode('628111111111@c.us');

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$jid}/messages");

        $response->assertForbidden()
            ->assertJsonPath('error.code', 'FEATURE_NOT_AVAILABLE');
    }

    public function test_chat_messages_supports_cursor_pagination_by_before_id(): void
    {
        config()->set('whatsapp.enabled', true);

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        $chatJid = '628111111111@c.us';
        for ($i = 1; $i <= 40; $i++) {
            TenantWhatsappMessage::query()->create([
                'tenant_id' => $tenant->id,
                'direction' => 'incoming',
                'whatsapp_message_id' => 'msg-' . $i,
                'sender_jid' => $chatJid,
                'recipient_jid' => '628999999999@c.us',
                'chat_jid' => $chatJid,
                'payload' => ['text' => 'message ' . $i],
            ]);
        }

        $encodedJid = rawurlencode($chatJid);
        $latestResponse = $this->getJson("/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$encodedJid}/messages");
        $latestResponse->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.has_more', true);

        $latestMessages = $latestResponse->json('data.messages');
        $this->assertCount(15, $latestMessages);
        $this->assertSame('message 26', $latestMessages[0]['payload']['text']);
        $this->assertSame('message 40', $latestMessages[14]['payload']['text']);

        $nextBeforeId = $latestResponse->json('data.next_before_id');
        $this->assertNotNull($nextBeforeId);

        $olderResponse = $this->getJson(
            "/api/v1/tenants/{$tenant->slug}/whatsapp/chats/{$encodedJid}/messages?before_id={$nextBeforeId}&limit=15"
        );
        $olderResponse->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.has_more', true);

        $olderMessages = $olderResponse->json('data.messages');
        $this->assertCount(15, $olderMessages);
        $this->assertSame('message 11', $olderMessages[0]['payload']['text']);
        $this->assertSame('message 25', $olderMessages[14]['payload']['text']);
    }

    private function seedTenantOwner(string $planCode): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'owner_user_id' => $user->id,
            'name' => 'Tenant WhatsApp',
            'slug' => 'tenant-whatsapp-' . $planCode,
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => $planCode,
            'status' => 'active',
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => 'Owner WhatsApp',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'row_version' => 1,
        ]);

        return [$tenant, $user];
    }
}
