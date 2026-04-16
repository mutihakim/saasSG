<?php

namespace App\Services\Tenant\MasterData;

use App\Models\Master\TenantUom;
use App\Models\Tenant\Tenant;
use Database\Seeders\Support\Master\UomBlueprint;

class TenantUomService
{
    public function ensureUoms(Tenant $tenant): void
    {
        foreach (UomBlueprint::defaultUnits() as $index => $unit) {
            TenantUom::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'code' => $unit['code'],
                ],
                [
                    'name' => $unit['name'],
                    'abbreviation' => $unit['abbreviation'],
                    'dimension_type' => $unit['dimension_type'],
                    'base_unit_code' => null,
                    'base_factor' => '1',
                    'is_active' => true,
                    'sort_order' => $index + 1,
                    'row_version' => 1,
                ]
            );
        }
    }
}
