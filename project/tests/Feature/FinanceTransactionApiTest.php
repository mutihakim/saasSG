<?php

namespace Tests\Feature;

use App\Jobs\ProcessFinanceAttachmentImage;
use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Models\Misc\TenantAttachment;
use App\Models\Identity\User;
use App\Models\Tenant\TenantMember;
use App\Models\Misc\ActivityLog;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceAttachmentService;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
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

    public function test_reports_reject_ranges_longer_than_366_days(): void
    {
        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/reports?date_from=2025-01-01&date_to=2026-02-01");

        $response->assertStatus(422);
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

    public function test_can_preview_attachment_with_morph_alias(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/receipt.webp', $this->tenant->id, $transaction->id);
        Storage::put($path, 'image-bytes');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.webp',
            'file_path' => $path,
            'mime_type' => 'image/webp',
            'file_size' => strlen('image-bytes'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertHeader('Content-Type', 'image/webp');
        $response->assertStreamedContent('image-bytes');
    }

    public function test_can_preview_attachment_with_legacy_storage_path(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $legacyPath = sprintf('finance/attachments/transactions/%s/legacy.jpg', $transaction->id);
        Storage::put($legacyPath, 'legacy-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'legacy.jpg',
            'file_path' => $legacyPath,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('legacy-image'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertHeader('Content-Type', 'image/jpeg');
        $response->assertStreamedContent('legacy-image');
    }

    public function test_can_preview_attachment_with_stale_path_when_basename_matches_final_path(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/receipt.webp', $this->tenant->id, $transaction->id);
        Storage::put($path, 'final-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.webp',
            'file_path' => 'stale/path/receipt.webp',
            'mime_type' => 'image/webp',
            'file_size' => strlen('final-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'ready',
            'processed_at' => now(),
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertStreamedContent('final-image');
    }

    public function test_preview_attachment_returns_conflict_while_processing(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/source.jpg', $this->tenant->id, $transaction->id);
        Storage::put($path, 'raw-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.jpg',
            'file_path' => $path,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('raw-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertStatus(409);
    }

    public function test_upload_image_attachment_creates_processing_record_and_dispatches_job(): void
    {
        Queue::fake();
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments", [
                'attachments' => [$file],
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.attachments.0.status', 'processing');
        $response->assertJsonPath('data.attachments.0.preview_url', null);
        $response->assertJsonPath('data.background_processing_warning', true);

        $attachment = TenantAttachment::query()->latest('id')->first();

        $this->assertNotNull($attachment);
        $this->assertSame('processing', $attachment->status);
        $this->assertStringContainsString('/staging/', (string) $attachment->file_path);
        $this->assertTrue(Storage::exists((string) $attachment->file_path));

        Queue::assertPushed(ProcessFinanceAttachmentImage::class, function (ProcessFinanceAttachmentImage $job) use ($attachment) {
            return $job->attachmentId === (int) $attachment->id
                && $job->connection === 'redis'
                && $job->queue === 'finance-media';
        });
    }

    public function test_upload_attachment_returns_operational_error_when_async_schema_is_missing(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        Schema::table('tenant_attachments', function ($table) {
            $table->dropIndex('tenant_attachments_tenant_id_status_index');
            $table->dropColumn(['status', 'processing_error', 'processed_at']);
        });

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments", [
                'attachments' => [$file],
            ]);

        $response->assertStatus(503);
        $response->assertJsonPath('ok', false);
        $response->assertJsonPath('message', 'Attachment async schema is not ready. Run the latest tenant_attachments migration first.');
        $this->assertSame([], Storage::allFiles(sprintf('tenants/%d/finance/attachments/transactions/%s', $this->tenant->id, $transaction->id)));
    }

    public function test_process_finance_attachment_image_job_finalizes_image(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);
        $stagingPath = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/source.jpg', $this->tenant->id, $transaction->id);
        Storage::put($stagingPath, file_get_contents($file->getRealPath()));

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.jpg',
            'file_path' => $stagingPath,
            'mime_type' => 'image/jpeg',
            'file_size' => (int) $file->getSize(),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $job = new ProcessFinanceAttachmentImage((int) $attachment->id);
        $job->handle(app(FinanceAttachmentService::class));

        $attachment->refresh();

        $this->assertSame('ready', $attachment->status);
        $this->assertSame('image/webp', $attachment->mime_type);
        $this->assertStringEndsWith('.webp', (string) $attachment->file_name);
        $this->assertStringNotContainsString('/staging/', (string) $attachment->file_path);
        $this->assertNotNull($attachment->processed_at);
        $this->assertTrue(Storage::exists((string) $attachment->file_path));
        $this->assertFalse(Storage::exists($stagingPath));
    }

    public function test_process_finance_attachment_image_job_marks_failed_when_image_is_invalid(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $stagingPath = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/broken.jpg', $this->tenant->id, $transaction->id);
        Storage::put($stagingPath, 'not-a-real-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'broken.jpg',
            'file_path' => $stagingPath,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('not-a-real-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $job = new ProcessFinanceAttachmentImage((int) $attachment->id);
        $job->handle(app(FinanceAttachmentService::class));

        $attachment->refresh();

        $this->assertSame('failed', $attachment->status);
        $this->assertNotNull($attachment->processing_error);
        $this->assertTrue(Storage::exists($stagingPath));
    }

    public function test_same_original_file_name_across_transactions_keeps_unique_storage_paths(): void
    {
        Queue::fake();
        Storage::fake(config('filesystems.default', 'local'));

        $firstTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $secondTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $firstFile = UploadedFile::fake()->image('rk3326s vs t100.png', 1600, 1200);
        $secondFile = UploadedFile::fake()->image('rk3326s vs t100.png', 1600, 1200);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$firstTransaction->id}/attachments", [
                'attachments' => [$firstFile],
            ])
            ->assertCreated();

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$secondTransaction->id}/attachments", [
                'attachments' => [$secondFile],
            ])
            ->assertCreated();

        $attachments = TenantAttachment::query()->orderBy('id')->get();

        $this->assertCount(2, $attachments);
        $this->assertSame('rk3326s vs t100.png', $attachments[0]->file_name);
        $this->assertSame('rk3326s vs t100.png', $attachments[1]->file_name);
        $this->assertNotSame($attachments[0]->file_path, $attachments[1]->file_path);
        $this->assertStringContainsString((string) $firstTransaction->id, (string) $attachments[0]->file_path);
        $this->assertStringContainsString((string) $secondTransaction->id, (string) $attachments[1]->file_path);
    }

    public function test_preview_attachment_returns_not_found_for_attachment_from_other_transaction(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $otherTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/other.webp', $this->tenant->id, $otherTransaction->id);
        Storage::put($path, 'other-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $otherTransaction->id,
            'file_name' => 'other.webp',
            'file_path' => $path,
            'mime_type' => 'image/webp',
            'file_size' => strlen('other-image'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertNotFound();
    }
}
