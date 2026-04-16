<?php

namespace Tests\Feature\Integrations\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsappBotTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('broadcasting.default', 'log');
    }

    public function test_internal_incoming_ping_command_triggers_auto_reply(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant] = $this->seedTenantOwner('pro');

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => true,
                'data' => [
                    'message_id' => 'reply-1',
                    'delivery' => 'queued',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'incoming-cmd-ping',
            'sender_jid' => '6287856575515@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => [
                'text' => '/ping',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(function ($request) use ($tenant) {
            $body = $request->data();
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$tenant->id}/whatsapp/messages/send"
                && ($body['to'] ?? null) === '6287856575515@c.us'
                && str_contains((string) ($body['message'] ?? ''), 'Pong');
        });
    }

    public function test_internal_incoming_help_command_triggers_help_reply(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant] = $this->seedTenantOwner('pro');

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => true,
                'data' => [
                    'message_id' => 'reply-2',
                    'delivery' => 'queued',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'incoming-cmd-help',
            'sender_jid' => '6287856575515@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => [
                'text' => '!help',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(function ($request) use ($tenant) {
            $body = $request->data();
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$tenant->id}/whatsapp/messages/send"
                && ($body['to'] ?? null) === '6287856575515@c.us'
                && str_contains((string) ($body['message'] ?? ''), '/ping')
                && str_contains((string) ($body['message'] ?? ''), '/help');
        });
    }

    public function test_internal_incoming_unknown_command_returns_help_reply(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant] = $this->seedTenantOwner('pro');

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => true,
                'data' => [
                    'message_id' => 'reply-3',
                    'delivery' => 'queued',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'incoming-cmd-unknown',
            'sender_jid' => '6287856575515@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => [
                'text' => '/unknown',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(function ($request) use ($tenant) {
            $body = $request->data();
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$tenant->id}/whatsapp/messages/send"
                && str_contains((string) ($body['message'] ?? ''), '/help');
        });
    }

    public function test_internal_incoming_non_command_does_not_trigger_auto_reply(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant] = $this->seedTenantOwner('pro');

        Http::fake();

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'incoming-plain-text',
            'sender_jid' => '6287856575515@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => [
                'text' => 'halo admin',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertNothingSent();
    }

    public function test_internal_incoming_command_keeps_success_response_when_service_unavailable(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant] = $this->seedTenantOwner('pro');

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/messages/send' => Http::response([
                'ok' => false,
                'error' => [
                    'code' => 'SERVICE_DOWN',
                    'message' => 'Service down',
                ],
            ], 503),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'incoming-cmd-service-down',
            'sender_jid' => '6287856575515@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => [
                'text' => '/ping',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(function ($request) use ($tenant) {
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$tenant->id}/whatsapp/messages/send";
        });
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
