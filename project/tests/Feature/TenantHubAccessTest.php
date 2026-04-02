<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TenantHubAccessTest extends TestCase
{
    use RefreshDatabase;

    private function provisionTenant(): array
    {
        $owner = User::factory()->create();
        $tenant = Tenant::create([
            'name' => 'Keluarga Cemara',
            'slug' => 'keluarga-cemara',
            'owner_user_id' => $owner->id,
            'display_name' => 'Keluarga Cemara',
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'full_name' => $owner->name,
            'role_code' => 'owner',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
        ]);

        return [$owner, $tenant];
    }

    public function test_authenticated_user_can_access_hub_at_root(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        // Mock the domain
        $url = "https://{$tenant->slug}.appsah.my.id/";

        $response = $this->actingAs($user)
            ->get($url);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Frontend/Member/Hub')
            ->has('tenantName')
            ->has('demo')
        );
    }

    public function test_authenticated_user_can_access_member_profile_and_settings(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.appsah.my.id/me")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Frontend/Member/UserProfile')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.appsah.my.id/me/settings")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Frontend/Member/UserSettings')
            );
    }

    public function test_guest_is_shown_landing_page_at_root(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        $response = $this->get("https://{$tenant->slug}.appsah.my.id/");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Frontend/Landing')
        );
    }
}
