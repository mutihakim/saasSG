<?php

namespace Tests\Feature;

use App\Models\Tenant\Tenant;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantTag;
use App\Models\Master\TenantUom;
use App\Models\Identity\User;
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
            'master.categories.update',
            'master.categories.delete',
            'master.currencies.create',
            'master.currencies.update',
            'master.currencies.delete',
            'master.uom.create',
            'master.uom.update',
            'master.uom.delete',
            'master.tags.create',
            'master.tags.update',
            'master.tags.delete',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo([
            'master.categories.create',
            'master.categories.update',
            'master.categories.delete',
            'master.currencies.create',
            'master.currencies.update',
            'master.currencies.delete',
            'master.uom.create',
            'master.uom.update',
            'master.uom.delete',
            'master.tags.create',
            'master.tags.update',
            'master.tags.delete',
        ]);
    }

    public function test_master_data_mutations_write_activity_logs(): void
    {
        $category = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/categories", [
                'name' => 'Transport',
                'module' => 'finance',
                'sub_type' => 'pengeluaran',
            ])
            ->assertCreated()
            ->json('data.category');

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'master.category.created',
            'target_type' => 'tenant_categories',
            'target_id' => (string) $category['id'],
        ]);

        $categoryModel = TenantCategory::query()->findOrFail($category['id']);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/master/categories/{$category['id']}", [
                'name' => 'Transport Updated',
                'sub_type' => 'pengeluaran',
                'row_version' => $categoryModel->row_version,
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'master.category.updated',
            'target_type' => 'tenant_categories',
            'target_id' => (string) $category['id'],
        ]);

        $categoryB = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'sub_type' => 'pengeluaran',
            'name' => 'Bills',
            'is_default' => false,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/master/categories/bulk-parent", [
                'ids' => [$category['id'], $categoryB->id],
                'parent_id' => null,
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'master.category.bulk_parent_updated',
            'target_type' => 'tenants',
            'target_id' => (string) $this->tenant->id,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/master/categories", [
                'ids' => [$category['id'], $categoryB->id],
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'master.category.bulk_deleted',
            'target_type' => 'tenants',
            'target_id' => (string) $this->tenant->id,
        ]);

        $currency = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/currencies", [
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
            ])
            ->assertCreated()
            ->json('data');
        $currencyModel = TenantCurrency::query()->findOrFail($currency['id']);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/master/currencies/{$currency['id']}", [
                'name' => 'US Dollar Updated',
                'row_version' => $currencyModel->row_version,
            ])
            ->assertOk();

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/master/currencies/{$currency['id']}")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.currency.created', 'target_id' => (string) $currency['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.currency.updated', 'target_id' => (string) $currency['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.currency.deleted', 'target_id' => (string) $currency['id']]);

        $uom = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/uom", [
                'code' => 'PCS',
                'name' => 'Pieces',
                'abbreviation' => 'pcs',
                'dimension_type' => 'jumlah',
                'base_factor' => 1,
            ])
            ->assertCreated()
            ->json('data');
        $uomModel = TenantUom::query()->findOrFail($uom['id']);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/master/uom/{$uom['id']}", [
                'name' => 'Piece Unit',
                'row_version' => $uomModel->row_version,
            ])
            ->assertOk();

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/master/uom/{$uom['id']}")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.uom.created', 'target_id' => (string) $uom['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.uom.updated', 'target_id' => (string) $uom['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.uom.deleted', 'target_id' => (string) $uom['id']]);

        $tag = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/master/tags", [
                'name' => 'Bulanan',
            ])
            ->assertCreated()
            ->json('data.tag');
        $tagModel = TenantTag::query()->findOrFail($tag['id']);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/master/tags/{$tag['id']}", [
                'name' => 'Bulanan Updated',
                'row_version' => $tagModel->row_version,
            ])
            ->assertOk();

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/master/tags/{$tag['id']}")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.tag.created', 'target_id' => (string) $tag['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.tag.updated', 'target_id' => (string) $tag['id']]);
        $this->assertDatabaseHas('activity_logs', ['tenant_id' => $this->tenant->id, 'action' => 'master.tag.deleted', 'target_id' => (string) $tag['id']]);
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
