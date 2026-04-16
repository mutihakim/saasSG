<?php

namespace Database\Seeders\Tenant\Game\Demo;

use App\Services\Tenant\Game\TenantVocabularyService;
use Illuminate\Database\Seeder;

class VocabularyDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $service = app(TenantVocabularyService::class);
        
        // 1. Fill Global Library (tenant_id is null)
        $service->ensureVocabulary(null);
        
        // 2. We can optionally fill specific tenants if needed in the future
    }
}
