<?php

namespace Tests\Feature;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceStructureAccessTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $owner;
    private User $member;
    private TenantMember $ownerMembership;
    private TenantMember $memberMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->member = User::factory()->create();

        $this->tenant = Tenant::factory()->create([
            'slug' => 'finance-access-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Owner Access',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        $this->memberMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->member->id,
            'full_name' => 'Member Access',
            'role_code' => 'member',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
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

        $this->seedFinanceRolePermissions();
    }

    public function test_member_can_create_private_account_but_payload_is_forced_private(): void
    {
        $response = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts", [
                'name' => 'Member Wallet',
                'scope' => 'shared',
                'type' => 'cash',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'member_access_ids' => [$this->ownerMembership->id],
                'opening_balance' => 50000,
                'notes' => 'Should be private only',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.account.scope', 'private');
        $response->assertJsonPath('data.account.owner_member_id', $this->memberMembership->id);
        $response->assertJsonPath('data.account.member_access.0.id', $this->memberMembership->id);
        $response->assertJsonPath('data.account.member_access.0.pivot.can_manage', 1);
    }

    public function test_member_can_update_and_delete_own_private_account_but_cannot_touch_shared_account(): void
    {
        $private = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->memberMembership->id,
            'name' => 'Private Wallet',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 10000,
            'current_balance' => 10000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $shared = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Family Cash',
            'scope' => 'shared',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $private->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);

        $shared->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $updatePrivate = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$private->id}", [
                'name' => 'Private Wallet Updated',
                'scope' => 'shared',
                'type' => 'cash',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'notes' => 'Updated note',
                'is_active' => true,
                'member_access_ids' => [$this->ownerMembership->id],
                'row_version' => 1,
            ]);

        $updatePrivate->assertOk();
        $updatePrivate->assertJsonPath('data.account.scope', 'private');
        $updatePrivate->assertJsonPath('data.account.owner_member_id', $this->memberMembership->id);

        $updateShared = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$shared->id}", [
                'name' => 'Should Fail',
                'scope' => 'shared',
                'type' => 'cash',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'notes' => '',
                'is_active' => true,
                'member_access_ids' => [],
                'row_version' => 1,
            ]);

        $updateShared->assertForbidden();

        $deletePrivate = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$private->id}");

        $deletePrivate->assertOk();

        $deleteShared = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$shared->id}");

        $deleteShared->assertForbidden();
    }

    public function test_member_can_create_update_and_delete_private_budget_but_cannot_touch_shared_budget(): void
    {
        $create = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets", [
                'name' => 'Personal Budget',
                'scope' => 'shared',
                'period_month' => '2026-04',
                'allocated_amount' => 250000,
                'owner_member_id' => $this->ownerMembership->id,
                'member_access_ids' => [$this->ownerMembership->id],
                'notes' => 'Should be private only',
            ]);

        $create->assertCreated();
        $create->assertJsonPath('data.budget.scope', 'private');
        $create->assertJsonPath('data.budget.owner_member_id', $this->memberMembership->id);
        $this->assertNotEmpty($create->json('data.budget.code'));

        $privateBudgetId = $create->json('data.budget.id');

        $sharedBudget = TenantBudget::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Shared Family Budget',
            'code' => 'SFB',
            'scope' => 'shared',
            'period_month' => '2026-04',
            'allocated_amount' => 500000,
            'spent_amount' => 0,
            'remaining_amount' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $sharedBudget->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $updatePrivate = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets/{$privateBudgetId}", [
                'name' => 'Personal Budget Updated',
                'scope' => 'shared',
                'period_month' => '2026-04',
                'allocated_amount' => 275000,
                'owner_member_id' => $this->ownerMembership->id,
                'member_access_ids' => [$this->ownerMembership->id],
                'notes' => 'Updated',
                'is_active' => true,
                'row_version' => 1,
            ]);

        $updatePrivate->assertOk();
        $updatePrivate->assertJsonPath('data.budget.scope', 'private');
        $updatePrivate->assertJsonPath('data.budget.owner_member_id', $this->memberMembership->id);
        $this->assertNotEmpty($updatePrivate->json('data.budget.code'));

        $updateShared = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets/{$sharedBudget->id}", [
                'name' => 'Should Fail',
                'code' => 'FAIL',
                'scope' => 'shared',
                'period_month' => '2026-04',
                'allocated_amount' => 500000,
                'owner_member_id' => $this->ownerMembership->id,
                'member_access_ids' => [],
                'notes' => '',
                'is_active' => true,
                'row_version' => 1,
            ]);

        $updateShared->assertForbidden();

        $deletePrivate = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets/{$privateBudgetId}");

        $deletePrivate->assertOk();

        $deleteShared = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets/{$sharedBudget->id}");

        $deleteShared->assertForbidden();
    }

    public function test_account_type_cannot_change_after_transactions_exist(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Locked Type Account',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $account->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Test Expense',
            'slug' => 'test-expense',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'updated_by' => $this->ownerMembership->id,
            'type' => 'pengeluaran',
            'transaction_date' => now()->toDateString(),
            'amount' => 10000,
            'exchange_rate' => 1,
            'amount_base' => 10000,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'category_id' => $category->id,
            'bank_account_id' => $account->id,
            'description' => 'Existing transaction',
            'status' => 'terverifikasi',
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts/{$account->id}", [
                'name' => 'Locked Type Account',
                'scope' => 'private',
                'type' => 'credit_card',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'opening_balance' => 100000,
                'notes' => '',
                'is_active' => true,
                'member_access_ids' => [],
                'row_version' => 1,
            ]);

        $response->assertStatus(422);
        $response->assertJsonPath('error_code', 'ACCOUNT_TYPE_LOCKED');
    }

    public function test_budget_update_without_code_preserves_existing_code(): void
    {
        $budget = TenantBudget::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Household Budget',
            'code' => 'HOME-APR',
            'scope' => 'shared',
            'period_month' => '2026-04',
            'allocated_amount' => 900000,
            'spent_amount' => 0,
            'remaining_amount' => 900000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/budgets/{$budget->id}", [
                'name' => 'Household Budget Revised',
                'scope' => 'shared',
                'period_month' => '2026-04',
                'allocated_amount' => 950000,
                'owner_member_id' => $this->ownerMembership->id,
                'member_access_ids' => [],
                'notes' => '',
                'is_active' => true,
                'row_version' => 1,
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.budget.code', 'HOME-APR');
    }

    public function test_member_cannot_update_or_delete_shared_transaction_without_manage_scope(): void
    {
        $sharedAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Family Wallet',
            'scope' => 'shared',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $sharedAccount->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'bank_account_id' => $sharedAccount->id,
            'currency_id' => TenantCurrency::query()->where('tenant_id', $this->tenant->id)->value('id'),
            'description' => 'Shared purchase',
            'row_version' => 1,
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Shared Expense',
            'slug' => 'shared-expense',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $updateResponse = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}", [
                'type' => 'pengeluaran',
                'transaction_date' => now()->toDateString(),
                'amount' => 75000,
                'currency_code' => 'IDR',
                'category_id' => $category->id,
                'description' => 'Unauthorized update',
                'bank_account_id' => $sharedAccount->id,
                'owner_member_id' => $this->ownerMembership->id,
                'row_version' => 1,
            ]);

        $updateResponse->assertForbidden();

        $deleteResponse = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}");

        $deleteResponse->assertForbidden();
    }

    public function test_member_can_load_transactions_and_summary_from_shared_access_without_sql_errors(): void
    {
        $sharedAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Shared Wallet',
            'scope' => 'shared',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 150000,
            'current_balance' => 150000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $sharedAccount->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Shared Expense',
            'slug' => 'shared-expense',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'bank_account_id' => $sharedAccount->id,
            'category_id' => $category->id,
            'currency_id' => TenantCurrency::query()->where('tenant_id', $this->tenant->id)->value('id'),
            'type' => 'pengeluaran',
            'amount' => 45000,
            'amount_base' => 45000,
            'transaction_date' => '2026-04-06',
            'description' => 'Shared purchase',
        ]);

        $transactions = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions");

        $transactions->assertOk()
            ->assertJsonPath('data.transactions.0.description', 'Shared purchase');

        $summary = $this->actingAs($this->member)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/summary?month=2026-04");

        $summary->assertOk()
            ->assertJsonPath('data.transaction_count', 1);
    }

    private function seedFinanceRolePermissions(): void
    {
        $permissions = ['finance.view', 'finance.create', 'finance.update', 'finance.delete'];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);

        $ownerRole = Role::query()->firstOrCreate(
            ['name' => 'owner', 'guard_name' => 'web', 'tenant_id' => $this->tenant->id],
            ['display_name' => 'Owner', 'is_system' => true, 'row_version' => 1]
        );
        $memberRole = Role::query()->firstOrCreate(
            ['name' => 'member', 'guard_name' => 'web', 'tenant_id' => $this->tenant->id],
            ['display_name' => 'Member', 'is_system' => true, 'row_version' => 1]
        );

        $ownerRole->syncPermissions($permissions);
        $memberRole->syncPermissions($permissions);

        $this->owner->assignRole('owner');
        $this->member->assignRole('member');
    }
}
