<?php

namespace App\Http\Controllers;

use App\Models\TenantInvitation;
use App\Models\TenantMember;
use App\Models\Tenant;
use App\Support\PermissionCatalog;
use App\Support\SubscriptionEntitlements;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Spatie\Permission\Models\Role;

class TenantWorkspaceController extends Controller
{
    public function selector(Request $request)
    {
        $user = $request->user();

        if ($user?->is_superadmin) {
            return redirect('/admin/tenants');
        }

        $membership = TenantMember::query()
            ->where('user_id', $user?->id)
            ->where('profile_status', 'active')
            ->first();

        if ($membership) {
            $tenant = Tenant::find($membership->tenant_id);
            if ($tenant) {
                return redirect()->route('tenant.dashboard', $tenant->slug);
            }
        }

        return redirect()->route('home');
    }

    public function accessRequired(): Response
    {
        return Inertia::render('Tenant/AccessRequired');
    }

    public function dashboard(Request $request, string $tenant): Response
    {
        $tenant = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/Dashboard', [
            'stats' => [
                'members_count' => TenantMember::query()
                    ->where('tenant_id', $tenant->id)
                    ->count(),
                'invitations_count' => TenantInvitation::query()
                    ->where('tenant_id', $tenant->id)
                    ->count(),
            ],
        ]);
    }

    public function members(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');
        if (!$this->canViewMembers($request)) {
            return $this->forbiddenPage($request, 'Members access denied.');
        }

        $members = TenantMember::query()
            ->with(['user:id,email,email_verified_at'])
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get(['id', 'user_id', 'full_name', 'role_code', 'profile_status', 'onboarding_status', 'whatsapp_jid', 'row_version'])
            ->map(function (TenantMember $member) {
                return [
                    'id' => $member->id,
                    'user_id' => $member->user_id,
                    'full_name' => $member->full_name,
                    'role_code' => $member->role_code,
                    'profile_status' => $member->profile_status,
                    'onboarding_status' => $member->onboarding_status,
                    'account_status' => $member->user_id
                        ? ($member->user?->email_verified_at ? 'verified' : 'unverified')
                        : 'no_account',
                    'user_email' => $member->user?->email,
                    'whatsapp_jid' => $member->whatsapp_jid,
                    'row_version' => $member->row_version,
                ];
            })
            ->values();

        return Inertia::render('Tenant/Members/Index', [
            'members' => $members,
            'roleOptions' => Role::query()
                ->where('tenant_id', $tenant->id)
                ->whereNotIn('name', ['owner', 'tenant_owner'])
                ->orderBy('is_system', 'desc')
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    public function memberEdit(Request $request, string $tenant, int $member): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');
        if (!$this->canUpdateMembers($request)) {
            return $this->forbiddenPage($request, 'You do not have permission to edit member profile.');
        }

        $target = TenantMember::query()
            ->with('user')
            ->where('tenant_id', $tenant->id)
            ->where('id', $member)
            ->firstOrFail();

        return Inertia::render('Tenant/Members/Edit', [
            'member' => [
                'id' => $target->id,
                'full_name' => $target->full_name,
                'role_code' => $target->role_code,
                'profile_status' => $target->profile_status,
                'whatsapp_jid' => $target->whatsapp_jid,
                'row_version' => $target->row_version,
                'user' => $target->user ? [
                    'id' => $target->user->id,
                    'name' => $target->user->name,
                    'email' => $target->user->email,
                    'phone' => $target->user->phone,
                    'job_title' => $target->user->job_title,
                    'bio' => $target->user->bio,
                    'avatar_url' => $target->user->avatar_url,
                    'address_line' => $target->user->address_line,
                    'city' => $target->user->city,
                    'country' => $target->user->country,
                    'postal_code' => $target->user->postal_code,
                ] : null,
            ],
            'roleOptions' => Role::query()
                ->where('tenant_id', $tenant->id)
                ->whereNotIn('name', ['owner', 'tenant_owner'])
                ->orderBy('is_system', 'desc')
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    public function memberView(Request $request, string $tenant, int $member): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');
        if (!$this->canViewMembers($request)) {
            return $this->forbiddenPage($request, 'Members access denied.');
        }

        $target = TenantMember::query()
            ->with('user')
            ->where('tenant_id', $tenant->id)
            ->where('id', $member)
            ->firstOrFail();

        return Inertia::render('Tenant/Members/View', [
            'member' => [
                'id' => $target->id,
                'full_name' => $target->full_name,
                'role_code' => $target->role_code,
                'profile_status' => $target->profile_status,
                'whatsapp_jid' => $target->whatsapp_jid,
                'row_version' => $target->row_version,
                'user' => $target->user ? [
                    'id' => $target->user->id,
                    'name' => $target->user->name,
                    'email' => $target->user->email,
                    'phone' => $target->user->phone,
                    'job_title' => $target->user->job_title,
                    'bio' => $target->user->bio,
                    'avatar_url' => $target->user->avatar_url,
                    'address_line' => $target->user->address_line,
                    'city' => $target->user->city,
                    'country' => $target->user->country,
                    'postal_code' => $target->user->postal_code,
                ] : null,
            ],
            'canEdit' => $this->canUpdateMembers($request),
        ]);
    }

    public function roles(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');
        if (!$this->canViewRoles($request)) {
            return $this->forbiddenPage($request, 'Roles access denied.');
        }

        // 1. Get all roles for the tenant
        $roles = Role::query()
            ->with(['permissions' => function ($query) {
                $query->select('permissions.id', 'permissions.name');
            }])
            ->where('tenant_id', $tenant->id)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $roleIds = $roles->pluck('id')->all();
        $visiblePermissions = PermissionCatalog::matrixPermissions();
        $visiblePermissionSet = array_flip($visiblePermissions);

        // 2. Fetch member counts for all roles in one query
        $memberCounts = DB::table('model_has_roles')
            ->join('tenant_members', function ($join) use ($tenant) {
                $join->on('tenant_members.user_id', '=', 'model_has_roles.model_id')
                    ->where('tenant_members.tenant_id', '=', $tenant->id)
                    ->whereNull('tenant_members.deleted_at')
                    ->where('tenant_members.profile_status', '=', 'active');
            })
            ->whereIn('model_has_roles.role_id', $roleIds)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('model_has_roles.tenant_id', $tenant->id)
            ->groupBy('model_has_roles.role_id')
            ->select('model_has_roles.role_id', DB::raw('COUNT(DISTINCT model_has_roles.model_id) as count'))
            ->pluck('count', 'role_id')
            ->all();

        // 3. Fetch member previews (avatars) for all roles
        // Since we only need 5 per role, we can do this with a slightly more complex query or a few targeted ones.
        $previews = [];
        foreach ($roles as $role) {
            $previews[$role->id] = DB::table('model_has_roles')
                ->join('users', 'users.id', '=', 'model_has_roles.model_id')
                ->join('tenant_members', function ($join) use ($tenant) {
                    $join->on('tenant_members.user_id', '=', 'users.id')
                        ->where('tenant_members.tenant_id', $tenant->id)
                        ->whereNull('tenant_members.deleted_at')
                        ->where('tenant_members.profile_status', '=', 'active');
                })
                ->where('model_has_roles.role_id', $role->id)
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('model_has_roles.tenant_id', $tenant->id)
                ->select('users.id', 'users.name', 'users.avatar_url')
                ->limit(5)
                ->get();
        }

        $rolesPayload = $roles->map(function (Role $role) use ($visiblePermissionSet, $memberCounts, $previews) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name ?: $role->name,
                'is_system' => (bool) $role->is_system,
                'row_version' => (int) $role->row_version,
                'permissions' => $role->permissions
                    ->pluck('name')
                    ->filter(fn (string $permission) => isset($visiblePermissionSet[$permission]))
                    ->values()
                    ->all(),
                'members_count' => $memberCounts[$role->id] ?? 0,
                'members_preview' => $previews[$role->id] ?? [],
            ];
        })->values();

        return Inertia::render('Tenant/Roles/Index', [
            'roles' => $rolesPayload,
            'permissionModules' => PermissionCatalog::matrixModules(),
        ]);
    }

    public function invitations(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');
        if (!$this->canViewInvitations($request)) {
            return $this->forbiddenPage($request, 'Invitations access denied.');
        }

        return Inertia::render('Tenant/Invitations/Index', [
            'roleOptions' => Role::query()
                ->where('tenant_id', $tenant->id)
                ->whereNotIn('name', ['owner', 'tenant_owner'])
                ->orderBy('is_system', 'desc')
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    public function whatsappSettings(Request $request, string $tenant): Response|HttpResponse
    {
        if (!(bool) config('whatsapp.enabled', false)) {
            return $this->forbiddenPage($request, 'WhatsApp module is disabled.');
        }

        if (!$this->canManageWhatsappSettings($request)) {
            return $this->forbiddenPage($request, 'WhatsApp settings access denied.');
        }

        return Inertia::render('Tenant/WhatsApp/Settings');
    }

    public function whatsappChats(Request $request, string $tenant): Response|HttpResponse
    {
        if (!(bool) config('whatsapp.enabled', false)) {
            return $this->forbiddenPage($request, 'WhatsApp module is disabled.');
        }

        if (!$this->canViewWhatsappChats($request)) {
            return $this->forbiddenPage($request, 'WhatsApp chats access denied.');
        }

        return Inertia::render('Tenant/WhatsApp/Chats');
    }

    public function upgradeRequired(Request $request, SubscriptionEntitlements $entitlements): Response
    {
        $tenant = $request->attributes->get('currentTenant');
        $module = (string) $request->query('module', '');

        return Inertia::render('Tenant/UpgradeRequired', [
            'module' => $module,
            'module_label' => $module !== '' ? $entitlements->moduleLabel($module) : 'This module',
            'plan_code' => $entitlements->normalizePlan($tenant?->plan_code),
        ]);
    }

    private function forbiddenPage(Request $request, string $message): HttpResponse
    {
        return Inertia::render('Tenant/Forbidden', [
            'message' => $message,
        ])->toResponse($request)->setStatusCode(403);
    }

    private function canViewMembers(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('team.members.view') || $user->can('tenant_members.view'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'member', 'viewer', 'operator', 'tenant_owner', 'tenant_admin', 'tenant_member', 'tenant_viewer', 'tenant_operator'], true);
    }

    private function canUpdateMembers(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('team.members.update') || $user->can('tenant_members.update'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'operator', 'tenant_owner', 'tenant_admin', 'tenant_operator'], true);
    }

    private function canViewRoles(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('team.roles.view') || $user->can('team.role_permissions.assign'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }

    private function canViewInvitations(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('team.invitations.view') || $user->can('team.invitations.update') || $user->can('team.invitations.create'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }

    private function canManageWhatsappSettings(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('whatsapp.settings.view') || $user->can('whatsapp.settings.update'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'tenant_owner'], true);
    }

    private function canViewWhatsappChats(Request $request): bool
    {
        $user = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) {
            return true;
        }

        if ($user && ($user->can('whatsapp.chats.view') || $user->can('whatsapp.chats.update'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }

    // ── Finance / Keuangan ─────────────────────────────────────────────────────

    public function finance(Request $request, string $tenant): Response|HttpResponse
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/Finance/Page', [
            'categories'     => \App\Models\SharedCategory::forTenant($tenantModel->id)
                ->forModule('finance')
                ->active()
                ->ordered()
                ->get(['id', 'name', 'sub_type', 'icon', 'color', 'is_default']),
            'currencies'     => \Illuminate\Support\Facades\Cache::remember('master_currencies_active', 3600,
                fn () => \App\Models\MasterCurrency::active()->ordered()
                    ->get(['code', 'name', 'symbol', 'symbol_position', 'decimal_places'])
            ),
            'defaultCurrency' => $tenantModel->currency_code ?? 'IDR',
            'paymentMethods' => collect(\App\Enums\PaymentMethod::cases())
                ->map(fn ($m) => ['value' => $m->value, 'label' => $m->label(), 'icon' => $m->icon()])
                ->values(),
            'permissions' => [
                'create' => $request->user()?->can('finance.create') ?? false,
                'update' => $request->user()?->can('finance.update') ?? false,
                'delete' => $request->user()?->can('finance.delete') ?? false,
            ],
        ]);
    }

    // ── Master Data ────────────────────────────────────────────────────────────

    public function masterCategories(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Categories/Index', [
            'categories' => \App\Models\SharedCategory::forTenant($tenantModel->id)
                ->with('children')
                ->roots()
                ->ordered()
                ->get(),
            'modules' => ['finance', 'grocery', 'inventory', 'task', 'medical', 'wishlist'],
            'permissions' => [
                'create' => $request->user()?->can('master.categories.create') ?? false,
                'update' => $request->user()?->can('master.categories.update') ?? false,
                'delete' => $request->user()?->can('master.categories.delete') ?? false,
            ],
        ]);
    }

    public function masterTags(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Tags/Index', [
            'tags' => \App\Models\SharedTag::forTenant($tenantModel->id)
                ->popular()
                ->get(['id', 'name', 'color', 'usage_count', 'created_at']),
            'permissions' => [
                'create' => $request->user()?->can('master.tags.create') ?? false,
                'update' => $request->user()?->can('master.tags.update') ?? false,
                'delete' => $request->user()?->can('master.tags.delete') ?? false,
            ],
        ]);
    }

    public function masterCurrencies(Request $request, string $tenant): Response
    {
        return Inertia::render('Tenant/MasterData/Currencies/Index', [
            'currencies' => \App\Models\MasterCurrency::ordered()->get(),
            'permissions' => [
                'create' => $request->user()?->can('master.currencies.create') ?? false,
                'update' => $request->user()?->can('master.currencies.update') ?? false,
                'delete' => $request->user()?->can('master.currencies.delete') ?? false,
            ],
        ]);
    }

    public function masterUom(Request $request, string $tenant): Response
    {
        return Inertia::render('Tenant/MasterData/Uom/Index', [
            'units' => \App\Models\MasterUom::active()->ordered()
                ->get(['id', 'code', 'name', 'abbreviation', 'dimension_type', 'base_unit_code', 'base_factor', 'sort_order']),
            'dimensionTypes' => ['berat', 'volume', 'jumlah', 'panjang', 'luas', 'waktu', 'lainnya'],
            'permissions' => [
                'create' => $request->user()?->can('master.uom.create') ?? false,
                'update' => $request->user()?->can('master.uom.update') ?? false,
                'delete' => $request->user()?->can('master.uom.delete') ?? false,
            ],
        ]);
    }
}
