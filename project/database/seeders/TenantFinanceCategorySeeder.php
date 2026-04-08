<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantCategory;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;

class TenantFinanceCategorySeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->orderBy('id')->each(function (Tenant $tenant): void {
            foreach (FamilyFinanceSeed::financeCategories() as $index => $group) {
                $parent = TenantCategory::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'module' => 'finance',
                        'sub_type' => $group['sub_type'],
                        'parent_id' => null,
                        'name' => $group['name'],
                    ],
                    [
                        'description' => null,
                        'icon' => $group['icon'],
                        'color' => $group['color'],
                        'sort_order' => ($index + 1) * 10,
                        'is_default' => true,
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                foreach ($group['children'] as $childIndex => $child) {
                    if ($child['name'] === $group['name']) {
                        $parent->update([
                            'description' => $child['description'],
                            'icon' => $child['icon'] ?? $parent->icon,
                        ]);

                        continue;
                    }

                    TenantCategory::query()->updateOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'module' => 'finance',
                            'sub_type' => $group['sub_type'],
                            'parent_id' => $parent->id,
                            'name' => $child['name'],
                        ],
                        [
                            'description' => $child['description'],
                            'icon' => $child['icon'] ?? 'ri-price-tag-3-line',
                            'color' => $group['color'],
                            'sort_order' => ($index + 1) * 10 + $childIndex + 1,
                            'is_default' => true,
                            'is_active' => true,
                            'row_version' => 1,
                        ]
                    );
                }
            }
        });
    }
}
