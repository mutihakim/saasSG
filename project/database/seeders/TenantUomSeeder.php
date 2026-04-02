<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantUom;
use Illuminate\Database\Seeder;

class TenantUomSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $uoms = [
            ['code' => 'kg',   'name' => 'Kilogram', 'abbreviation' => 'kg',  'type' => 'berat'],
            ['code' => 'pcs',  'name' => 'Piece',    'abbreviation' => 'pcs', 'type' => 'jumlah'],
            ['code' => 'box',  'name' => 'Box',      'abbreviation' => 'box', 'type' => 'jumlah'],
            ['code' => 'liter','name' => 'Liter',    'abbreviation' => 'l',   'type' => 'volume'],
            ['code' => 'meter','name' => 'Meter',    'abbreviation' => 'm',   'type' => 'panjang'],
        ];

        foreach ($tenants as $tenant) {
            foreach ($uoms as $idx => $uom) {
                TenantUom::updateOrCreate([
                    'tenant_id'      => $tenant->id,
                    'code'           => $uom['code'],
                ], [
                    'name'           => $uom['name'],
                    'abbreviation'   => $uom['abbreviation'],
                    'dimension_type' => $uom['type'],
                    'sort_order'     => $idx + 1,
                ]);
            }
        }
    }
}
