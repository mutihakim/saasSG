<?php

namespace Tests\Feature\Integrations\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappSetting;
use App\Models\Identity\User;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsappSessionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('broadcasting.default', 'log');
    }

    public function test_connect_forwards_request_to_global_service_when_enabled(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');
        config()->set('whatsapp.internal_token', 'internal-secret');

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/connect' => Http::response([
                'ok' => true,
                'data' => [
                    'connection_status' => 'connecting',
                    'session_name' => 'tenant-' . dechex((int) $tenant->id),
                ],
            ], 200),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session/connect");

        $response->assertStatus(202)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.connection_status', 'connecting');

        Http::assertSent(function ($request) use ($tenant) {
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$tenant->id}/whatsapp/session/connect"
                && $request->hasHeader('X-Internal-Token', 'internal-secret');
        });
    }

    public function test_connect_returns_accepted_with_warning_when_global_service_fails(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/connect' => Http::response([
                'ok' => false,
                'error' => ['code' => 'SERVICE_DOWN', 'message' => 'Service down'],
            ], 503),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session/connect");

        $response->assertStatus(202)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.status', 'accepted_with_warning')
            ->assertJsonPath('data.connection_status', 'connecting');

        $this->assertDatabaseHas('tenant_whatsapp_settings', [
            'tenant_id' => $tenant->id,
            'connection_status' => 'connecting',
            'auto_connect' => true,
        ]);
    }

    public function test_connect_sets_auto_connect_true(): void
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
            'connection_status' => 'disconnected',
            'auto_connect' => false,
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/connect' => Http::response([
                'ok' => true,
                'data' => ['connection_status' => 'connecting'],
            ], 200),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session/connect");
        $response->assertStatus(202);

        $this->assertDatabaseHas('tenant_whatsapp_settings', [
            'tenant_id' => $tenant->id,
            'auto_connect' => true,
            'connection_status' => 'connecting',
        ]);
    }

    public function test_disconnect_sets_auto_connect_false(): void
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
            'connection_status' => 'connecting',
            'auto_connect' => true,
            'meta' => ['qr_generated_at' => now()->toIso8601String()],
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/disconnect' => Http::response([
                'ok' => true,
                'data' => ['connection_status' => 'disconnected'],
            ], 200),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session/disconnect");
        $response->assertOk();

        $setting = TenantWhatsappSetting::query()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertFalse((bool) $setting->auto_connect);
        $this->assertSame('disconnected', $setting->connection_status);
        $this->assertSame('manual_disconnect', $setting->meta['disconnect_reason'] ?? null);
    }

    public function test_internal_session_state_can_disable_auto_connect_and_merge_meta(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        [$tenant] = $this->seedTenantOwner('pro');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connecting',
            'auto_connect' => true,
            'meta' => ['connect_requested_at' => now()->subMinute()->toIso8601String()],
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $tenant->id,
            'connection_status' => 'disconnected',
            'connected_jid' => null,
            'auto_connect' => false,
            'meta' => [
                'disconnect_reason' => 'qr_timeout',
                'disconnected_at' => now()->toIso8601String(),
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk();

        $setting = TenantWhatsappSetting::query()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertFalse((bool) $setting->auto_connect);
        $this->assertSame('disconnected', $setting->connection_status);
        $this->assertSame('qr_timeout', $setting->meta['disconnect_reason'] ?? null);
        $this->assertFalse((bool) ($setting->meta['restore_eligible'] ?? true));
        $this->assertArrayHasKey('connect_requested_at', $setting->meta ?? []);
    }

    public function test_internal_session_state_rejects_newcomer_when_connected_jid_is_already_owned(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        [$ownerTenant] = $this->seedTenantOwner('pro');
        [$newcomerTenant] = $this->seedTenantOwner('basic');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $ownerTenant->id,
            'session_name' => 'tenant-' . dechex((int) $ownerTenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $newcomerTenant->id,
            'connection_status' => 'connected',
            'connected_jid' => '628111111111@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        $newcomerSetting = TenantWhatsappSetting::query()
            ->where('tenant_id', $newcomerTenant->id)
            ->firstOrFail();
        $ownerSetting = TenantWhatsappSetting::query()
            ->where('tenant_id', $ownerTenant->id)
            ->firstOrFail();

        $this->assertSame('disconnected', $newcomerSetting->connection_status);
        $this->assertNull($newcomerSetting->connected_jid);
        $this->assertFalse((bool) $newcomerSetting->auto_connect);
        $this->assertSame('jid_conflict', $newcomerSetting->meta['disconnect_reason'] ?? null);
        $this->assertSame($ownerTenant->id, (int) ($newcomerSetting->meta['conflict_owner_tenant_id'] ?? 0));
        $this->assertSame('628111111111@c.us', $newcomerSetting->meta['conflict_connected_jid'] ?? null);

        $this->assertSame('connected', $ownerSetting->connection_status);
        $this->assertSame('628111111111@c.us', $ownerSetting->connected_jid);
        $this->assertTrue((bool) $ownerSetting->auto_connect);
    }

    public function test_connected_jid_unique_index_rejects_duplicate_non_null_values(): void
    {
        [$tenantA] = $this->seedTenantOwner('pro');
        [$tenantB] = $this->seedTenantOwner('basic');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenantA->id,
            'session_name' => 'tenant-' . dechex((int) $tenantA->id),
            'connection_status' => 'connected',
            'connected_jid' => '628222222222@c.us',
            'auto_connect' => true,
        ]);

        $this->expectException(QueryException::class);

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenantB->id,
            'session_name' => 'tenant-' . dechex((int) $tenantB->id),
            'connection_status' => 'connected',
            'connected_jid' => '628222222222@c.us',
            'auto_connect' => true,
        ]);
    }

    public function test_internal_session_state_jid_conflict_triggers_remove_session_best_effort(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$ownerTenant] = $this->seedTenantOwner('pro');
        [$newcomerTenant] = $this->seedTenantOwner('basic');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $ownerTenant->id,
            'session_name' => 'tenant-' . dechex((int) $ownerTenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628333333333@c.us',
            'auto_connect' => true,
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/remove' => Http::response([
                'ok' => true,
                'data' => ['removed' => true],
            ], 200),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $newcomerTenant->id,
            'connection_status' => 'connected',
            'connected_jid' => '628333333333@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        Http::assertSent(function ($request) use ($newcomerTenant) {
            return $request->url() === "http://wa-service.test/api/v1/tenants/{$newcomerTenant->id}/whatsapp/session/remove";
        });
    }

    public function test_internal_session_state_jid_conflict_remove_failure_does_not_fail_callback(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.service_enabled', true);
        config()->set('whatsapp.service_url', 'http://wa-service.test');

        [$ownerTenant] = $this->seedTenantOwner('pro');
        [$newcomerTenant] = $this->seedTenantOwner('basic');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $ownerTenant->id,
            'session_name' => 'tenant-' . dechex((int) $ownerTenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628444444444@c.us',
            'auto_connect' => true,
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/remove' => Http::response([
                'ok' => false,
                'error' => [
                    'code' => 'SERVICE_DOWN',
                    'message' => 'Service down',
                ],
            ], 503),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $newcomerTenant->id,
            'connection_status' => 'connected',
            'connected_jid' => '628444444444@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk()->assertJsonPath('ok', true);

        $newcomerSetting = TenantWhatsappSetting::query()
            ->where('tenant_id', $newcomerTenant->id)
            ->firstOrFail();
        $this->assertSame('disconnected', $newcomerSetting->connection_status);
        $this->assertSame('jid_conflict', $newcomerSetting->meta['disconnect_reason'] ?? null);
    }

    public function test_internal_session_state_preserves_jid_conflict_metadata_after_manual_remove_follow_up(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        [$ownerTenant] = $this->seedTenantOwner('pro');
        [$newcomerTenant] = $this->seedTenantOwner('basic');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $ownerTenant->id,
            'session_name' => 'tenant-' . dechex((int) $ownerTenant->id),
            'connection_status' => 'connected',
            'connected_jid' => '628555555555@c.us',
            'auto_connect' => true,
        ]);

        $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $newcomerTenant->id,
            'connection_status' => 'connected',
            'connected_jid' => '628555555555@c.us',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connected'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ])->assertOk();

        $this->postJson('/internal/v1/whatsapp/session-state', [
            'tenant_id' => $newcomerTenant->id,
            'connection_status' => 'disconnected',
            'connected_jid' => null,
            'auto_connect' => false,
            'meta' => [
                'disconnect_reason' => 'manual_remove',
                'lifecycle_state' => 'manual_remove',
            ],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ])->assertOk();

        $newcomerSetting = TenantWhatsappSetting::query()
            ->where('tenant_id', $newcomerTenant->id)
            ->firstOrFail();
        $this->assertSame('jid_conflict', $newcomerSetting->meta['disconnect_reason'] ?? null);
        $this->assertSame('manual_remove', $newcomerSetting->meta['lifecycle_state'] ?? null);
        $this->assertSame('628555555555@c.us', $newcomerSetting->meta['conflict_connected_jid'] ?? null);
        $this->assertSame($ownerTenant->id, (int) ($newcomerSetting->meta['conflict_owner_tenant_id'] ?? 0));
    }

    public function test_internal_sessions_supports_eligible_only_filter(): void
    {
        config()->set('whatsapp.internal_token', 'internal-secret');
        [$tenantA] = $this->seedTenantOwner('pro');
        [$tenantB] = $this->seedTenantOwner('basic');
        [$tenantC] = $this->seedTenantOwner('enterprise');

        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenantA->id,
            'session_name' => 'tenant-' . dechex((int) $tenantA->id),
            'connection_status' => 'connected',
            'auto_connect' => true,
        ]);
        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenantB->id,
            'session_name' => 'tenant-' . dechex((int) $tenantB->id),
            'connection_status' => 'disconnected',
            'auto_connect' => true,
        ]);
        TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenantC->id,
            'session_name' => 'tenant-' . dechex((int) $tenantC->id),
            'connection_status' => 'connected',
            'auto_connect' => false,
        ]);

        $eligible = $this->getJson('/internal/v1/whatsapp/sessions?eligible_only=1', [
            'X-Internal-Token' => 'internal-secret',
        ]);
        $eligible->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.sessions')
            ->assertJsonPath('data.sessions.0.tenant_id', $tenantA->id);

        $all = $this->getJson('/internal/v1/whatsapp/sessions?include_all=1', [
            'X-Internal-Token' => 'internal-secret',
        ]);
        $all->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(3, 'data.sessions');
    }

    public function test_remove_session_sets_auto_connect_false_and_reason_manual_remove(): void
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
            'meta' => ['qr_generated_at' => now()->toIso8601String()],
        ]);

        Http::fake([
            'http://wa-service.test/api/v1/tenants/*/whatsapp/session/remove' => Http::response([
                'ok' => true,
                'data' => ['connection_status' => 'disconnected', 'removed' => true],
            ], 200),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session/remove");
        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.removed', true);

        $setting = TenantWhatsappSetting::query()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertFalse((bool) $setting->auto_connect);
        $this->assertSame('disconnected', $setting->connection_status);
        $this->assertSame('manual_remove', $setting->meta['disconnect_reason'] ?? null);
    }

    public function test_session_endpoint_self_heals_stale_connecting_to_qr_timeout(): void
    {
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.service_enabled', false);
        config()->set('whatsapp.connecting_timeout_ms', 60000);
        config()->set('whatsapp.connecting_stale_grace_ms', 15000);

        [$tenant, $user] = $this->seedTenantOwner('pro');
        Sanctum::actingAs($user);

        $setting = TenantWhatsappSetting::query()->create([
            'tenant_id' => $tenant->id,
            'session_name' => 'tenant-' . dechex((int) $tenant->id),
            'connection_status' => 'connecting',
            'auto_connect' => true,
            'meta' => ['lifecycle_state' => 'connecting', 'qr_data_url' => 'stale'],
        ]);
        TenantWhatsappSetting::query()
            ->whereKey($setting->id)
            ->update([
                'updated_at' => now()->subMinutes(3),
                'created_at' => now()->subMinutes(3),
            ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/whatsapp/session");
        $response->assertOk()
            ->assertJsonPath('data.session.connection_status', 'disconnected')
            ->assertJsonPath('data.session.auto_connect', false)
            ->assertJsonPath('data.session.meta.lifecycle_state', 'qr_timeout');

        $setting->refresh();
        $this->assertSame('disconnected', $setting->connection_status);
        $this->assertFalse((bool) $setting->auto_connect);
        $this->assertSame('qr_timeout', $setting->meta['lifecycle_state'] ?? null);
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
