<?php

namespace Database\Seeders\Tenant\Master;

use App\Models\Tenant\Tenant;
use App\Services\Tenant\MasterData\TenantCategoryService;
use Illuminate\Database\Seeder;

class TenantCategorySeeder extends Seeder
{
    public function run(): void
    {
        $service = app(TenantCategoryService::class);

        Tenant::query()->orderBy('id')->each(
            fn (Tenant $tenant) => $service->ensureCategories($tenant)
        );
    }
}
