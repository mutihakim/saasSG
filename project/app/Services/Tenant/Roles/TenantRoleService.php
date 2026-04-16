<?php

namespace App\Services\Tenant\Roles;

use App\Models\Tenant\Tenant;
use App\Support\PermissionCatalog;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantRoleService
{
    public function syncDefaultRoles(Tenant $tenant): array
    {
        $this->ensureGlobalPermissions();

        /** @var PermissionRegistrar $permissionRegistrar */
        $permissionRegistrar = app(PermissionRegistrar::class);
        $permissionRegistrar->setPermissionsTeamId($tenant->id);

        $allPermissions = collect(PermissionCatalog::matrixPermissions());
        $financeWallet = $allPermissions->filter(fn (string $permission) => str_starts_with($permission, 'finance.') || str_starts_with($permission, 'wallet.'));
        $viewOnly = $allPermissions->filter(fn (string $permission) => str_ends_with($permission, '.view'));

        $ownerPermissions = $allPermissions->all();
        
        $adminPermissions = $allPermissions
            ->reject(fn (string $permission) => str_starts_with($permission, 'finance.') || str_starts_with($permission, 'wallet.'))
            ->merge(['finance.view', 'wallet.view'])
            ->unique()
            ->values()
            ->all();

        $memberPermissions = $viewOnly
            ->merge($financeWallet)
            ->merge([
                'games.math.create',
                'games.math.update',
                'games.vocabulary.create',
                'games.vocabulary.update',
                'games.curriculum.create',
                'games.curriculum.update',
            ])
            ->unique()
            ->values()
            ->all();

        $roles = [
            'owner' => [
                'display_name' => 'Owner',
                'permissions' => $ownerPermissions,
            ],
            'admin' => [
                'display_name' => 'Admin',
                'permissions' => $adminPermissions,
            ],
            'member' => [
                'display_name' => 'Member',
                'permissions' => $memberPermissions,
            ],
        ];

        $results = [];

        foreach ($roles as $name => $config) {
            $role = Role::query()->firstOrCreate(
                ['name' => $name, 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['display_name' => $config['display_name'], 'is_system' => true, 'row_version' => 1]
            );

            $role->syncPermissions($config['permissions']);
            $results[$name] = $role;
        }

        return $results;
    }

    private function ensureGlobalPermissions(): void
    {
        foreach (PermissionCatalog::all() as $permissionName) {
            Permission::query()->firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }
    }
}
