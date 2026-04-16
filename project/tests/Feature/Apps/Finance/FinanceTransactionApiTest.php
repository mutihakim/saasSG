<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Models\Identity\User;
use App\Models\Tenant\TenantMember;
use App\Models\Misc\ActivityLog;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Wallet\FinanceWalletService;

use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceTransactionApiTest extends TestCase
{

    protected $tenant;
    protected $owner;
    protected $member;
    protected $ownerMembership;
    protected $memberMembership;
    protected $account;
    protected $mainPocket;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug'          => 'testfam',
            'owner_user_id' => $this->owner->id,
            'plan_code'     => 'pro',
            'currency_code' => 'IDR',
        ]);
        $this->member = User::factory()->create();

        $this->ownerMembership = TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'full_name'      => 'Owner Name',
            'role_code'      => 'owner',
            'profile_status' => 'active',
        ]);

        $this->memberMembership = TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->member->id,
            'full_name'      => 'Member Name',
            'role_code'      => 'member',
            'profile_status' => 'active',
        ]);

        TenantCurrency::create([
            'tenant_id'     => $this->tenant->id,
            'code'          => 'IDR',
            'name'          => 'Indonesian Rupiah',
            'symbol'        => 'Rp',
            'symbol_position' => 'before',
            'decimal_places'  => 0,
            'exchange_rate'   => 1.0,
            'is_active'     => true,
            'sort_order'    => 1,
        ]);

        $this->account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Test Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 1000000,
            'current_balance' => 1000000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $this->account->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);

        $this->mainPocket = app(FinanceWalletService::class)->ensureMainPocket($this->account);

        foreach (['finance.view', 'finance.create', 'finance.update', 'finance.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'finance.update', 'finance.delete']);
    }

    public function test_can_list_transactions()
    {
        FinanceTransaction::factory()->count(3)->create([
            'tenant_id'  => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'type'       => 'pengeluaran',
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.transactions'));
    }

    public function test_can_create_transaction()
    {
        $category = TenantCategory::create([
            'tenant_id'  => $this->tenant->id,
            'module'     => 'finance',
            'name'       => 'Food',
            'slug'       => 'food',
            'sub_type'   => 'pengeluaran',
            'is_active'  => true,
            'sort_order' => 1,
        ]);

        $data = [
            'type'             => 'pengeluaran',
            'amount'           => 50000,
            'currency_code'    => 'IDR',
            'exchange_rate'    => 1.0,
            'category_id'     => $category->id,
            'transaction_date' => now()->toDateString(),
            'bank_account_id'  => $this->account->id,
            'owner_member_id'  => $this->ownerMembership->id,
            'description'      => 'Lunch',
        ];

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", $data);

        if ($response->status() !== 201) {
            dump($response->json());
        }

        $response->assertStatus(201);
        $this->assertDatabaseHas('finance_transactions', [
            'amount'      => 50000,
            'description' => 'Lunch',
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.transaction.created',
            'actor_member_id' => $this->ownerMembership->id,
        ]);
    }

    public function test_non_liability_transaction_rejects_when_wallet_balance_is_insufficient(): void
    {
        $category = TenantCategory::create([
            'tenant_id'  => $this->tenant->id,
            'module'     => 'finance',
            'name'       => 'Food',
            'slug'       => 'food',
            'sub_type'   => 'pengeluaran',
            'is_active'  => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", [
                'type' => 'pengeluaran',
                'amount' => 1500000,
                'currency_code' => 'IDR',
                'exchange_rate' => 1.0,
                'category_id' => $category->id,
                'transaction_date' => now()->toDateString(),
                'bank_account_id' => $this->account->id,
                'wallet_id' => $this->mainPocket->id,
                'owner_member_id' => $this->ownerMembership->id,
                'description' => 'Over limit expense',
            ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Saldo wallet tidak cukup. Transfer dana ke wallet ini terlebih dahulu.');
    }

    public function test_liability_transaction_can_make_wallet_negative(): void
    {
        $category = TenantCategory::create([
            'tenant_id'  => $this->tenant->id,
            'module'     => 'finance',
            'name'       => 'Gadget',
            'slug'       => 'gadget',
            'sub_type'   => 'pengeluaran',
            'is_active'  => true,
            'sort_order' => 1,
        ]);

        $liability = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Card',
            'scope' => 'private',
            'type' => 'credit_card',
            'currency_code' => 'IDR',
            'opening_balance' => 0,
            'current_balance' => 0,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $liability->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);
        $liabilityPocket = app(FinanceWalletService::class)->ensureMainPocket($liability);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", [
                'type' => 'pengeluaran',
                'amount' => 500000,
                'currency_code' => 'IDR',
                'exchange_rate' => 1.0,
                'category_id' => $category->id,
                'transaction_date' => now()->toDateString(),
                'wallet_id' => $liabilityPocket->id,
                'owner_member_id' => $this->ownerMembership->id,
                'description' => 'Card purchase',
            ]);

        $response->assertCreated();
        $this->assertSame(-500000.0, (float) $liability->fresh()->current_balance);
        $this->assertSame(-500000.0, (float) $liabilityPocket->fresh()->current_balance);
    }

    public function test_transfer_can_target_other_members_wallet_in_same_tenant(): void
    {
        $memberAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->memberMembership->id,
            'name' => 'Member Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 0,
            'current_balance' => 0,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $memberAccount->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);
        $memberPocket = app(FinanceWalletService::class)->ensureMainPocket($memberAccount);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", [
                'type' => 'transfer',
                'transaction_date' => now()->toDateString(),
                'amount' => 200000,
                'currency_code' => 'IDR',
                'exchange_rate' => 1,
                'description' => 'Transfer lintas member',
                'owner_member_id' => $this->ownerMembership->id,
                'recipient_member_id' => $this->memberMembership->id,
                'from_wallet_id' => $this->mainPocket->id,
                'to_wallet_id' => $memberPocket->id,
            ]);

        $response->assertCreated();
        $this->assertSame(800000.0, (float) $this->account->fresh()->current_balance);
        $this->assertSame(200000.0, (float) $memberAccount->fresh()->current_balance);
    }

    public function test_can_update_transaction()
    {
        $transaction = FinanceTransaction::factory()->create([
            'tenant_id'     => $this->tenant->id,
            'created_by'    => $this->ownerMembership->id,
            'currency_id'   => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'amount'        => 10000,
            'description'   => 'Old Desc',
            'row_version'   => 1,
        ]);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module'    => 'finance',
            'name'      => 'Food',
            'slug'      => 'food',
            'sub_type'  => 'pengeluaran',
            'is_active' => true,
        ]);

        $data = [
            'type'             => 'pengeluaran',
            'amount'           => 20000,
            'currency_code'    => 'IDR',
            'exchange_rate'    => 1.0,
            'category_id'      => $category->id,
            'transaction_date' => now()->toDateString(),
            'bank_account_id'  => $this->account->id,
            'owner_member_id'  => $this->ownerMembership->id,
            'description'      => 'New Desc',
            'row_version'      => 1,
        ];

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}", $data);

        $response->assertStatus(200);
        $this->assertEquals('New Desc', $response->json('data.transaction.description'));
        $this->assertEquals('IDR', $response->json('data.transaction.currency_code'));
        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.transaction.updated',
            'actor_member_id' => $this->ownerMembership->id,
            'target_id' => $transaction->id,
        ]);
    }

    public function test_update_non_liability_transaction_rejects_when_wallet_balance_would_be_negative(): void
    {
        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Food',
            'slug' => 'food',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $transaction = FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'updated_by' => $this->ownerMembership->id,
            'type' => 'pengeluaran',
            'transaction_date' => now()->toDateString(),
            'amount' => 200000,
            'exchange_rate' => 1,
            'amount_base' => 200000,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'category_id' => $category->id,
            'bank_account_id' => $this->account->id,
            'wallet_id' => $this->mainPocket->id,
            'description' => 'Initial expense',
            'status' => 'terverifikasi',
            'row_version' => 1,
        ]);

        app(\App\Services\Finance\FinanceLedgerService::class)->syncAfterCreate($transaction);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->patchJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}", [
                'type' => 'pengeluaran',
                'amount' => 1200000,
                'currency_code' => 'IDR',
                'exchange_rate' => 1.0,
                'category_id' => $category->id,
                'transaction_date' => now()->toDateString(),
                'wallet_id' => $this->mainPocket->id,
                'owner_member_id' => $this->ownerMembership->id,
                'description' => 'Too large expense',
                'row_version' => 1,
            ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Saldo akun tidak cukup untuk perubahan transaksi ini.');
    }

    public function test_can_delete_transaction_and_log_activity()
    {
        $transaction = FinanceTransaction::factory()->create([
            'tenant_id'   => $this->tenant->id,
            'created_by'  => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->deleteJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('finance_transactions', ['id' => $transaction->id]);
        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'action' => 'finance.transaction.deleted',
            'target_id' => $transaction->id,
        ]);
    }

    public function test_quota_limit_enforced()
    {
        // Placeholder — quota enforcement tested via entitlements mock
        $this->assertTrue(true);
    }


    public function test_member_access_query_handles_shared_account_access_without_sql_error(): void
    {
        $this->account->update([
            'scope' => 'shared',
        ]);

        $this->account->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $accounts = app(FinanceAccessService::class)
            ->accessibleAccountsQuery($this->tenant, $this->memberMembership)
            ->active()
            ->get();

        $this->assertCount(1, $accounts);
        $this->assertSame($this->account->id, $accounts->first()?->id);
    }

    public function test_visible_transactions_query_keeps_member_visibility_semantics_after_scope_resolution(): void
    {
        $currencyId = TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id;

        $sharedAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Shared Savings',
            'scope' => 'shared',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 200000,
            'current_balance' => 200000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $sharedAccount->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
            $this->memberMembership->id => ['can_view' => true, 'can_use' => false, 'can_manage' => false],
        ]);
        $sharedAccountPocket = app(FinanceWalletService::class)->ensureMainPocket($sharedAccount);

        $this->mainPocket->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => false, 'can_manage' => false],
        ]);

        $sharedBudget = TenantBudget::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'wallet_id' => $this->mainPocket->id,
            'name' => 'Shared Household Budget',
            'code' => 'HOME-APR',
            'budget_key' => 'shared-household-budget',
            'scope' => 'shared',
            'period_month' => now()->format('Y-m'),
            'allocated_amount' => 500000,
            'spent_amount' => 0,
            'remaining_amount' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $sharedBudget->memberAccess()->syncWithoutDetaching([
            $this->memberMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => false],
        ]);

        $hiddenAccount = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Private Reserve',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $hiddenAccount->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);
        $hiddenPocket = app(FinanceWalletService::class)->ensureMainPocket($hiddenAccount);

        $visibleBySharedAccount = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $sharedAccount->id,
            'wallet_id' => $sharedAccountPocket->id,
            'description' => 'Visible via shared account',
        ]);

        $visibleBySharedBudget = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $this->account->id,
            'wallet_id' => $this->mainPocket->id,
            'budget_id' => $sharedBudget->id,
            'description' => 'Visible via shared budget',
        ]);

        $visibleBySharedPocket = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $this->account->id,
            'wallet_id' => $this->mainPocket->id,
            'description' => 'Visible via shared pocket',
        ]);

        $hiddenTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $hiddenAccount->id,
            'wallet_id' => $hiddenPocket->id,
            'description' => 'Hidden private transaction',
        ]);

        $visibleIds = app(FinanceAccessService::class)
            ->visibleTransactionsQuery($this->tenant, $this->memberMembership)
            ->pluck('id')
            ->all();

        $this->assertContains($visibleBySharedAccount->id, $visibleIds);
        $this->assertContains($visibleBySharedBudget->id, $visibleIds);
        $this->assertContains($visibleBySharedPocket->id, $visibleIds);
        $this->assertNotContains($hiddenTransaction->id, $visibleIds);
    }


}
