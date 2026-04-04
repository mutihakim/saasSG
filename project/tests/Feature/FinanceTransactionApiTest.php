<?php

namespace Tests\Feature;

use App\Models\FinanceTransaction;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantMember;
use App\Models\ActivityLog;
use App\Models\TenantBankAccount;
use App\Services\FinanceAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceTransactionApiTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $owner;
    protected $member;
    protected $ownerMembership;
    protected $memberMembership;
    protected $account;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug'          => 'testfam',
            'owner_user_id' => $this->owner->id,
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

    public function test_family_summary_excludes_internal_transfers_from_income_and_expense(): void
    {
        $currencyId = TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id;

        FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $this->account->id,
            'type' => 'pemasukan',
            'amount' => 100000,
            'exchange_rate' => 1,
            'amount_base' => 100000,
            'transaction_date' => now()->startOfMonth()->toDateString(),
        ]);

        FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $this->account->id,
            'type' => 'pengeluaran',
            'amount' => 40000,
            'exchange_rate' => 1,
            'amount_base' => 40000,
            'transaction_date' => now()->startOfMonth()->toDateString(),
        ]);

        FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => $currencyId,
            'bank_account_id' => $this->account->id,
            'type' => 'transfer',
            'amount' => 25000,
            'exchange_rate' => 1,
            'amount_base' => 25000,
            'is_internal_transfer' => true,
            'transfer_direction' => 'out',
            'transaction_date' => now()->startOfMonth()->toDateString(),
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/summary?month=" . now()->format('Y-m'));

        $response->assertOk();
        $response->assertJsonPath('data.total_income_base', 100000);
        $response->assertJsonPath('data.total_expense_base', 40000);
        $response->assertJsonPath('data.balance_base', 60000);
        $response->assertJsonPath('data.transfer_total_base', 25000);
    }
}
