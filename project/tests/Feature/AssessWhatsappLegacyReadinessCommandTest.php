<?php

namespace Tests\Feature;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Models\Whatsapp\TenantWhatsappSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessWhatsappLegacyReadinessCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_passes_when_broker_is_enabled_and_state_is_clean(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://127.0.0.1:3030');
        config()->set('whatsapp.connecting_timeout_ms', 60000);
        config()->set('whatsapp.connecting_stale_grace_ms', 15000);

        $owner = User::factory()->create();
        $tenant = Tenant::factory()->create([
            'slug' => 'family2',
            'owner_user_id' => $owner->id,
        ]);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ]);

        TenantWhatsappMessage::query()->create([
            'tenant_id' => $tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'wamid-in-1',
            'sender_jid' => '628111111111@c.us',
            'recipient_jid' => '628222222222@c.us',
            'chat_jid' => '628111111111@c.us',
            'payload' => ['text' => 'hello'],
        ]);

        $this->artisan('whatsapp:legacy:readiness', ['--tenant' => 'family2'])
            ->expectsOutputToContain('service_target: broker')
            ->expectsOutputToContain('readiness: PASS')
            ->assertExitCode(0);
    }

    public function test_command_fails_when_legacy_service_and_conflict_still_exist(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://127.0.0.1:3010');
        config()->set('whatsapp.connecting_timeout_ms', 60000);
        config()->set('whatsapp.connecting_stale_grace_ms', 15000);

        $owner = User::factory()->create();
        $tenant = Tenant::factory()->create([
            'slug' => 'family2',
            'owner_user_id' => $owner->id,
        ]);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connecting',
            'connected_jid' => null,
            'auto_connect' => true,
            'meta' => [
                'disconnect_reason' => 'jid_conflict',
                'conflict_connected_jid' => '628111111111@c.us',
                'conflict_owner_tenant_id' => 99,
            ],
            'updated_at' => now()->subMinutes(10),
            'created_at' => now()->subMinutes(10),
        ]);

        $this->artisan('whatsapp:legacy:readiness', ['--tenant' => 'family2'])
            ->expectsOutputToContain('service_target: legacy')
            ->expectsOutputToContain('readiness: FAIL')
            ->assertExitCode(1);
    }
}
