<?php

namespace App\Services;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantRoleSyncService
{
    public function syncMemberRole(TenantMember $member): bool
    {
        if (! $member->user_id) {
            return false;
        }

        $user = User::query()->find($member->user_id);
        if (! $user) {
            return false;
        }

        $role = Role::query()
            ->where('tenant_id', $member->tenant_id)
            ->where('guard_name', 'web')
            ->where('name', $member->role_code)
            ->first();

        if (! $role) {
            return false;
        }

        $this->setTeamContext($member->tenant_id);
        $user->syncRoles([$role->name]);

        return true;
    }

    public function clearUserRolesForTenant(int $tenantId, ?int $userId): bool
    {
        if (! $userId) {
            return false;
        }

        $user = User::query()->find($userId);
        if (! $user) {
            return false;
        }

        $this->setTeamContext($tenantId);
        $user->syncRoles([]);

        return true;
    }

    public function normalizeTenantRoles(Tenant $tenant): array
    {
        $members = TenantMember::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->whereNotNull('user_id')
            ->orderBy('id')
            ->get();

        $stats = [
            'inspected' => $members->count(),
            'synced' => 0,
            'skipped_missing_role' => 0,
        ];

        /** @var TenantMember $member */
        foreach ($members as $member) {
            if ($this->syncMemberRole($member)) {
                $stats['synced']++;
            } else {
                $stats['skipped_missing_role']++;
            }
        }

        return $stats;
    }

    private function setTeamContext(int $tenantId): void
    {
        /** @var PermissionRegistrar $permissionRegistrar */
        $permissionRegistrar = app(PermissionRegistrar::class);
        $permissionRegistrar->setPermissionsTeamId($tenantId);
    }
}
