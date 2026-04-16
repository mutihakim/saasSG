<?php

namespace Database\Seeders\Tenant\Finance\Demo;

use App\Models\Finance\FinanceTransaction;
use App\Models\Finance\FinanceWallet;
use App\Models\Finance\TenantBudget;
use App\Models\Finance\TenantBudgetLine;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCurrency;
use App\Models\Master\TenantTag;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\Wallet\FinanceWalletService;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class TenantFinanceDemoSeeder extends Seeder
{
    public function __construct(
        private readonly FinanceWalletService $walletPockets,
    ) {
    }

    public function run(): void
    {
        $ledger = app(FinanceLedgerService::class);

        Tenant::query()->orderBy('id')->each(function (Tenant $tenant) use ($ledger): void {
            $currency = TenantCurrency::query()->where('tenant_id', $tenant->id)->where('code', 'IDR')->first();
            if (! $currency) {
                return;
            }

            FinanceTransaction::withTrashed()->where('tenant_id', $tenant->id)->forceDelete();
            TenantBudgetLine::query()->where('tenant_id', $tenant->id)->delete();
            TenantBankAccount::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->each(function (TenantBankAccount $account): void {
                    $account->forceFill(['current_balance' => $account->opening_balance])->save();
                });
            TenantBudget::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->each(function (TenantBudget $budget): void {
                    $budget->forceFill([
                        'spent_amount' => 0,
                        'remaining_amount' => $budget->allocated_amount,
                    ])->save();
                });
            FinanceWallet::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->each(function (FinanceWallet $pocket): void {
                    $pocket->forceFill([
                        'current_balance' => $pocket->is_system
                            ? (float) ($pocket->realAccount?->opening_balance ?? 0)
                            : 0,
                    ])->save();
                });

            $members = TenantMember::query()->where('tenant_id', $tenant->id)->get()->keyBy(fn (TenantMember $member) => strtolower($member->full_name));
            $accounts = TenantBankAccount::query()->where('tenant_id', $tenant->id)->get()->keyBy('name');
            $pockets = FinanceWallet::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->keyBy(fn (FinanceWallet $pocket) => $this->pocketKey($pocket->realAccount?->name, $pocket->name, $pocket->is_system));
            $budgets = TenantBudget::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->keyBy(fn (TenantBudget $budget) => $budget->period_month . '|' . $budget->budget_key);
            $categories = TenantCategory::query()->where('tenant_id', $tenant->id)->where('module', 'finance')->get()->keyBy('name');
            $tags = TenantTag::query()->where('tenant_id', $tenant->id)->get()->keyBy('name');
            $transferGroups = [];

            foreach (FamilyFinanceSeed::demoTransactions($tenant->slug) as $seed) {
                $member = $members->get($seed['member']);
                $account = $accounts->get($seed['account']);
                $pocket = $pockets->get($this->pocketKey($seed['account'], $seed['pocket'], false))
                    ?? $pockets->get($this->pocketKey($seed['account'], $seed['pocket'], true));
                $category = $categories->get($seed['category']);

                if (! $member || ! $account || ! $pocket || ! $category) {
                    continue;
                }

                $budget = $seed['budget']
                    ? $budgets->get(substr($seed['transaction_date'], 0, 7) . '|' . $this->budgetKey($seed['budget']))
                    : null;

                $transaction = FinanceTransaction::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'reference_number' => $seed['reference'],
                    ],
                    [
                        'category_id' => $category->id,
                        'currency_id' => $currency->id,
                        'created_by' => $member->id,
                        'owner_member_id' => $member->id,
                        'updated_by' => $member->id,
                        'type' => $seed['type'],
                        'transaction_date' => $seed['transaction_date'] ?? now()->subDays($seed['days_ago'])->toDateString(),
                        'amount' => $seed['amount'],
                        'description' => $seed['description'],
                        'exchange_rate' => 1,
                        'base_currency_code' => 'IDR',
                        'amount_base' => $seed['amount'],
                        'notes' => null,
                        'payment_method' => $seed['payment_method'],
                        'merchant_name' => null,
                        'location' => null,
                        'source_type' => $seed['source_type'] ?? null,
                        'source_id' => $seed['source_id'] ?? null,
                        'budget_id' => $budget?->id,
                        'budget_status' => $budget ? 'within_budget' : 'unbudgeted',
                        'budget_delta' => 0,
                        'bank_account_id' => $account->id,
                        'wallet_id' => $pocket->id,
                        'status' => 'terverifikasi',
                        'row_version' => 1,
                        'is_internal_transfer' => $seed['type']->value === 'transfer',
                        'transfer_direction' => $seed['transfer_direction'] ?? null,
                    ]
                );

                $transaction->tags()->sync(
                    collect($seed['tags'])
                        ->map(fn (string $name) => $tags->get($name)?->id)
                        ->filter()
                        ->values()
                        ->all()
                );

                $ledger->syncAfterCreate($transaction);

                if (filled($seed['transfer_group'] ?? null)) {
                    $transferGroups[$seed['transfer_group']] ??= collect();
                    $transferGroups[$seed['transfer_group']]->push($transaction);
                }
            }

            foreach ($transferGroups as $group) {
                $this->syncTransferPair($group);
            }

            $this->assertSeedBalances($tenant);
        });
    }

    private function pocketKey(?string $accountName, string $pocketName, bool $isSystem): string
    {
        return implode('|', [
            $accountName ?: 'unknown',
            $pocketName,
            $isSystem ? 'system' : 'custom',
        ]);
    }

    private function syncTransferPair(Collection $group): void
    {
        if ($group->count() !== 2) {
            return;
        }

        /** @var FinanceTransaction $first */
        $first = $group->first();
        /** @var FinanceTransaction $last */
        $last = $group->last();

        $first->forceFill(['transfer_pair_id' => $last->id])->save();
        $last->forceFill(['transfer_pair_id' => $first->id])->save();
    }

    private function assertSeedBalances(Tenant $tenant): void
    {
        TenantBankAccount::query()
            ->where('tenant_id', $tenant->id)
            ->with('pockets')
            ->get()
            ->each(function (TenantBankAccount $account) use ($tenant): void {
                $totalPocketBalance = round((float) $account->pockets->sum(fn (FinanceWallet $pocket) => (float) $pocket->current_balance), 2);
                $accountBalance = round((float) $account->current_balance, 2);

                if (abs($accountBalance - $totalPocketBalance) > 0.000001) {
                    throw new \RuntimeException("Seed invariant failed for tenant {$tenant->slug} account {$account->name}: account balance does not match total wallet balance.");
                }

                if (in_array($account->type, ['credit_card', 'paylater'], true)) {
                    return;
                }

                if ($accountBalance < 0) {
                    throw new \RuntimeException("Seed invariant failed for tenant {$tenant->slug} account {$account->name}: non-liability account has negative balance.");
                }

                foreach ($account->pockets as $pocket) {
                    if ((float) $pocket->current_balance < 0) {
                        throw new \RuntimeException("Seed invariant failed for tenant {$tenant->slug} wallet {$pocket->name}: non-liability wallet has negative balance.");
                    }
                }
            });
    }

    private function budgetKey(string $name): string
    {
        $key = \Illuminate\Support\Str::slug($name, '_');

        return $key !== '' ? $key : 'budget';
    }
}
