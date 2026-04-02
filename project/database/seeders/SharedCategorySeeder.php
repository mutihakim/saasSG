<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SharedCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->seedFinanceCategories($tenant->id);
        }
    }

    public static function seedForTenant(int $tenantId): void
    {
        (new self())->seedFinanceCategories($tenantId);
    }

    private function seedFinanceCategories(int $tenantId): void
    {
        $incomeCategories = [
            ['name' => 'Gaji / Upah',        'icon' => 'ri-briefcase-line',        'color' => '#27AE60', 'sort_order' => 1],
            ['name' => 'Bonus / THR',         'icon' => 'ri-gift-line',             'color' => '#2ECC71', 'sort_order' => 2],
            ['name' => 'Hasil Usaha',         'icon' => 'ri-store-line',            'color' => '#16A085', 'sort_order' => 3],
            ['name' => 'Investasi',           'icon' => 'ri-line-chart-line',       'color' => '#1ABC9C', 'sort_order' => 4],
            ['name' => 'Penjualan Barang',    'icon' => 'ri-shopping-bag-line',     'color' => '#3498DB', 'sort_order' => 5],
            ['name' => 'Transfer Masuk',      'icon' => 'ri-arrow-left-right-line', 'color' => '#2980B9', 'sort_order' => 6],
            ['name' => 'Lainnya',             'icon' => 'ri-more-line',             'color' => '#95A5A6', 'sort_order' => 99],
        ];

        $expenseCategories = [
            ['name' => 'Makanan & Minuman',  'icon' => 'ri-restaurant-line',       'color' => '#E74C3C', 'sort_order' => 1],
            ['name' => 'Transport',          'icon' => 'ri-car-line',              'color' => '#C0392B', 'sort_order' => 2],
            ['name' => 'Belanja',            'icon' => 'ri-shopping-cart-line',    'color' => '#E67E22', 'sort_order' => 3],
            ['name' => 'Tagihan & Utilitas', 'icon' => 'ri-bill-line',             'color' => '#D35400', 'sort_order' => 4],
            ['name' => 'Kesehatan',          'icon' => 'ri-heart-pulse-line',      'color' => '#9B59B6', 'sort_order' => 5],
            ['name' => 'Pendidikan',         'icon' => 'ri-book-open-line',        'color' => '#8E44AD', 'sort_order' => 6],
            ['name' => 'Hiburan',            'icon' => 'ri-gamepad-line',          'color' => '#3498DB', 'sort_order' => 7],
            ['name' => 'Tabungan',           'icon' => 'ri-safe-line',             'color' => '#2ECC71', 'sort_order' => 8],
            ['name' => 'Investasi',          'icon' => 'ri-stock-line',            'color' => '#1ABC9C', 'sort_order' => 9],
            ['name' => 'Rumah & Properti',   'icon' => 'ri-home-line',             'color' => '#E74C3C', 'sort_order' => 10],
            ['name' => 'Transfer Keluar',    'icon' => 'ri-arrow-right-line',      'color' => '#7F8C8D', 'sort_order' => 11],
            ['name' => 'Lainnya',            'icon' => 'ri-more-line',             'color' => '#95A5A6', 'sort_order' => 99],
        ];

        foreach ($incomeCategories as $cat) {
            DB::table('shared_categories')->upsert([
                array_merge($cat, [
                    'id'         => Str::ulid(),
                    'tenant_id'  => $tenantId,
                    'module'     => 'finance',
                    'sub_type'   => 'pemasukan',
                    'parent_id'  => null,
                    'is_default' => true,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            ], ['tenant_id', 'module', 'sub_type', 'name'], [
                'icon', 'color', 'sort_order', 'updated_at',
            ]);
        }

        foreach ($expenseCategories as $cat) {
            DB::table('shared_categories')->upsert([
                array_merge($cat, [
                    'id'         => Str::ulid(),
                    'tenant_id'  => $tenantId,
                    'module'     => 'finance',
                    'sub_type'   => 'pengeluaran',
                    'parent_id'  => null,
                    'is_default' => true,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            ], ['tenant_id', 'module', 'sub_type', 'name'], [
                'icon', 'color', 'sort_order', 'updated_at',
            ]);
        }
    }
}
