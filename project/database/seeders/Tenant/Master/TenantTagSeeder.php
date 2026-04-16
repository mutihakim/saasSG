<?php

namespace Database\Seeders\Tenant\Master;

use App\Models\Tenant\Tenant;
use App\Services\Tenant\MasterData\TenantTagService;
use Illuminate\Database\Seeder;

class TenantTagSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(TenantTagService::class);

        Tenant::query()->orderBy('id')->each(
            fn (Tenant $tenant) => $service->ensureTags($tenant)
        );
    }
}
