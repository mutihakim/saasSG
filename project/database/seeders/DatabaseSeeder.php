<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TenantStorageResetSeeder::class,
            PlatformAccessSeeder::class,
            TenantBaselineSeeder::class,
            TenantMasterDataSeeder::class,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
