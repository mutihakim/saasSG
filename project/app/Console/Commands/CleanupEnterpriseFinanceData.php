<?php

namespace App\Console\Commands;

use App\Models\Finance\FinanceMonthReview;
use App\Models\Finance\FinanceWallet;
use App\Models\Finance\FinanceSavingsGoal;
use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Services\Finance\FinanceSummaryService;
use App\Services\Finance\Transactions\FinanceTransactionCleanupService;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CleanupEnterpriseFinanceData extends Command
{
    protected $signature = 'finance:cleanup-enterprise {--tenant=enterprise} {--dry-run}';

    protected $description = 'Delete all finance transactions for the target tenant and reset all balances, opening balances, budgets, and goals to zero.';

    public function __construct(
        private readonly FinanceTransactionCleanupService $cleanup,
        private readonly FinanceWalletService $wallets,
        private readonly FinanceSummaryService $summary,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $tenant = Tenant::query()->where('slug', (string) $this->option('tenant'))->first();

        if (! $tenant) {
            $this->error('Tenant not found.');

            return self::FAILURE;
        }

        $transactionCount = FinanceTransaction::query()->forTenant($tenant->id)->count();
        $goalCount = FinanceSavingsGoal::query()->forTenant($tenant->id)->count();
        $budgetCount = TenantBudget::query()->forTenant($tenant->id)->count();
        $reviewCount = FinanceMonthReview::query()->forTenant($tenant->id)->count();

        $this->info("Tenant {$tenant->slug}");
        $this->line("Transactions: {$transactionCount}");
        $this->line("Goals: {$goalCount}");
        $this->line("Budgets: {$budgetCount}");
        $this->line("Month reviews: {$reviewCount}");

        if ($this->option('dry-run')) {
            return self::SUCCESS;
        }

        $request = Request::create('/internal/finance-cleanup', 'DELETE');

        $this->info('Deleting transactions and cleaning artifacts...');
        FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->with([
                'attachments',
                'tags',
                'recurringRule',
                'category:id,name,icon,color',
                'currency:id,code,symbol,decimal_places',
                'createdBy:id,full_name',
                'ownerMember:id,full_name',
                'updatedBy:id,full_name',
                'approvedBy:id,full_name',
                'bankAccount:id,name,type,currency_code',
                'pocket:id,name,type,reference_code,real_account_id,currency_code,icon_key,default_budget_id,default_budget_key,budget_lock_enabled',
                'budget:id,name,period_month,allocated_amount,spent_amount,remaining_amount,wallet_id,budget_key',
                'pairedTransfer:id,tenant_id,type,transaction_date,amount,description,bank_account_id,wallet_id,transfer_direction,transfer_pair_id',
                'pairedTransfer.bankAccount:id,name,type,currency_code',
                'pairedTransfer.pocket:id,name,type,reference_code,real_account_id,currency_code,icon_key,default_budget_id,default_budget_key,budget_lock_enabled',
            ])
            ->chunkById(100, function ($transactions) use ($tenant, $request) {
                $this->cleanup->deleteTransactions($tenant, $transactions, null, $request, false);
            }, 'id', 'id');

        $this->info('Resetting balances, goals, and budgets to zero...');
        DB::transaction(function () use ($tenant) {
            FinanceMonthReview::query()->forTenant($tenant->id)->delete();

            FinanceSavingsGoal::query()
                ->forTenant($tenant->id)
                ->update([
                    'current_amount' => 0,
                    'row_version' => DB::raw('row_version + 1'),
                ]);

            TenantBudget::query()
                ->forTenant($tenant->id)
                ->update([
                    'spent_amount' => 0,
                    'remaining_amount' => DB::raw('allocated_amount'),
                    'row_version' => DB::raw('row_version + 1'),
                ]);

            TenantBankAccount::query()
                ->forTenant($tenant->id)
                ->orderBy('id')
                ->get()
                ->each(function (TenantBankAccount $account) {
                    FinanceWallet::query()
                        ->where('tenant_id', $account->tenant_id)
                        ->where('real_account_id', $account->id)
                        ->update([
                            'current_balance' => 0,
                            'row_version' => DB::raw('row_version + 1'),
                        ]);

                    $account->forceFill([
                        'opening_balance' => 0,
                        'current_balance' => 0,
                        'row_version' => ((int) $account->row_version) + 1,
                    ])->save();
                });
        });

        $this->info('Invalidating caches...');
        $this->summary->invalidateTenantCaches($tenant->id);

        $this->info('Finance data for Enterprise tenant fully reset to zero.');

        return self::SUCCESS;
    }
}
