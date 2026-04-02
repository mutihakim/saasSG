<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantCategory;
use Illuminate\Database\Seeder;

class TenantCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->seedFinance($tenant);
            $this->seedGrocery($tenant);
            $this->seedTask($tenant);
        }
    }

    private function seedFinance(Tenant $tenant): void
    {
        // ─── 1. Pemasukan ─────────────────────────────────────────────────────
        $mainIncome = TenantCategory::updateOrCreate([
            'tenant_id' => $tenant->id,
            'module'    => 'finance',
            'sub_type'  => 'pemasukan',
            'name'      => 'Pemasukan Utama',
        ], [
            'icon'      => 'ri-wallet-line',
            'color'     => 'success',
            'is_default'=> true,
        ]);

        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pemasukan', 'parent_id' => $mainIncome->id, 'name' => 'Gaji Bulanan'], ['icon' => 'ri-bank-card-line']);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pemasukan', 'parent_id' => $mainIncome->id, 'name' => 'Bonus & Komisi'], ['icon' => 'ri-medal-line']);

        $otherIncome = TenantCategory::updateOrCreate([
            'tenant_id' => $tenant->id,
            'module'    => 'finance',
            'sub_type'  => 'pemasukan',
            'name'      => 'Pemasukan Lainnya',
        ], [
            'icon'      => 'ri-hand-coin-line',
            'color'     => 'info',
        ]);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pemasukan', 'parent_id' => $otherIncome->id, 'name' => 'Investasi & Bunga'], ['icon' => 'ri-line-chart-line']);

        // ─── 2. Pengeluaran ───────────────────────────────────────────────────
        $routine = TenantCategory::updateOrCreate([
            'tenant_id' => $tenant->id,
            'module'    => 'finance',
            'sub_type'  => 'pengeluaran',
            'name'      => 'Kebutuhan Rutin',
        ], [
            'icon'      => 'ri-shopping-bag-line',
            'color'     => 'danger',
            'is_default'=> true,
        ]);

        // Level 2: Makan & Minum
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $routine->id, 'name' => 'Makan & Minum'], ['icon' => 'ri-restaurant-line']);
        // Level 2: Tagihan
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $routine->id, 'name' => 'Tagihan & Utilitas'], ['icon' => 'ri-lightbulb-line']);

        $transport = TenantCategory::updateOrCreate([
            'tenant_id' => $tenant->id,
            'module'    => 'finance',
            'sub_type'  => 'pengeluaran',
            'name'      => 'Transportasi',
        ], [
            'icon'      => 'ri-car-line',
            'color'     => 'warning',
        ]);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $transport->id, 'name' => 'Bensin/BBM'], []);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $transport->id, 'name' => 'Parkir & Tol'], []);

        $health = TenantCategory::updateOrCreate([
            'tenant_id' => $tenant->id,
            'module'    => 'finance',
            'sub_type'  => 'pengeluaran',
            'name'      => 'Kesehatan',
        ], [
            'icon'      => 'ri-heart-pulse-line',
            'color'     => 'primary',
        ]);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $health->id, 'name' => 'Obat & Vitamin'], []);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'finance', 'sub_type' => 'pengeluaran', 'parent_id' => $health->id, 'name' => 'Konsultasi Dokter'], []);
    }

    private function seedGrocery(Tenant $tenant): void
    {
        $fresh = TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'grocery', 'name' => 'Bahan Segar'], ['icon' => 'ri-seedling-line', 'color' => 'success']);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'grocery', 'parent_id' => $fresh->id, 'name' => 'Sayuran & Buah'], []);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'grocery', 'parent_id' => $fresh->id, 'name' => 'Daging & Ikan'], []);

        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'grocery', 'name' => 'Kebutuhan Kamar Mandi'], ['icon' => 'ri-goblet-line', 'color' => 'info']);
    }

    private function seedTask(Tenant $tenant): void
    {
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'task', 'name' => 'Pekerjaan Rumah'], ['icon' => 'ri-home-4-line', 'color' => 'primary']);
        TenantCategory::updateOrCreate(['tenant_id' => $tenant->id, 'module' => 'task', 'name' => 'Belanja/Keperluan'], ['icon' => 'ri-shopping-cart-line', 'color' => 'warning']);
    }
}
