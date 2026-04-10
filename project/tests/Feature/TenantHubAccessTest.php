<?php

namespace Tests\Feature;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
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
        $url = "https://{$tenant->slug}.sanjo.my.id/";

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
            ->get("https://{$tenant->slug}.sanjo.my.id/me")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Frontend/Member/UserProfile')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/me/settings")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Frontend/Member/UserSettings')
            );
    }

    public function test_finance_entry_renders_overview_page_and_wallet_route_is_removed(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/OverviewPage')
                ->where('financeRoute.section', 'home')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/wallet")
            ->assertNotFound();

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/budgets")
            ->assertRedirect("https://{$tenant->slug}.sanjo.my.id/finance/planning?view=budgets");
    }

    public function test_authenticated_user_can_access_finance_subroutes(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/home")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/OverviewPage')
                ->where('financeRoute.section', 'home')
                ->where('financeRoute.initial_tab', 'dashboard')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/accounts")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/AccountsPage')
                ->where('financeRoute.section', 'accounts')
                ->where('financeRoute.initial_tab', 'accounts')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/transactions")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/TransactionsPage')
                ->where('financeRoute.section', 'transactions')
                ->where('financeRoute.initial_tab', 'transactions')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/planning?view=budgets&period_month=2026-04")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/Planning/BudgetsPage')
                ->where('financeRoute.section', 'planning')
                ->where('financeRoute.initial_tab', 'budgets')
                ->where('financeRoute.period_month', '2026-04')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/planning?view=wishes")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/Planning/WishesPage')
                ->where('financeRoute.section', 'planning')
                ->where('financeRoute.initial_tab', 'wishes')
            );

        $this->actingAs($user)
            ->get("https://{$tenant->slug}.sanjo.my.id/finance/reports?view=stats")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tenant/Finance/ReportsPage')
                ->where('financeRoute.section', 'reports')
                ->where('financeRoute.initial_tab', 'stats')
            );
    }

    public function test_guest_is_shown_landing_page_at_root(): void
    {
        [$user, $tenant] = $this->provisionTenant();

        $response = $this->get("https://{$tenant->slug}.sanjo.my.id/");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Frontend/Landing')
        );
    }
}
