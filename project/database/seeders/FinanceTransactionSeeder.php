<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class FinanceTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $faker = \Faker\Factory::create();

        foreach ($tenants as $tenant) {
            $currency = TenantCurrency::where('tenant_id', $tenant->id)->where('code', 'IDR')->first();
            $member = TenantMember::where('tenant_id', $tenant->id)->where('profile_status', 'active')->first();

            if (!$currency || !$member) {
                continue;
            }

            $categories = TenantCategory::where('tenant_id', $tenant->id)
                ->where('module', 'finance')
                ->get();

            if ($categories->isEmpty()) {
                continue;
            }

            // Create 12 transactions (last 30 days)
            for ($i = 0; $i < 12; $i++) {
                $category = $categories->random();
                $type = $category->sub_type === 'pemasukan' ? TransactionType::PEMASUKAN : TransactionType::PENGELUARAN;
                
                $amount = $type === TransactionType::PEMASUKAN 
                    ? $faker->randomFloat(2, 500000, 5000000) 
                    : $faker->randomFloat(2, 10000, 500000);

                FinanceTransaction::create([
                    'tenant_id'         => $tenant->id,
                    'category_id'       => $category->id,
                    'currency_id'       => $currency->id,
                    'created_by'        => $member->id,
                    'type'              => $type,
                    'transaction_date'  => Carbon::now()->subDays(rand(0, 30)),
                    'amount'            => $amount,
                    'description'       => $this->getRandomDescription($type, $category->name),
                    'exchange_rate'     => 1.0,
                    'base_currency_code'=> 'IDR',
                    'amount_base'       => $amount,
                    'payment_method'    => $faker->randomElement(PaymentMethod::cases()),
                    'status'            => 'terverifikasi',
                    'merchant_name'     => $type === TransactionType::PENGELUARAN ? $faker->company() : null,
                ]);
            }
        }
    }

    private function getRandomDescription(TransactionType $type, string $categoryName): string
    {
        if ($type === TransactionType::PEMASUKAN) {
            return "Penerimaan " . $categoryName . " bulan ini";
        }
        
        $items = ['Pembayaran', 'Beli', 'Biaya', 'Pengeluaran'];
        return $items[array_rand($items)] . " " . $categoryName;
    }
}
