<?php

namespace Database\Seeders\Tenant\Game\Demo;

use App\Services\Tenant\Game\TenantTahfizService;
use Illuminate\Database\Seeder;

class TahfizQuranSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $service = app(TenantTahfizService::class);

        // 1. Fill Global Library (tenant_id is null)
        $service->ensureQuranData(null);

        // 2. We can optionally fill specific tenants if needed in the future
    }
}
