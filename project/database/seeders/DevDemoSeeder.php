<?php

namespace Database\Seeders;

use Database\Seeders\Tenant\Finance\Demo\TenantFinanceBudgetSeeder;
use Database\Seeders\Tenant\Finance\Demo\TenantFinanceDemoSeeder;
use Database\Seeders\Tenant\Finance\Demo\TenantFinancePlanningSeeder;
use Database\Seeders\Tenant\Finance\Demo\TenantFinanceWalletSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Config;
use Spatie\Permission\PermissionRegistrar;

/**
 * Demo/sample data seeder. Runs ON TOP of the baseline created by DatabaseSeeder.
 *
 * Usage:
 *   php artisan migrate:fresh --seed              → baseline only (no demo data)
 *   php artisan migrate:fresh --seed --class=DevDemoSeeder  → baseline + demo data
 *   php artisan db:seed --class=DevDemoSeeder     → add demo data to existing baseline
 */
class DevDemoSeeder extends Seeder
{
    public function run(): void
    {
        Config::set('queue.default', 'sync');

        $this->call([
            // 1. Demo wallets/pockets (creates sample non-system wallets on top of baseline accounts)
            TenantFinanceWalletSeeder::class,

            // 2. Demo budgets, planning, and transactions (layer demo data on baseline + demo wallets)
            TenantFinanceBudgetSeeder::class,
            TenantFinancePlanningSeeder::class,
            TenantFinanceDemoSeeder::class,

            // 3. Other domain demos
            \Database\Seeders\Tenant\Game\Demo\CurriculumPilotSeeder::class,
            \Database\Seeders\Tenant\Game\Demo\VocabularyDemoSeeder::class,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
