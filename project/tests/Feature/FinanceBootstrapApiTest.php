<?php

namespace Tests\Feature;

use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceBootstrapApiTest extends TestCase
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
            'slug' => 'finance-bootstrap-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Bootstrap Owner',
            'role_code' => 'owner',
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

        foreach (['finance.view', 'finance.create', 'finance.update', 'finance.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'finance.update', 'finance.delete']);
    }

    public function test_transactions_bootstrap_returns_summary_and_meta(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Kas Harian',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 200000,
            'current_balance' => 200000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $mainPocket = app(FinanceWalletService::class)->ensureMainPocket($account);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Makanan',
            'slug' => 'makanan',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $currencyId = TenantCurrency::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('code', 'IDR')
            ->value('id');

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'created_by' => $this->ownerMembership->id,
            'bank_account_id' => $account->id,
            'wallet_id' => $mainPocket->id,
            'budget_id' => null,
            'category_id' => $category->id,
            'type' => 'pengeluaran',
            'transaction_date' => '2026-04-05',
            'currency_id' => $currencyId,
            'currency_code' => 'IDR',
            'exchange_rate' => 1,
            'amount' => 75000,
            'amount_base' => 75000,
            'description' => 'Belanja bulanan',
            'payment_method' => 'tunai',
            'notes' => null,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/bootstrap?section=transactions&month=2026-04&transaction_kind=all&page=1&per_page=10");

        $response->assertOk();
        $response->assertJsonPath('data.section', 'transactions');
        $response->assertJsonPath('data.period_month', '2026-04');
        $response->assertJsonPath('data.preloaded.transactions', true);
        $response->assertJsonPath('data.preloaded.summary', true);
        $response->assertJsonPath('data.preloaded.wallets', true);
        $response->assertJsonPath('data.transactions_meta.current_page', 1);
        $response->assertJsonPath('data.finance_summary.transaction_count', 1);
        $response->assertJsonCount(1, 'data.wallets');
        $response->assertJsonCount(1, 'data.transactions');
        $response->assertJsonMissingPath('data.pockets');
    }

    public function test_wallet_routes_use_wallet_payload_shape_and_wallet_id_filter(): void
    {
        $accountA = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Kas A',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 200000,
            'current_balance' => 200000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $walletA = app(FinanceWalletService::class)->ensureMainPocket($accountA);

        $accountB = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Kas B',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 150000,
            'current_balance' => 150000,
            'is_active' => true,
            'row_version' => 1,
        ]);
        $walletB = app(FinanceWalletService::class)->ensureMainPocket($accountB);

        $category = TenantCategory::create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'name' => 'Operasional',
            'slug' => 'operasional',
            'sub_type' => 'pengeluaran',
            'is_active' => true,
        ]);

        $currencyId = TenantCurrency::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('code', 'IDR')
            ->value('id');

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'created_by' => $this->ownerMembership->id,
            'bank_account_id' => $accountA->id,
            'wallet_id' => $walletA->id,
            'category_id' => $category->id,
            'type' => 'pengeluaran',
            'transaction_date' => '2026-04-10',
            'currency_id' => $currencyId,
            'currency_code' => 'IDR',
            'exchange_rate' => 1,
            'amount' => 30000,
            'amount_base' => 30000,
            'description' => 'Belanja A',
            'payment_method' => 'tunai',
            'row_version' => 1,
        ]);

        FinanceTransaction::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'created_by' => $this->ownerMembership->id,
            'bank_account_id' => $accountB->id,
            'wallet_id' => $walletB->id,
            'category_id' => $category->id,
            'type' => 'pengeluaran',
            'transaction_date' => '2026-04-11',
            'currency_id' => $currencyId,
            'currency_code' => 'IDR',
            'exchange_rate' => 1,
            'amount' => 40000,
            'amount_base' => 40000,
            'description' => 'Belanja B',
            'payment_method' => 'tunai',
            'row_version' => 1,
        ]);

        $walletsResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/wallets");

        $walletsResponse->assertOk();
        $walletsResponse->assertJsonPath('ok', true);
        $walletsResponse->assertJsonMissingPath('data.pockets');
        $walletsResponse->assertJsonCount(2, 'data.wallets');

        $summaryResponse = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/bootstrap?section=transactions&month=2026-04&wallet_id={$walletA->id}&transaction_kind=all&page=1&per_page=10");

        $summaryResponse->assertOk();
        $summaryResponse->assertJsonPath('data.finance_summary.transaction_count', 1);
        $summaryResponse->assertJsonCount(1, 'data.transactions');
    }

    public function test_bootstrap_cache_version_bumps_after_account_mutation(): void
    {
        $bootstrapBefore = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/bootstrap?section=accounts");

        $bootstrapBefore->assertOk();
        $initialVersion = (int) $bootstrapBefore->json('data.cache_version');
        $this->assertGreaterThanOrEqual(1, $initialVersion);

        $createAccount = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/accounts", [
                'name' => 'Bank Operasional',
                'scope' => 'private',
                'type' => 'bank',
                'currency_code' => 'IDR',
                'owner_member_id' => $this->ownerMembership->id,
                'opening_balance' => 100000,
                'notes' => 'Akun test bootstrap',
            ]);

        $createAccount->assertCreated();

        $bootstrapAfter = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/bootstrap?section=accounts");

        $bootstrapAfter->assertOk();
        $nextVersion = (int) $bootstrapAfter->json('data.cache_version');
        $this->assertGreaterThan($initialVersion, $nextVersion);
    }
}
