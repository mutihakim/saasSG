<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantTag;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;

class TenantFinanceTagSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->orderBy('id')->each(function (Tenant $tenant): void {
            foreach (FamilyFinanceSeed::financeTags() as $index => $tag) {
                TenantTag::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'name' => $tag['name'],
                    ],
                    [
                        'color' => $tag['color'],
                        'usage_count' => 0,
                        'row_version' => 1,
                    ]
                );
            }
        });
    }
}
