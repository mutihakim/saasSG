<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Finance\TenantBudget;
use App\Services\Finance\MonthlyReviewService;
use App\Models\Identity\User;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceBudgetTest extends TestCase
{
    private Tenant $tenant;
    private User $owner;
    private TenantMember $ownerMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug' => 'budget-test',
            'owner_user_id' => $this->owner->id,
            'plan_code' => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Budget Owner',
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

    public function test_monthly_review_submission_writes_activity_log(): void
    {
        $account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Audit Account',
            'scope' => 'private',
            'type' => 'bank',
            'currency_code' => 'IDR',
            'opening_balance' => 500000,
            'current_balance' => 500000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $mainPocket = app(\App\Services\Finance\Wallet\FinanceWalletService::class)->ensureMainPocket($account);
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
            'wallet_id' => $mainPocket->id,
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
    }
}
