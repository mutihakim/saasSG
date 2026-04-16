<?php

namespace Database\Seeders\Tenant\Master;

use App\Models\Tenant\Tenant;
use App\Services\Tenant\MasterData\TenantCurrencyService;
use Illuminate\Database\Seeder;

class TenantCurrencySeeder extends Seeder
{
    public function run(): void
    {
        $service = app(TenantCurrencyService::class);

        Tenant::query()->orderBy('id')->each(
            fn (Tenant $tenant) => $service->ensureCurrencies($tenant)
        );
    }
}
