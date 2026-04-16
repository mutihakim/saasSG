<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceWallet;
use App\Models\Finance\FinanceSavingsGoal;
use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceGoalTest extends TestCase
{
    private Tenant $tenant;
    private User $owner;
    private TenantMember $ownerMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug' => 'goal-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Goal Owner',
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

    public function test_goal_create_starts_with_zero_reserved_amount(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Goal Source',
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
            'name' => 'Dana Ekspansi',
            'slug' => 'dana-ekspansi',
            'type' => 'business',
            'purpose_type' => 'saving',
            'is_system' => false,
            'scope' => 'private',
            'currency_code' => 'IDR',
            'reference_code' => 'WLT-GOAL01',
            'icon_key' => 'ri-safe-2-line',
            'current_balance' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/goals", [
                'wallet_id' => $wallet->id,
                'name' => 'Modal Booth Baru',
                'target_amount' => 1500000,
                'target_date' => now()->addMonth()->toDateString(),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.goal.current_amount', '0.00');
    }

    public function test_goal_can_be_funded_and_spent_with_goal_transaction_history(): void
    {
        $sourceAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Operational',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 800000,
            'current_balance' => 800000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $goalAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Reserve',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 250000,
            'current_balance' => 250000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $sourceWallet = FinanceWallet::create([
            'tenant_id' => $this->tenant->id,
            'real_account_id' => $sourceAccount->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Kas Operasional',
            'slug' => 'kas-operasional',
            'type' => 'business',
            'purpose_type' => 'spending',
            'is_system' => false,
            'scope' => 'private',
            'currency_code' => 'IDR',
            'reference_code' => 'WLT-SRC001',
            'icon_key' => 'ri-briefcase-4-line',
            'current_balance' => 800000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $goalWallet = FinanceWallet::create([
            'tenant_id' => $this->tenant->id,
            'real_account_id' => $goalAccount->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Dana Booth',
            'slug' => 'dana-booth',
            'type' => 'business',
            'purpose_type' => 'saving',
            'is_system' => false,
            'scope' => 'private',
            'currency_code' => 'IDR',
            'reference_code' => 'WLT-GOAL02',
            'icon_key' => 'ri-safe-2-line',
            'current_balance' => 250000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Belanja Booth',
            'slug' => 'belanja-booth',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $goal = FinanceSavingsGoal::create([
            'tenant_id' => $this->tenant->id,
            'wallet_id' => $goalWallet->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Booth Pameran',
            'target_amount' => 1200000,
            'current_amount' => 0,
            'status' => 'active',
            'row_version' => 1,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/goals/{$goal->id}/fund", [
                'source_wallet_id' => $sourceWallet->id,
                'amount' => 300000,
                'transaction_date' => now()->toDateString(),
                'description' => 'Top up booth',
            ])
            ->assertOk()
            ->assertJsonPath('data.goal.current_amount', '300000.00');

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/goals/{$goal->id}/spend", [
                'amount' => 125000,
                'transaction_date' => now()->toDateString(),
                'category_id' => $category->id,
                'description' => 'Bayar DP booth',
            ])
            ->assertOk()
            ->assertJsonPath('data.goal.current_amount', '175000.00');

        $this->assertDatabaseHas('finance_transactions', [
            'tenant_id' => $this->tenant->id,
            'source_type' => 'wallet_goal',
            'source_id' => $goal->id,
            'type' => 'transfer',
            'amount' => 300000,
        ]);

        $this->assertDatabaseHas('finance_transactions', [
            'tenant_id' => $this->tenant->id,
            'source_type' => 'wallet_goal',
            'source_id' => $goal->id,
            'type' => 'pengeluaran',
            'amount' => 125000,
        ]);
    }
}
