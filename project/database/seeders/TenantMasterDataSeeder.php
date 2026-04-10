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
            TenantFinanceCategorySeeder::class,
            TenantFinanceTagSeeder::class,
            TenantFinanceAccountSeeder::class,
            TenantFinanceWalletSeeder::class,
            TenantFinanceBudgetSeeder::class,
            TenantFinancePlanningSeeder::class,
            TenantFinanceDemoSeeder::class,
        ]);
    }
}
