<?php

namespace Tests\Feature;

use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\User;
use App\Models\WalletWish;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class WalletApiTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $owner;
    private TenantMember $ownerMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug' => 'wallet-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Wallet Owner',
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

        foreach (['finance.view', 'finance.create', 'wallet.view', 'wallet.create', 'wallet.update', 'wallet.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'wallet.view', 'wallet.create', 'wallet.update', 'wallet.delete']);
    }

    public function test_wallet_account_creation_creates_main_pocket(): void
    {
        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/wallet/accounts", [
                'name' => 'BCA',
                'scope' => 'private',
                'type' => 'bank',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'opening_balance' => 250000,
                'notes' => 'Primary bank',
            ]);

        $response->assertCreated();
        $accountId = $response->json('data.account.id');

        $this->assertDatabaseHas('finance_pockets', [
            'tenant_id' => $this->tenant->id,
            'real_account_id' => $accountId,
            'is_system' => true,
            'type' => 'main',
        ]);
    }

    public function test_finance_only_transaction_without_pocket_uses_main_pocket(): void
    {
        $this->tenant->update(['plan_code' => 'free']);

        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Food',
            'slug' => 'food',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", [
                'type' => 'pengeluaran',
                'amount' => 30000,
                'currency_code' => 'IDR',
                'exchange_rate' => 1,
                'category_id' => $category->id,
                'transaction_date' => now()->toDateString(),
                'bank_account_id' => $account->id,
                'owner_member_id' => $this->ownerMembership->id,
                'description' => 'Dinner',
            ]);

        $response->assertCreated();
        $transactionPocketId = $response->json('data.transaction.pocket_id');

        $this->assertNotNull($transactionPocketId);
        $this->assertDatabaseHas('finance_pockets', [
            'id' => $transactionPocketId,
            'real_account_id' => $account->id,
            'is_system' => true,
        ]);
    }

    public function test_free_plan_cannot_create_additional_wallet_beyond_default(): void
    {
        $this->tenant->update(['plan_code' => 'free']);

        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        app(\App\Services\WalletPocketService::class)->ensureMainPocket($account);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/wallet/wallets", [
                'name' => 'Dana Umroh',
                'type' => 'personal',
                'scope' => 'private',
                'real_account_id' => $account->id,
                'purpose_type' => 'spending',
                'owner_member_id' => $this->ownerMembership->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'PLAN_QUOTA_EXCEEDED');
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

        $wallet = FinancePocket::create([
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
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/wallet/wishes/{$wish->id}/convert", [
                'wallet_id' => $wallet->id,
                'target_amount' => 35000000,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.goal.name', 'Umroh 2027')
            ->assertJsonPath('data.wish.status', 'converted');

        $this->assertDatabaseHas('finance_savings_goals', [
            'tenant_id' => $this->tenant->id,
            'pocket_id' => $wallet->id,
            'name' => 'Umroh 2027',
        ]);
    }
}
