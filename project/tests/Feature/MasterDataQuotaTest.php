<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\TenantTag;
use App\Models\TenantUom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MasterDataQuotaTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug' => 'master-quota',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'free',
            'currency_code' => 'IDR',
        ]);

        TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Owner',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        foreach ([
            'master.categories.create',
            'master.currencies.create',
            'master.uom.create',
            'master.tags.create',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo([
            'master.categories.create',
            'master.currencies.create',
            'master.uom.create',
            'master.tags.create',
        ]);
    }

    public function test_category_quota_is_enforced(): void
    {
        $plans = Config::get('subscription_entitlements.plans', []);
        $plans['free']['limits']['master.categories.max'] = 1;
        Config::set('subscription_entitlements.plans', $plans);

        TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'sub_type' => 'pengeluaran',
            'name' => 'Custom Cat',
            'is_default' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/categories", [
                'name' => 'Extra Cat',
                'module' => 'finance',
                'sub_type' => 'pengeluaran',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PLAN_QUOTA_EXCEEDED')
            ->assertJsonPath('limit_key', 'master.categories.max');
    }

    public function test_currency_quota_is_enforced(): void
    {
        $plans = Config::get('subscription_entitlements.plans', []);
        $plans['free']['limits']['master.currencies.max'] = 1;
        Config::set('subscription_entitlements.plans', $plans);

        TenantCurrency::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'IDR',
            'name' => 'Rupiah',
            'symbol' => 'Rp',
            'symbol_position' => 'before',
            'decimal_places' => 0,
            'exchange_rate' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/currencies", [
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PLAN_QUOTA_EXCEEDED')
            ->assertJsonPath('limit_key', 'master.currencies.max');
    }

    public function test_uom_quota_is_enforced(): void
    {
        $plans = Config::get('subscription_entitlements.plans', []);
        $plans['free']['limits']['master.uom.max'] = 1;
        Config::set('subscription_entitlements.plans', $plans);

        TenantUom::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'PCS',
            'name' => 'Pieces',
            'abbreviation' => 'pcs',
            'dimension_type' => 'jumlah',
            'base_factor' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/uom", [
                'code' => 'BOX',
                'name' => 'Box',
                'abbreviation' => 'box',
                'dimension_type' => 'jumlah',
                'base_factor' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PLAN_QUOTA_EXCEEDED')
            ->assertJsonPath('limit_key', 'master.uom.max');
    }

    public function test_tag_quota_is_enforced(): void
    {
        $plans = Config::get('subscription_entitlements.plans', []);
        $plans['free']['limits']['master.tags.max'] = 1;
        Config::set('subscription_entitlements.plans', $plans);

        TenantTag::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Bulanan',
            'color' => '#000000',
            'usage_count' => 0,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/tags", [
                'name' => 'Extra',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PLAN_QUOTA_EXCEEDED')
            ->assertJsonPath('limit_key', 'master.tags.max');
    }
}
