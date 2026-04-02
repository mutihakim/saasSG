<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantCurrency;
use Illuminate\Database\Seeder;

class TenantCurrencySeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            TenantCurrency::updateOrCreate([
                'tenant_id' => $tenant->id,
                'code'      => 'IDR',
            ], [
                'name'      => 'Rupiah',
                'symbol'    => 'Rp',
                'symbol_position' => 'before',
                'decimal_places'  => 0,
                'thousands_sep'   => '.',
                'decimal_sep'     => ',',
                'is_active'       => true,
                'sort_order'      => 1,
            ]);

            TenantCurrency::updateOrCreate([
                'tenant_id' => $tenant->id,
                'code'      => 'USD',
            ], [
                'name'      => 'US Dollar',
                'symbol'    => '$',
                'symbol_position' => 'before',
                'decimal_places'  => 2,
                'thousands_sep'   => ',',
                'decimal_sep'     => '.',
                'is_active'       => true,
                'sort_order'      => 2,
            ]);
        }
    }
}
