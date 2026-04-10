<?php

namespace Tests\Feature;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    private function seedWorkspace(bool $superadmin = false): array
    {
        $user = User::factory()->create([
            'email' => 'mobile@example.test',
            'password' => 'password',
            'is_superadmin' => $superadmin,
        ]);

        $tenant = Tenant::create([
            'owner_user_id' => $user->id,
            'name' => 'Mobile Family',
            'slug' => 'mobile-family',
            'display_name' => 'Mobile Family',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'currency_code' => 'IDR',
            'plan_code' => 'pro',
            'status' => 'active',
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => 'Mobile Owner',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'row_version' => 1,
        ]);

        return [$user, $tenant];
    }

    public function test_mobile_login_returns_sanctum_token(): void
    {
        [$user] = $this->seedWorkspace();

        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'Pixel 9',
        ]);

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'token',
                    'token_type',
                    'user',
                    'memberships_count',
                ],
            ]);
    }

    public function test_mobile_tenants_and_bootstrap_return_expected_payload(): void
    {
        [$user, $tenant] = $this->seedWorkspace();
        $token = $user->createToken('mobile-test')->plainTextToken;

        $tenants = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/mobile/tenants');

        $tenants->assertOk()
            ->assertJsonPath('data.tenants.0.tenant.slug', $tenant->slug)
            ->assertJsonPath('data.tenants.0.member.role_code', 'owner');

        $bootstrap = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/mobile/bootstrap?tenant='.$tenant->slug);

        $bootstrap->assertOk()
            ->assertJsonPath('data.tenant.slug', $tenant->slug)
            ->assertJsonPath('data.member.role_code', 'owner')
            ->assertJsonPath('data.subscription.plan.code', 'pro')
            ->assertJsonPath('data.entitlements.modules.finance', true);
    }

    public function test_mobile_logout_revokes_current_token(): void
    {
        [$user] = $this->seedWorkspace();
        $token = $user->createToken('mobile-test')->plainTextToken;
        $tokenId = explode('|', $token)[0];

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/mobile/auth/logout');

        $response->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertNull(PersonalAccessToken::find($tokenId));
    }
}
