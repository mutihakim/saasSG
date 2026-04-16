<?php

namespace Database\Seeders;

use App\Models\Identity\User;
use App\Services\Tenant\TenantProvisionService;
use App\Support\PermissionCatalog;
use Database\Seeders\Support\Tenant\TenantBlueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Setup Platform Access (Permissions & Superadmin)
        foreach (PermissionCatalog::all() as $permission) {
            Permission::query()->firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        User::query()->updateOrCreate(
            ['email' => 'superadmin@test.com'],
            [
                'name' => 'Global Superadmin',
                'password' => Hash::make('password'),
                'is_superadmin' => true,
                'email_verified_at' => now()->utc(),
                'job_title' => 'Platform Superadmin',
                'city' => 'Jakarta',
                'country' => 'Indonesia',
            ]
        );

        // 2. Setup Tenant Baselines
        $provisionService = app(TenantProvisionService::class);

        foreach (TenantBlueprint::all() as $blueprint) {
            $provisionService->provision($blueprint);
        }

        // 3. Run Demo Seeders
        $this->call([
            \Database\Seeders\Tenant\Game\Demo\VocabularyDemoSeeder::class,
            \Database\Seeders\Tenant\Game\Demo\TahfizQuranSeeder::class,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
