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
                ['name' => 'Monthly', 'color' => '#405189'],
                ['name' => 'Emergency', 'color' => '#F06548'],
                ['name' => 'Investment', 'color' => '#0AB39C'],
                ['name' => 'Leisure', 'color' => '#299CDB'],
                ['name' => 'Educational', 'color' => '#F7B84B'],
            ],
            'grocery' => [
                ['name' => 'Fresh', 'color' => '#0AB39C'],
                ['name' => 'Frozen', 'color' => '#299CDB'],
                ['name' => 'Spices', 'color' => '#F7B84B'],
                ['name' => 'Dairy', 'color' => '#CED4DA'],
                ['name' => 'Organic', 'color' => '#0AB39C'],
            ],
            'tasks' => [
                ['name' => 'Urgent', 'color' => '#F06548'],
                ['name' => 'High Priority', 'color' => '#F7B84B'],
                ['name' => 'Recurring', 'color' => '#405189'],
                ['name' => 'Personal', 'color' => '#6C757D'],
                ['name' => 'Family', 'color' => '#299CDB'],
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
