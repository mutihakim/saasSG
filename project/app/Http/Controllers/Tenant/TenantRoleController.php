<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantRoleController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');

        if (!$this->canView($request)) {
            return $this->forbidden($request, 'Roles access denied.');
        }

        $roles = Role::query()
            ->with(['permissions' => function ($query) {
                $query->select('permissions.id', 'permissions.name');
            }])
            ->where('tenant_id', $tenant->id)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $roleIds              = $roles->pluck('id')->all();
        $visiblePermissions   = PermissionCatalog::matrixPermissions();
        $visiblePermissionSet = array_flip($visiblePermissions);
        $tenantMemberCounts = DB::table('tenant_members')
            ->join('roles', function ($join) use ($tenant) {
                $join->on('roles.name', '=', 'tenant_members.role_code')
                    ->where('roles.tenant_id', '=', $tenant->id);
            })
            ->where('tenant_members.tenant_id', $tenant->id)
            ->whereNull('tenant_members.deleted_at')
            ->where('tenant_members.profile_status', 'active')
            ->whereIn('roles.id', $roleIds)
            ->groupBy('roles.id')
            ->select(
                'roles.id as role_id',
                DB::raw('COUNT(*) FILTER (WHERE tenant_members.user_id IS NOT NULL) as linked_members_count'),
                DB::raw('COUNT(*) FILTER (WHERE tenant_members.user_id IS NULL) as pending_members_count')
            )
            ->get()
            ->keyBy('role_id');

        $previews = [];
        foreach ($roles as $role) {
            $previews[$role->id] = DB::table('tenant_members')
                ->join('users', 'users.id', '=', 'tenant_members.user_id')
                ->where('tenant_members.tenant_id', $tenant->id)
                ->where('tenant_members.role_code', $role->name)
                ->whereNull('tenant_members.deleted_at')
                ->where('tenant_members.profile_status', 'active')
                ->select('users.id', 'users.name', 'users.avatar_url')
                ->limit(5)
                ->get();
        }

        $rolesPayload = $roles->map(function (Role $role) use ($visiblePermissionSet, $tenantMemberCounts, $previews) {
            $counts = $tenantMemberCounts->get($role->id);

            return [
                'id'           => $role->id,
                'name'         => $role->name,
                'display_name' => $role->display_name ?: $role->name,
                'is_system'    => (bool) $role->is_system,
                'row_version'  => (int) $role->row_version,
                'permissions'  => $role->permissions
                    ->pluck('name')
                    ->filter(fn (string $p) => isset($visiblePermissionSet[$p]))
                    ->values()
                    ->all(),
                'members_count'   => (int) (($counts->linked_members_count ?? 0) + ($counts->pending_members_count ?? 0)),
                'linked_members_count' => (int) ($counts->linked_members_count ?? 0),
                'pending_members_count' => (int) ($counts->pending_members_count ?? 0),
                'members_preview' => $previews[$role->id] ?? [],
            ];
        })->values();

        return Inertia::render('Tenant/Roles/Index', [
            'roles'             => $rolesPayload,
            'permissionModules' => PermissionCatalog::matrixModules(),
        ]);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function canView(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && ($user->can('team.roles.view') || $user->can('team.role_permissions.assign'))) return true;

        return in_array($member?->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }

    private function forbidden(Request $request, string $message): HttpResponse
    {
        return Inertia::render('Tenant/Forbidden', ['message' => $message])
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
