<?php

namespace App\Services\Tenant\MasterData;

use App\Models\Master\TenantCategory;
use App\Models\Tenant\Tenant;
use Database\Seeders\Support\Master\CategoryBlueprint;

class TenantCategoryService
{
    public function ensureCategories(Tenant $tenant): void
    {
        $blueprints = CategoryBlueprint::defaultCategories();

        foreach ($blueprints as $module => $groups) {
            foreach ($groups as $index => $group) {
                $parent = TenantCategory::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'module' => $module,
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
                            'module' => $module,
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
        }
    }
}
