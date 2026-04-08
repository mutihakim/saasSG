<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Permission;

class PlatformAccessSeeder extends Seeder
{
    public function run(): void
    {
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
    }
}
