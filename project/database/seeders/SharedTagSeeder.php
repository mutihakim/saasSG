<?php

namespace Database\Seeders;

use App\Models\SharedTag;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class SharedTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'Makanan', 'color' => '#28a745'],
            ['name' => 'Transportasi', 'color' => '#007bff'],
            ['name' => 'Kesehatan', 'color' => '#dc3545'],
            ['name' => 'Pendidikan', 'color' => '#17a2b8'],
            ['name' => 'Hiburan', 'color' => '#ffc107'],
            ['name' => 'Belanja', 'color' => '#6c757d'],
            ['name' => 'Tagihan', 'color' => '#343a40'],
            ['name' => 'Investasi', 'color' => '#20c997'],
            ['name' => 'Darurat', 'color' => '#fd7e14'],
            ['name' => 'Hadiah', 'color' => '#e83e8c'],
        ];

        Tenant::chunk(100, function ($tenants) use ($tags) {
            foreach ($tenants as $tenant) {
                foreach ($tags as $tagData) {
                    SharedTag::firstOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'name' => $tagData['name'],
                        ],
                        [
                            'color' => $tagData['color'],
                            'usage_count' => 0,
                        ]
                    );
                }
            }
        });
    }
}
