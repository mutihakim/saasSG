<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantMasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TenantCurrencySeeder::class,
            TenantUomSeeder::class,
            TenantCategorySeeder::class,
            TenantTagSeeder::class,
            TenantBankAccountSeeder::class,
            TenantBudgetSeeder::class,
            FinanceTransactionSeeder::class,
        ]);
    }
}
