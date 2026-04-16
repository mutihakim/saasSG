<?php

namespace Database\Seeders\Tenant\Master;

use App\Models\Tenant\Tenant;
use App\Services\Tenant\MasterData\TenantUomService;
use Illuminate\Database\Seeder;

class TenantUomSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(TenantUomService::class);

        Tenant::query()->orderBy('id')->each(
            fn (Tenant $tenant) => $service->ensureUoms($tenant)
        );
    }
}
