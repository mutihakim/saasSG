<?php

namespace Tests\Feature;

use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\TenantBudget;
use App\Services\Finance\MonthlyReviewService;
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
    private TenantMember $memberAbi;

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

        $this->memberAbi = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'full_name' => 'Abi',
            'role_code' => 'member',
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

    public function test_wallet_account_creation_creates_main_pocket(): void
    {
        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts", [
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

    public function test_account_and_pocket_show_endpoints_return_full_detail_metrics(): void
    {
        $currencyId = TenantCurrency::query()
            ->where('tenant_id', $this->tenant->id)
            ->value('id');

        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Cash Detail',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 160000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);
        $mainPocket = FinancePocket::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('real_account_id', $account->id)
            ->where('is_system', true)
            ->firstOrFail();

        FinanceSavingsGoal::create([
            'tenant_id' => $this->tenant->id,
            'pocket_id' => $mainPocket->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Emergency',
            'target_amount' => 300000,
            'current_amount' => 25000,
            'status' => 'active',
            'row_version' => 1,
        ]);

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'created_by' => $this->ownerMembership->id,
            'bank_account_id' => $account->id,
            'pocket_id' => $mainPocket->id,
            'type' => 'pemasukan',
            'transaction_date' => now()->toDateString(),
            'currency_id' => $currencyId,
            'currency_code' => 'IDR',
            'exchange_rate' => 1,
            'amount' => 60000,
            'amount_base' => 60000,
            'description' => 'Salary topup',
            'tags' => [],
        ]);

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'created_by' => $this->ownerMembership->id,
            'bank_account_id' => $account->id,
            'pocket_id' => $mainPocket->id,
            'type' => 'pengeluaran',
            'transaction_date' => now()->toDateString(),
            'currency_id' => $currencyId,
            'currency_code' => 'IDR',
            'exchange_rate' => 1,
            'amount' => 15000,
            'amount_base' => 15000,
            'description' => 'Groceries',
            'tags' => [],
        ]);

        $accountResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$account->id}");

        $accountResponse->assertOk()
            ->assertJsonPath('data.account.id', $account->id)
            ->assertJsonPath('data.account.total_inflow', 60000)
            ->assertJsonPath('data.account.total_outflow', 15000)
            ->assertJsonPath('data.account.goal_reserved_total', 25000);

        $pocketResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets/{$mainPocket->id}");

        $pocketResponse->assertOk()
            ->assertJsonPath('data.wallet.id', $mainPocket->id)
            ->assertJsonPath('data.wallet.total_inflow', 60000)
            ->assertJsonPath('data.wallet.total_outflow', 15000)
            ->assertJsonPath('data.wallet.goal_reserved_total', 25000);
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

        app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets", [
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

    public function test_enterprise_plan_can_create_wallet_goal_and_wish_without_quota_limit(): void
    {
        $this->tenant->update(['plan_code' => 'enterprise']);

        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Enterprise Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 1000000,
            'current_balance' => 1000000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);

        foreach (range(1, 12) as $i) {
            FinancePocket::create([
                'tenant_id' => $this->tenant->id,
                'real_account_id' => $account->id,
                'owner_member_id' => $this->ownerMembership->id,
                'name' => "Wallet {$i}",
                'slug' => "wallet-{$i}",
                'type' => 'personal',
                'purpose_type' => 'spending',
                'is_system' => false,
                'scope' => 'private',
                'currency_code' => 'IDR',
                'reference_code' => 'WLT-ENT-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'current_balance' => 0,
                'is_active' => true,
                'row_version' => 1,
            ]);
        }

        foreach (range(1, 12) as $i) {
            FinanceSavingsGoal::create([
                'tenant_id' => $this->tenant->id,
                'pocket_id' => FinancePocket::query()->where('tenant_id', $this->tenant->id)->where('is_system', false)->firstOrFail()->id,
                'owner_member_id' => $this->ownerMembership->id,
                'name' => "Goal {$i}",
                'target_amount' => 100000,
                'current_amount' => 0,
                'status' => 'active',
                'row_version' => 1,
            ]);
            WalletWish::create([
                'tenant_id' => $this->tenant->id,
                'owner_member_id' => $this->ownerMembership->id,
                'title' => "Wish {$i}",
                'priority' => 'medium',
                'status' => 'pending',
                'row_version' => 1,
            ]);
        }

        $walletResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets", [
                'name' => 'Wallet Unlimited',
                'type' => 'project',
                'scope' => 'private',
                'real_account_id' => $account->id,
                'purpose_type' => 'spending',
                'owner_member_id' => $this->ownerMembership->id,
            ]);
        $walletResponse->assertCreated();

        $walletId = $walletResponse->json('data.wallet.id');

        $goalResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/goals", [
                'pocket_id' => $walletId,
                'name' => 'Goal Unlimited',
                'target_amount' => 250000,
            ]);
        $goalResponse->assertCreated();

        $wishResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes", [
                'title' => 'Wish Unlimited',
                'priority' => 'high',
            ]);
        $wishResponse->assertCreated();
    }

    public function test_previous_month_budgets_without_transactions_do_not_block_planning(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Review Account',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 500000,
            'current_balance' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        TenantBudget::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'March Budget',
            'code' => 'MARCH-BUDGET',
            'budget_key' => 'march-budget',
            'period_month' => now()->startOfMonth()->subMonth()->format('Y-m'),
            'scope' => 'private',
            'allocated_amount' => 100000,
            'spent_amount' => 0,
            'remaining_amount' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $status = app(MonthlyReviewService::class)->buildStatus($this->tenant, $this->ownerMembership);

        $this->assertSame('open', $status['previous_month_status']);
        $this->assertFalse($status['planning_blocked']);
        $this->assertSame([], $status['eligible_months']);
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
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$wish->id}/convert", [
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

        $wallet = FinancePocket::create([
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
                'pocket_id' => $wallet->id,
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

        $sourceWallet = FinancePocket::create([
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

        $goalWallet = FinancePocket::create([
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
            'pocket_id' => $goalWallet->id,
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
                'source_pocket_id' => $sourceWallet->id,
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

    public function test_account_sharing_update_syncs_main_pocket_scope_owner_and_access(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Shared Ops',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 150000,
            'current_balance' => 150000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $mainPocket = app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$account->id}", [
                'name' => 'Shared Ops',
                'scope' => 'shared',
                'type' => 'bank',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'opening_balance' => 150000,
                'notes' => 'Updated',
                'is_active' => true,
                'row_version' => 1,
                'member_access' => [
                    [
                        'id' => $this->memberAbi->id,
                        'can_view' => true,
                        'can_use' => true,
                        'can_manage' => false,
                    ],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.account.scope', 'shared');

        $mainPocket->refresh();

        $this->assertSame('shared', $mainPocket->scope);
        $this->assertSame($this->ownerMembership->id, $mainPocket->owner_member_id);
        $this->assertDatabaseHas('finance_pocket_member_access', [
            'finance_pocket_id' => $mainPocket->id,
            'member_id' => $this->memberAbi->id,
            'can_view' => true,
            'can_use' => true,
            'can_manage' => false,
        ]);
    }

    public function test_private_account_cannot_create_shared_wallet(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Private Parent',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets", [
                'name' => 'Tim Operasional',
                'type' => 'family',
                'purpose_type' => 'spending',
                'scope' => 'shared',
                'real_account_id' => $account->id,
                'owner_member_id' => $this->ownerMembership->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'WALLET_SCOPE_EXCEEDS_ACCOUNT_SCOPE');
    }

    public function test_shared_wallet_inherits_account_access_and_custom_type(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Family Shared',
            'scope' => 'shared',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 300000,
            'current_balance' => 300000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $account->memberAccess()->sync([
            $this->memberAbi->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets", [
                'name' => 'Dana Sekolah',
                'type' => 'school fund',
                'purpose_type' => 'saving',
                'scope' => 'shared',
                'real_account_id' => $account->id,
                'owner_member_id' => $this->memberAbi->id,
                'member_access' => [
                    [
                        'id' => $this->memberAbi->id,
                        'can_view' => false,
                        'can_use' => false,
                        'can_manage' => true,
                    ],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.wallet.type', 'school fund')
            ->assertJsonPath('data.wallet.scope', 'shared')
            ->assertJsonPath('data.wallet.owner_member_id', $this->ownerMembership->id);

        $walletId = $response->json('data.wallet.id');

        $this->assertDatabaseHas('finance_pocket_member_access', [
            'finance_pocket_id' => $walletId,
            'member_id' => $this->memberAbi->id,
            'can_view' => true,
            'can_use' => true,
            'can_manage' => false,
        ]);
    }

    public function test_account_scope_change_to_private_converts_shared_child_wallet_to_private(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Shared Parent',
            'scope' => 'shared',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 250000,
            'current_balance' => 250000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $account->memberAccess()->sync([
            $this->memberAbi->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $wallet = FinancePocket::create([
            'tenant_id' => $this->tenant->id,
            'real_account_id' => $account->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Dana Komunal',
            'slug' => 'dana-komunal',
            'type' => 'family',
            'purpose_type' => 'saving',
            'is_system' => false,
            'scope' => 'shared',
            'currency_code' => 'IDR',
            'reference_code' => 'WLT-SHARED01',
            'icon_key' => 'ri-safe-2-line',
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $wallet->memberAccess()->sync([
            $this->memberAbi->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$account->id}", [
                'name' => 'Shared Parent',
                'scope' => 'private',
                'type' => 'bank',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'opening_balance' => 250000,
                'notes' => '',
                'is_active' => true,
                'row_version' => 1,
                'member_access' => [],
            ])
            ->assertOk();

        $wallet->refresh();

        $this->assertSame('private', $wallet->scope);
        $this->assertSame($this->ownerMembership->id, $wallet->owner_member_id);
        $this->assertDatabaseMissing('finance_pocket_member_access', [
            'finance_pocket_id' => $wallet->id,
            'member_id' => $this->memberAbi->id,
        ]);
    }

    public function test_system_wallet_allows_partial_update_but_keeps_inherited_fields_locked(): void
    {
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

        $mainPocket = app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);

        $budget = TenantBudget::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Operasional',
            'code' => 'OPS',
            'budget_key' => 'operasional',
            'scope' => 'private',
            'period_month' => now()->format('Y-m'),
            'allocated_amount' => 500000,
            'spent_amount' => 0,
            'remaining_amount' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $budget->memberAccess()->sync([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets/{$mainPocket->id}", [
                'name' => 'Hacked Name',
                'type' => 'personal',
                'purpose_type' => 'spending',
                'background_color' => '#06b6d4',
                'scope' => 'shared',
                'real_account_id' => $account->id,
                'owner_member_id' => $this->memberAbi->id,
                'default_budget_id' => $budget->id,
                'default_budget_key' => $budget->budget_key,
                'budget_lock_enabled' => true,
                'icon_key' => 'ri-safe-2-line',
                'notes' => 'Should not update',
                'is_active' => false,
                'member_access' => [
                    [
                        'id' => $this->memberAbi->id,
                        'can_view' => true,
                        'can_use' => true,
                        'can_manage' => true,
                    ],
                ],
                'row_version' => 1,
            ]);

        $response->assertOk();

        $mainPocket->refresh();

        $this->assertSame('Utama', $mainPocket->name);
        $this->assertSame('main', $mainPocket->type);
        $this->assertSame('private', $mainPocket->scope);
        $this->assertSame($this->ownerMembership->id, $mainPocket->owner_member_id);
        $this->assertTrue((bool) $mainPocket->is_active);
        $this->assertSame('ri-safe-2-line', $mainPocket->icon_key);
        $this->assertSame('#06b6d4', $mainPocket->background_color);
        $this->assertSame($budget->id, $mainPocket->default_budget_id);
        $this->assertTrue((bool) $mainPocket->budget_lock_enabled);
    }

    public function test_wallet_wish_and_month_review_mutations_write_activity_logs(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Audit Wallet Account',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 500000,
            'current_balance' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $wallet = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets", [
                'name' => 'Audit Wallet',
                'type' => 'personal',
                'purpose_type' => 'saving',
                'scope' => 'private',
                'real_account_id' => $account->id,
                'owner_member_id' => $this->ownerMembership->id,
            ])
            ->assertCreated()
            ->json('data.wallet');

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wallet.created',
            'target_id' => (string) $wallet['id'],
        ]);

        $updatedWallet = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets/{$wallet['id']}", [
                'name' => 'Audit Wallet Updated',
                'type' => 'personal',
                'purpose_type' => 'saving',
                'scope' => 'private',
                'real_account_id' => $account->id,
                'owner_member_id' => $this->ownerMembership->id,
                'background_color' => null,
                'budget_lock_enabled' => false,
                'icon_key' => null,
                'notes' => '',
                'is_active' => true,
                'member_access' => [],
                'row_version' => $wallet['row_version'],
            ])
            ->assertOk()
            ->json('data.wallet');

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wallet.updated',
            'target_id' => (string) $wallet['id'],
        ]);

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

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/wishes/{$wish['id']}/convert", [
                'wallet_id' => $updatedWallet['id'],
                'target_amount' => 1000000,
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wish.converted',
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

        $mainPocket = app(\App\Services\Finance\Wallet\WalletPocketService::class)->ensureMainPocket($account);
        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Prev Month',
            'slug' => 'prev-month',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $periodMonth = now()->startOfMonth()->subMonth()->format('Y-m');
        $previousMonthDate = now()->startOfMonth()->subMonth()->day(10)->toDateString();
        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'updated_by' => $this->ownerMembership->id,
            'type' => 'pengeluaran',
            'transaction_date' => $previousMonthDate,
            'amount' => 50000,
            'exchange_rate' => 1,
            'amount_base' => 50000,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'category_id' => $category->id,
            'bank_account_id' => $account->id,
            'pocket_id' => $mainPocket->id,
            'description' => 'Prev month expense',
            'status' => 'terverifikasi',
            'row_version' => 1,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/monthly-review/submit", [
                'period_month' => $periodMonth,
                'budget_method' => 'zero_based',
            ])
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.month_review.closed',
            'target_type' => 'finance_month_reviews',
            'target_id' => $periodMonth,
        ]);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/pockets/{$updatedWallet['id']}")
            ->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.wallet.deleted',
            'target_id' => (string) $wallet['id'],
        ]);
    }
}
