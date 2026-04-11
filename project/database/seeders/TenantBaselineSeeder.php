<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;
use App\Services\TenantRoleSyncService;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantBaselineSeeder extends Seeder
{
    public function run(): void
    {
        /** @var PermissionRegistrar $permissionRegistrar */
        $permissionRegistrar = app(PermissionRegistrar::class);

        foreach (FamilyFinanceSeed::tenantBlueprints() as $tenantSeed) {
            $ownerUser = $this->upsertUser($tenantSeed['slug'], 'owner', 'Owner', true);

            $tenant = Tenant::query()->updateOrCreate(
                ['slug' => $tenantSeed['slug']],
                [
                    'owner_user_id' => $ownerUser->id,
                    'name' => $tenantSeed['name'],
                    'display_name' => $tenantSeed['name'],
                    'locale' => 'id',
                    'timezone' => 'Asia/Jakarta',
                    'currency_code' => 'IDR',
                    'plan_code' => $tenantSeed['plan_code'],
                    'status' => 'active',
                ]
            );

            $permissionRegistrar->setPermissionsTeamId($tenant->id);
            $roles = $this->syncRoles($tenant);

            foreach ($tenantSeed['members'] as $memberSeed) {
                $user = $memberSeed['key'] === 'owner'
                    ? $ownerUser
                    : $this->upsertUser($tenantSeed['slug'], $memberSeed['key'], $memberSeed['name'], false);

                $member = TenantMember::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'tenant_id' => $tenant->id,
                        'full_name' => $memberSeed['name'],
                        'role_code' => $memberSeed['role'],
                        'profile_status' => 'active',
                        'onboarding_status' => 'account_active',
                        'row_version' => 1,
                    ]
                );

                $user->syncRoles([$roles[$memberSeed['role']]->name]);
                app(TenantRoleSyncService::class)->syncMemberRole($member);
            }
        }
    }

    private function upsertUser(string $tenantSlug, string $prefix, string $name, bool $isOwner): User
    {
        return User::query()->updateOrCreate(
            ['email' => sprintf('%s@%s.com', $prefix, $tenantSlug)],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'is_superadmin' => false,
                'email_verified_at' => now()->utc(),
                'job_title' => $isOwner ? 'Tenant Owner' : 'Tenant Member',
                'city' => 'Jakarta',
                'country' => 'Indonesia',
            ]
        );
    }

    private function syncRoles(Tenant $tenant): array
    {
        $permissions = collect(\App\Support\PermissionCatalog::matrixPermissions());
        $financeWallet = $permissions->filter(fn (string $permission) => str_starts_with($permission, 'finance.') || str_starts_with($permission, 'wallet.'));
        $viewOnly = $permissions->filter(fn (string $permission) => str_ends_with($permission, '.view'));

        $ownerPermissions = $permissions->all();
        $adminPermissions = $permissions
            ->reject(fn (string $permission) => str_starts_with($permission, 'finance.') || str_starts_with($permission, 'wallet.'))
            ->merge(['finance.view', 'wallet.view'])
            ->unique()
            ->values()
            ->all();
        $memberPermissions = $viewOnly
            ->merge($financeWallet)
            ->merge(['games.math.create', 'games.math.update'])
            ->unique()
            ->values()
            ->all();

        $owner = Role::query()->firstOrCreate(
            ['name' => 'owner', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
            ['display_name' => 'Owner', 'is_system' => true, 'row_version' => 1]
        );
        $admin = Role::query()->firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
            ['display_name' => 'Admin', 'is_system' => true, 'row_version' => 1]
        );
        $member = Role::query()->firstOrCreate(
            ['name' => 'member', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
            ['display_name' => 'Member', 'is_system' => true, 'row_version' => 1]
        );

        $owner->syncPermissions($ownerPermissions);
        $admin->syncPermissions($adminPermissions);
        $member->syncPermissions($memberPermissions);

        return [
            'owner' => $owner,
            'admin' => $admin,
            'member' => $member,
        ];
    }
}
