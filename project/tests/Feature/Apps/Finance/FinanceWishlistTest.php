<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Models\Finance\WalletWish;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceWishlistTest extends TestCase
{
    private Tenant $tenant;
    private User $owner;
    private TenantMember $ownerMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug' => 'wish-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Wish Owner',
            'role_code' => 'owner',
            'profile_status' => 'active',
        ]);

        TenantCurrency::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'IDR',
            'name' => 'Indonesian Rupiah',
            'symbol' => 'Rp',
            'symbol_position' => 'before',
            'decimal_places' => 0,
            'exchange_rate' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        foreach (['finance.view', 'finance.create', 'finance.update', 'finance.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'finance.update', 'finance.delete']);
    }

    public function test_wish_can_be_converted_into_goal(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Mandiri',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 500000,
            'current_balance' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $wallet = FinanceWallet::create([
            'tenant_id' => $this->tenant->id,
            'real_account_id' => $account->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Dana Umroh',
            'slug' => 'dana-umroh',
            'type' => 'personal',
            'is_system' => false,
            'scope' => 'private',
            'currency_code' => 'IDR',
            'reference_code' => 'WLT-TEST0001',
            'icon_key' => 'ri-plane-line',
            'current_balance' => 250000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $wish = WalletWish::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'title' => 'Umroh 2027',
            'estimated_amount' => 35000000,
            'priority' => 'high',
            'status' => 'approved',
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$wish->id}/convert", [
                'wallet_id' => $wallet->id,
                'target_amount' => 35000000,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.goal.name', 'Umroh 2027')
            ->assertJsonPath('data.wish.status', 'converted');

        $this->assertDatabaseHas('finance_savings_goals', [
            'tenant_id' => $this->tenant->id,
            'wallet_id' => $wallet->id,
            'name' => 'Umroh 2027',
        ]);
    }

    public function test_wishlist_mutations_write_activity_logs(): void
    {
        $wish = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes", [
                'title' => 'Audit Wish',
                'priority' => 'medium',
            ])
            ->assertCreated()
            ->json('data.wish');

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.created',
            'target_id' => (string) $wish['id'],
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$wish['id']}", [
                'title' => 'Audit Wish Updated',
                'description' => '',
                'estimated_amount' => 1000000,
                'priority' => 'high',
                'image_url' => null,
                'notes' => '',
                'row_version' => $wish['row_version'],
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.updated',
            'target_id' => (string) $wish['id'],
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$wish['id']}/approve")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.approved',
            'target_id' => (string) $wish['id'],
        ]);

        $rejectWish = WalletWish::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'title' => 'Reject Me',
            'priority' => 'low',
            'status' => 'pending',
            'row_version' => 1,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$rejectWish->id}/reject")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.rejected',
            'target_id' => (string) $rejectWish->id,
        ]);

        $deleteWish = WalletWish::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'title' => 'Delete Me',
            'priority' => 'low',
            'status' => 'pending',
            'row_version' => 1,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$deleteWish->id}")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.deleted',
            'target_id' => (string) $deleteWish->id,
        ]);
    }
}
