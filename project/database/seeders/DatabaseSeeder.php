<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Master data (global, tidak tenant-specific)
        $this->call([
            MasterCurrencySeeder::class,
            MasterUomSeeder::class,
            SharedTagSeeder::class,
            SharedCategorySeeder::class,
            FinanceTransactionSeeder::class,
        ]);

        $superadmin = User::query()->updateOrCreate(
            ['email' => 'superadmin@test.com'],
            [
                'name' => 'Global Superadmin',
                'password' => Hash::make('password'),
                'is_superadmin' => true,
                'email_verified_at' => now()->utc(),
                'job_title' => 'Platform Superadmin',
            ]
        );

        $e2eUser = User::query()->updateOrCreate(
            ['email' => 'e2e@project.test'],
            [
                'name' => 'E2E Automation Seed',
                'password' => Hash::make('password'),
                'is_superadmin' => false,
                'email_verified_at' => now()->utc(),
                'job_title' => 'QA Testing Bot',
                'city' => 'Jakarta',
                'country' => 'Indonesia',
            ]
        );

        $tenantSeeds = [
            ['name' => 'Keluarga Cemara', 'slug' => 'keluarga-cemara', 'plan_code' => 'pro'],
            ['name' => 'Yayasan Kasih Bunda', 'slug' => 'kasih-bunda', 'plan_code' => 'free'],
            ['name' => 'Childcare Pelangi Serpong', 'slug' => 'pelangi-serpong', 'plan_code' => 'pro'],
            ['name' => 'Kelompok Bermain Bintang', 'slug' => 'kb-bintang', 'plan_code' => 'pro'],
            ['name' => 'TK Permata Hati', 'slug' => 'tk-permata-hati', 'plan_code' => 'free'],
            ['name' => 'SD Harapan Mulia', 'slug' => 'sd-harapan-mulia', 'plan_code' => 'business'],
            ['name' => 'Panti Asuhan Al-Ikhlas', 'slug' => 'al-ikhlas', 'plan_code' => 'business'],
            ['name' => 'Keluarga Besar Wijaya', 'slug' => 'keluarga-wijaya', 'plan_code' => 'enterprise'],
        ];

        $permissions = PermissionCatalog::all();
        foreach ($permissions as $permission) {
            Permission::query()->firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        /** @var PermissionRegistrar $permissionRegistrar */
        $permissionRegistrar = app(PermissionRegistrar::class);
        $permissionRegistrar->forgetCachedPermissions();

        $ownerPermissions = PermissionCatalog::matrixPermissions();
        $adminPermissions = collect(PermissionCatalog::matrixPermissions())
            ->filter(fn (string $permission) => str_ends_with($permission, '.create') || str_ends_with($permission, '.view') || str_ends_with($permission, '.update') || str_ends_with($permission, '.manage'))
            ->reject(fn (string $permission) => str_starts_with($permission, 'whatsapp.settings.'))
            ->values()
            ->all();
        $memberPermissions = collect(PermissionCatalog::matrixPermissions())
            ->filter(fn (string $permission) => str_ends_with($permission, '.view'))
            ->reject(fn (string $permission) => str_starts_with($permission, 'whatsapp.settings.'))
            ->reject(fn (string $permission) => str_starts_with($permission, 'tenant.settings.'))
            ->values()
            ->all();

        foreach ($tenantSeeds as $seed) {
            $owner = $this->upsertTenantUser('owner', $seed['slug'], 'Owner', 'Tenant Owner');
            $admin = $this->upsertTenantUser('admin', $seed['slug'], 'Admin', 'Tenant Admin');
            $member = $this->upsertTenantUser('member', $seed['slug'], 'Member', 'Tenant Member');

            $tenant = Tenant::query()->updateOrCreate(
                ['slug' => $seed['slug']],
                [
                    'owner_user_id' => $owner->id,
                    'name' => $seed['name'],
                    'locale' => 'id',
                    'timezone' => 'Asia/Jakarta',
                    'plan_code' => $seed['plan_code'],
                    'status' => 'active',
                ]
            );

            $permissionRegistrar->setPermissionsTeamId($tenant->id);

            $ownerRole = Role::query()->firstOrCreate(
                ['name' => 'owner', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['display_name' => 'Owner', 'is_system' => true, 'row_version' => 1]
            );
            $adminRole = Role::query()->firstOrCreate(
                ['name' => 'admin', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['display_name' => 'Admin', 'is_system' => true, 'row_version' => 1]
            );
            $memberRole = Role::query()->firstOrCreate(
                ['name' => 'member', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['display_name' => 'Member', 'is_system' => true, 'row_version' => 1]
            );

            $ownerRole->syncPermissions($ownerPermissions);
            $adminRole->syncPermissions($adminPermissions);
            $memberRole->syncPermissions($memberPermissions);

            $this->upsertMembership($tenant, $owner, 'owner', $permissionRegistrar, $this->makeSeedWhatsappJid($seed['slug'], 'owner'));
            $this->upsertMembership($tenant, $admin, 'admin', $permissionRegistrar, $this->makeSeedWhatsappJid($seed['slug'], 'admin'));
            $this->upsertMembership($tenant, $member, 'member', $permissionRegistrar, $this->makeSeedWhatsappJid($seed['slug'], 'member'));

            if ($seed['slug'] === 'keluarga-cemara') {
                $this->upsertMembership($tenant, $e2eUser, 'owner', $permissionRegistrar, '628000000000@c.us');
            }

            // Compatibility transition from legacy viewer to member role code.
            TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->whereIn('role_code', ['viewer', 'tenant_viewer'])
                ->update(['role_code' => 'member']);

            $legacyViewerRole = Role::query()
                ->where('tenant_id', $tenant->id)
                ->where('name', 'viewer')
                ->first();
            if ($legacyViewerRole) {
                $legacyViewerRole->delete();
            }
        }

        // Ensure superadmin stays global actor (no tenant membership required).
        TenantMember::query()
            ->where('user_id', $superadmin->id)
            ->delete();

        $permissionRegistrar->forgetCachedPermissions();
    }

    private function upsertTenantUser(string $role, string $tenantSlug, string $namePrefix, string $jobTitle): User
    {
        $email = sprintf('%s@%s.com', $role, $tenantSlug);

        return User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => sprintf('%s %s', $namePrefix, str($tenantSlug)->replace('-', ' ')->title()),
                'password' => Hash::make('password'),
                'is_superadmin' => false,
                'email_verified_at' => now()->utc(),
                'job_title' => $jobTitle,
                'phone' => null,
                'city' => 'Jakarta',
                'country' => 'Indonesia',
            ]
        );
    }

    private function upsertMembership(
        Tenant $tenant,
        User $user,
        string $roleName,
        PermissionRegistrar $permissionRegistrar,
        ?string $whatsappJid = null
    ): void
    {
        $member = TenantMember::query()->updateOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'tenant_id' => $tenant->id,
                'full_name' => $user->name,
                'role_code' => $roleName,
                'profile_status' => 'active',
                'onboarding_status' => $user->id ? 'account_active' : 'no_account',
                'whatsapp_jid' => $whatsappJid,
                'row_version' => 1,
            ]
        );

        $permissionRegistrar->setPermissionsTeamId($tenant->id);
        $user->syncRoles([$roleName]);

        if ($member->role_code !== $roleName) {
            $member->update(['role_code' => $roleName]);
        }
    }

    private function makeSeedWhatsappJid(string $tenantSlug, string $role): string
    {
        $hash = substr(hash('sha256', $tenantSlug . '|' . $role), 0, 12);
        $digits = preg_replace('/[^0-9]/', '', base_convert($hash, 16, 10));
        $digits = str_pad(substr($digits, 0, 10), 10, '7');

        return '628' . $digits . '@c.us';
    }
}
