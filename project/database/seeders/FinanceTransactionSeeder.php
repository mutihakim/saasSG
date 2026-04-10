<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Models\FinanceTransaction;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantBudgetLine;
use App\Models\TenantTag;
use App\Models\Tenant;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Services\Finance\FinanceLedgerService;
use Illuminate\Database\Seeder;

class FinanceTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $ledger = app(FinanceLedgerService::class);
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $currency = TenantCurrency::where('tenant_id', $tenant->id)->where('code', 'IDR')->first();
            $members = TenantMember::where('tenant_id', $tenant->id)->where('profile_status', 'active')->orderBy('id')->get();
            $member = $members->first();
            $sharedBank = TenantBankAccount::where('tenant_id', $tenant->id)->where('scope', 'shared')->where('type', 'bank')->first();
            $sharedWallet = TenantBankAccount::where('tenant_id', $tenant->id)->where('scope', 'shared')->where('type', 'ewallet')->first();
            $sharedPayLater = TenantBankAccount::where('tenant_id', $tenant->id)->where('scope', 'shared')->where('type', 'paylater')->first();
            $householdBudget = TenantBudget::where('tenant_id', $tenant->id)->where('name', 'Belanja Rumah')->first();
            $billingBudget = TenantBudget::where('tenant_id', $tenant->id)->where('name', 'Tagihan Bulanan')->first();

            if (!$currency || !$member || !$sharedBank || !$sharedWallet || !$sharedPayLater) {
                continue;
            }

            $categories = TenantCategory::where('tenant_id', $tenant->id)
                ->where('module', 'finance')
                ->get();

            if ($categories->isEmpty()) {
                continue;
            }

            TenantBudgetLine::query()->where('tenant_id', $tenant->id)->delete();
            TenantBankAccount::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->each(function (TenantBankAccount $account) {
                    $account->forceFill(['current_balance' => $account->opening_balance])->save();
                });
            TenantBudget::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->each(function (TenantBudget $budget) {
                    $budget->forceFill([
                        'spent_amount' => 0,
                        'remaining_amount' => $budget->allocated_amount,
                    ])->save();
                });

            $transactions = [
                [
                    'category_name' => 'Gaji Bulanan',
                    'type' => TransactionType::PEMASUKAN,
                    'amount' => 7500000,
                    'description' => 'Gaji bulanan keluarga',
                    'reference_number' => 'SEED-FIN-001',
                    'payment_method' => PaymentMethod::TRANSFER,
                    'merchant_name' => null,
                    'location' => null,
                    'notes' => 'Pemasukan rutin bulanan',
                    'tags' => ['Monthly'],
                    'days_ago' => 25,
                    'account_id' => $sharedBank->id,
                    'owner_member_id' => $member->id,
                    'budget_id' => null,
                ],
                [
                    'category_name' => 'Makan & Minum',
                    'type' => TransactionType::PENGELUARAN,
                    'amount' => 185000,
                    'description' => 'Belanja kebutuhan dapur mingguan',
                    'reference_number' => 'SEED-FIN-002',
                    'payment_method' => PaymentMethod::DOMPET_DIGITAL,
                    'merchant_name' => 'Pasar Segar',
                    'location' => 'BSD City',
                    'notes' => 'Buah, sayur, dan lauk',
                    'tags' => ['Monthly', 'Fresh'],
                    'days_ago' => 17,
                    'account_id' => $sharedWallet->id,
                    'owner_member_id' => $member->id,
                    'budget_id' => $householdBudget?->id,
                ],
                [
                    'category_name' => 'Tagihan & Utilitas',
                    'type' => TransactionType::PENGELUARAN,
                    'amount' => 425000,
                    'description' => 'Pembayaran listrik dan internet',
                    'reference_number' => 'SEED-FIN-003',
                    'payment_method' => PaymentMethod::TRANSFER,
                    'merchant_name' => 'PLN dan ISP',
                    'location' => 'Online',
                    'notes' => 'Tagihan bulanan rumah',
                    'tags' => ['Monthly'],
                    'days_ago' => 12,
                    'account_id' => $sharedBank->id,
                    'owner_member_id' => $members->skip(1)->first()?->id ?? $member->id,
                    'budget_id' => $billingBudget?->id,
                ],
                [
                    'category_name' => 'Investasi & Bunga',
                    'type' => TransactionType::PEMASUKAN,
                    'amount' => 320000,
                    'description' => 'Bunga deposito',
                    'reference_number' => 'SEED-FIN-004',
                    'payment_method' => PaymentMethod::TRANSFER,
                    'merchant_name' => 'Bank Keluarga',
                    'location' => 'Online',
                    'notes' => 'Bunga bulanan',
                    'tags' => ['Investment'],
                    'days_ago' => 8,
                    'account_id' => $sharedBank->id,
                    'owner_member_id' => $member->id,
                    'budget_id' => null,
                ],
                [
                    'category_name' => 'Transfer Internal',
                    'type' => TransactionType::TRANSFER,
                    'amount' => 500000,
                    'description' => 'Pindah saldo antar dompet keluarga',
                    'reference_number' => 'SEED-FIN-005',
                    'payment_method' => PaymentMethod::TRANSFER,
                    'merchant_name' => null,
                    'location' => 'Internal',
                    'notes' => 'Seed transfer foundation',
                    'tags' => ['Monthly'],
                    'days_ago' => 3,
                    'account_id' => $sharedPayLater->id,
                    'owner_member_id' => $members->skip(2)->first()?->id ?? $member->id,
                    'budget_id' => null,
                    'transfer_direction' => 'out',
                ],
            ];

            foreach ($transactions as $seed) {
                $category = $categories
                    ->firstWhere('name', $seed['category_name'])
                    ?? $categories->firstWhere('sub_type', $seed['type']->value);

                if (! $category) {
                    continue;
                }

                $transaction = FinanceTransaction::updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'reference_number' => $seed['reference_number'],
                    ],
                    [
                        'category_id' => $category->id,
                        'currency_id' => $currency->id,
                        'created_by' => $member->id,
                        'owner_member_id' => $seed['owner_member_id'],
                        'updated_by' => $member->id,
                        'type' => $seed['type'],
                        'transaction_date' => now()->subDays($seed['days_ago'])->toDateString(),
                        'amount' => $seed['amount'],
                        'description' => $seed['description'],
                        'exchange_rate' => 1.0,
                        'base_currency_code' => 'IDR',
                        'amount_base' => $seed['amount'],
                        'notes' => $seed['notes'],
                        'payment_method' => $seed['payment_method'],
                        'merchant_name' => $seed['merchant_name'],
                        'location' => $seed['location'],
                        'budget_id' => $seed['budget_id'],
                        'budget_status' => $seed['budget_id'] ? 'within_budget' : 'unbudgeted',
                        'budget_delta' => 0,
                        'bank_account_id' => $seed['account_id'],
                        'status' => 'terverifikasi',
                        'row_version' => 1,
                        'is_internal_transfer' => $seed['type'] === TransactionType::TRANSFER,
                        'transfer_direction' => $seed['transfer_direction'] ?? null,
                    ]
                );

                $tagIds = TenantTag::query()
                    ->where('tenant_id', $tenant->id)
                    ->whereIn('name', $seed['tags'])
                    ->pluck('id')
                    ->all();

                if (! empty($tagIds)) {
                    $transaction->tags()->sync($tagIds);
                }

                $ledger->syncAfterCreate($transaction);
            }
        }
    }
}
