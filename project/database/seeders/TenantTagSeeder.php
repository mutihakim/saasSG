<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantTag;
use Illuminate\Database\Seeder;

class TenantTagSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        $tagsByModule = [
            'finance' => [
                ['name' => 'Monthly', 'color' => 'primary'],
                ['name' => 'Emergency', 'color' => 'danger'],
                ['name' => 'Investment', 'color' => 'success'],
                ['name' => 'Leisure', 'color' => 'info'],
                ['name' => 'Educational', 'color' => 'warning'],
            ],
            'grocery' => [
                ['name' => 'Fresh', 'color' => 'success'],
                ['name' => 'Frozen', 'color' => 'info'],
                ['name' => 'Spices', 'color' => 'warning'],
                ['name' => 'Dairy', 'color' => 'light'],
                ['name' => 'Organic', 'color' => 'success'],
            ],
            'tasks' => [
                ['name' => 'Urgent', 'color' => 'danger'],
                ['name' => 'High Priority', 'color' => 'warning'],
                ['name' => 'Recurring', 'color' => 'primary'],
                ['name' => 'Personal', 'color' => 'secondary'],
                ['name' => 'Family', 'color' => 'info'],
            ],
        ];

        foreach ($tenants as $tenant) {
            foreach ($tagsByModule as $module => $tags) {
                foreach ($tags as $tag) {
                    TenantTag::updateOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'name' => $tag['name'],
                        ],
                        [
                            'color' => $tag['color'],
                            'usage_count' => rand(0, 100),
                            'row_version' => 1,
                        ]
                    );
                }
            }
        }
    }
}
