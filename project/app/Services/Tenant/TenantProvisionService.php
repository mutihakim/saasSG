<?php

namespace App\Services\Tenant;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Tenant\Finance\TenantFinanceBaselineService;
use App\Services\Tenant\MasterData\TenantCategoryService;
use App\Services\Tenant\MasterData\TenantCurrencyService;
use App\Services\Tenant\MasterData\TenantTagService;
use App\Services\Tenant\MasterData\TenantUomService;
use App\Services\Tenant\Roles\TenantRoleService;
use App\Services\Tenant\Roles\TenantRoleSyncService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class TenantProvisionService
{
    public function __construct(
        private TenantRoleService $roleService,
        private TenantRoleSyncService $syncService,
        private TenantCategoryService $categoryService,
        private TenantTagService $tagService,
        private TenantCurrencyService $currencyService,
        private TenantUomService $uomService,
        private TenantFinanceBaselineService $financeBaselineService,
    ) {}

    /**
     * Provision a tenant from a blueprint (primarily for seeding).
     */
    public function provision(array $blueprint): Tenant
    {
        return DB::transaction(function () use ($blueprint) {
            $ownerUser = $this->upsertUser($blueprint['slug'], 'owner', 'Owner', true);

            $tenant = Tenant::query()->updateOrCreate(
                ['slug' => $blueprint['slug']],
                [
                    'owner_user_id' => $ownerUser->id,
                    'name' => $blueprint['name'],
                    'display_name' => $blueprint['name'],
                    'locale' => 'id',
                    'timezone' => 'Asia/Jakarta',
                    'currency_code' => 'IDR',
                    'plan_code' => $blueprint['plan_code'],
                    'status' => 'active',
                ]
            );

            // Initialize Roles and Permissions
            $roles = $this->roleService->syncDefaultRoles($tenant);

            // Setup Members
            foreach ($blueprint['members'] as $memberSeed) {
                $user = $memberSeed['key'] === 'owner'
                    ? $ownerUser
                    : $this->upsertUser($blueprint['slug'], $memberSeed['key'], $memberSeed['name'], false);

                $member = TenantMember::query()->updateOrCreate(
                    ['user_id' => $user->id, 'tenant_id' => $tenant->id],
                    [
                        'full_name' => $memberSeed['name'],
                        'role_code' => $memberSeed['role'],
                        'profile_status' => 'active',
                        'onboarding_status' => 'account_active',
                        'row_version' => 1,
                    ]
                );

                // Sync user roles
                $this->setTeamContext($tenant->id);
                $user->syncRoles([$roles[$memberSeed['role']]->name]);

                // Sync member legacy role code/permissions
                $this->syncService->syncMemberRole($member);
            }

            // Initialize Master Data
            $this->provisionMasterData($tenant);
            $this->financeBaselineService->ensureTenantFinanceBaseline($tenant);

            return $tenant;
        });
    }

    /**
     * Provision a default workspace for a new user (Production/Registration flow).
     */
    public function provisionDefaultWorkspaceForUser(User $user, ?string $workspaceName = null): Tenant
    {
        return DB::transaction(function () use ($user, $workspaceName) {
            $slugBase = str($workspaceName ?: $user->name)->slug()->value();
            if ($slugBase === '') {
                $slugBase = 'workspace';
            }

            $slug = $this->uniqueTenantSlug($slugBase);
            $tenantName = ($workspaceName ?: $user->name) . ' Workspace';

            $tenant = Tenant::query()->create([
                'owner_user_id' => $user->id,
                'name' => $tenantName,
                'display_name' => $tenantName,
                'slug' => $slug,
                'locale' => 'id',
                'timezone' => 'Asia/Jakarta',
                'currency_code' => 'IDR',
                'plan_code' => 'free',
                'status' => 'active',
            ]);

            $member = TenantMember::query()->create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'full_name' => $user->name,
                'role_code' => 'owner',
                'profile_status' => 'active',
                'onboarding_status' => 'account_active',
                'row_version' => 1,
            ]);

            // Initialize Roles and Permissions
            $roles = $this->roleService->syncDefaultRoles($tenant);

            // Sync user roles
            $this->setTeamContext($tenant->id);
            $user->syncRoles([$roles['owner']->name]);

            // Sync member legacy role code
            $this->syncService->syncMemberRole($member);

            // Initialize Master Data
            $this->provisionMasterData($tenant);
            $this->financeBaselineService->ensureTenantFinanceBaseline($tenant);

            return $tenant;
        });
    }

    /**
     * Ensure all global master data is provisioned for the tenant.
     */
    private function provisionMasterData(Tenant $tenant): void
    {
        $this->currencyService->ensureCurrencies($tenant);
        $this->uomService->ensureUoms($tenant);
        $this->categoryService->ensureCategories($tenant);
        $this->tagService->ensureTags($tenant);
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

    private function uniqueTenantSlug(string $base): string
    {
        $slug = $base;
        $suffix = 1;
        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function setTeamContext(int $tenantId): void
    {
        /** @var PermissionRegistrar $permissionRegistrar */
        $permissionRegistrar = app(PermissionRegistrar::class);
        $permissionRegistrar->setPermissionsTeamId($tenantId);
    }
}
