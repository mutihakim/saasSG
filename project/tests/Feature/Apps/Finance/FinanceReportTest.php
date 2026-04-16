<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Models\Identity\User;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantBankAccount;
use App\Services\Finance\Wallet\FinanceWalletService;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceReportTest extends TestCase
{
    protected $tenant;
    protected $owner;
    protected $ownerMembership;
    protected $account;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug'          => 'report-test',
            'owner_user_id' => $this->owner->id,
            'plan_code'     => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'full_name'      => 'Owner Name',
            'role_code'      => 'owner',
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

        foreach (['finance.view', 'finance.create', 'finance.update', 'finance.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'finance.update', 'finance.delete']);
    }

    public function test_reports_reject_ranges_longer_than_366_days(): void
    {
        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/reports?date_from=2025-01-01&date_to=2026-02-01");

        $response->assertStatus(422);
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
