<?php

namespace Database\Factories\Finance;

use App\Models\Finance\FinanceWallet;
use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Finance\FinanceTransaction>
 */
class FinanceTransactionFactory extends Factory
{
    protected $model = FinanceTransaction::class;

    public function configure(): static
    {
        return $this->afterMaking(function (FinanceTransaction $transaction): void {
            if (! $transaction->tenant_id) {
                return;
            }

            if (! $transaction->owner_member_id && $transaction->created_by) {
                $transaction->owner_member_id = $transaction->created_by;
            }

            if (! $transaction->currency_id) {
                $currency = TenantCurrency::query()
                    ->where('tenant_id', $transaction->tenant_id)
                    ->where('code', 'IDR')
                    ->first()
                    ?? TenantCurrency::query()->where('tenant_id', $transaction->tenant_id)->first();
                $transaction->currency_id = $currency?->id;
            }

            if (! $transaction->bank_account_id) {
                $account = TenantBankAccount::query()
                    ->where('tenant_id', $transaction->tenant_id)
                    ->when(
                        $transaction->owner_member_id,
                        fn ($query) => $query->where('owner_member_id', $transaction->owner_member_id)
                    )
                    ->first()
                    ?? TenantBankAccount::query()->where('tenant_id', $transaction->tenant_id)->first();

                if (! $account && $transaction->owner_member_id) {
                    $ownerMember = TenantMember::query()->whereKey($transaction->owner_member_id)->first();
                    $account = TenantBankAccount::query()->create([
                        'tenant_id' => $transaction->tenant_id,
                        'owner_member_id' => $transaction->owner_member_id,
                        'name' => 'Factory Wallet',
                        'scope' => 'private',
                        'type' => 'cash',
                        'currency_code' => 'IDR',
                        'opening_balance' => 0,
                        'current_balance' => 0,
                        'is_active' => true,
                        'row_version' => 1,
                    ]);

                    if ($ownerMember) {
                        $account->memberAccess()->syncWithoutDetaching([
                            $ownerMember->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
                        ]);
                    }
                }

                $transaction->bank_account_id = $account?->id;
            }

            if (! $transaction->wallet_id && $transaction->bank_account_id) {
                $account = TenantBankAccount::query()->whereKey($transaction->bank_account_id)->first();
                if ($account) {
                    $transaction->wallet_id = app(FinanceWalletService::class)->ensureMainWallet($account)->id;
                }
            }

            if (! $transaction->bank_account_id && $transaction->wallet_id) {
                $wallet = FinanceWallet::query()->whereKey($transaction->wallet_id)->first();
                $transaction->bank_account_id = $wallet?->real_account_id;
            }
        });
    }

    public function definition(): array
    {
        return [
            'type'             => $this->faker->randomElement(['pemasukan', 'pengeluaran']),
            'transaction_date' => now(),
            'amount'           => $this->faker->randomFloat(2, 1000, 100000),
            'currency_id'      => null,
            'exchange_rate'    => 1.0,
            'base_currency_code' => 'IDR',
            'description'      => $this->faker->sentence(),
            'payment_method'   => $this->faker->randomElement(['tunai', 'transfer', 'kartu_kredit']),
            'row_version'      => 1,
            'status'           => 'terverifikasi',
            'budget_status'    => 'unbudgeted',
            'budget_delta'     => 0,
            'is_internal_transfer' => false,
        ];
    }
}
