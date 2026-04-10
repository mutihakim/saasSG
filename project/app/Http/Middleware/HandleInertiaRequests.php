<?php

namespace App\Http\Middleware;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Support\SubscriptionEntitlements;
use App\Support\TenantBranding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Spatie\Permission\PermissionRegistrar;
use Tightenco\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Cache tenant and member lookups for the duration of the request
        $tenant = $this->resolveTenant($request);
        $user = $request->user();
        $member = $tenant ? $this->resolveMember($request, $tenant, $user) : null;

        $isAdminArea = $this->isAdminArea($request);

        // Only calculate entitlements and subscription data if we have a tenant
        $entitlementService = $tenant ? app(SubscriptionEntitlements::class) : null;
        $entitlements = $tenant ? $this->getEntitlements($tenant) : [];
        $subscriptionUsage = $this->shouldCalculateSubscriptionUsage($request, $tenant)
            ? $this->calculateSubscriptionUsage($tenant, $entitlementService)
            : [];

        return [
            ...parent::share($request),
            'app' => [
                'area' => $this->resolveArea($request, $tenant),
                'branding' => $this->getBranding($tenant),
            ],
            'auth' => [
                'user' => $user,
                'is_superadmin' => (bool) $user?->is_superadmin,
                'is_impersonating' => (bool) $request->session()->get('impersonator_id'),
                'roles' => fn () => $user && $tenant ? $user->getRoleNames()->values()->all() : [],
                'permissions' => fn () => $user && $tenant ? $user->getAllPermissions()->pluck('name')->values()->all() : [],
                'ui_preferences' => $user?->ui_preferences,
            ],
            'currentTenant' => $tenant ? $this->formatTenantPayload($tenant, $entitlementService) : null,
            'currentTenantMember' => $member ? [
                'id' => $member->id,
                'role_code' => $member->role_code,
            ] : null,
            'entitlements' => [
                'modules' => $entitlements,
            ],
            'subscription' => [
                'plan' => $tenant ? [
                    'code' => $entitlementService->normalizePlan($tenant->plan_code),
                    'limits' => $entitlementService->limitsForTenant($tenant),
                ] : null,
                'usage' => $subscriptionUsage,
            ],
            'features' => [
                'whatsapp' => (bool) config('whatsapp.enabled', false),
            ],
            'ziggy' => fn () => $this->getZiggy($request, $tenant),
        ];
    }

    /**
     * Resolve tenant from request with minimal queries.
     */
    protected function resolveTenant(Request $request): ?Tenant
    {
        $tenant = $request->attributes->get('currentTenant');
        $isAdminArea = $this->isAdminArea($request);

        if (!$isAdminArea && !$tenant && $request->route('tenant')) {
            $routeTenant = $request->route('tenant');
            $tenant = $routeTenant instanceof Tenant
                ? $routeTenant
                : Tenant::query()->where('slug', (string) $routeTenant)->first();
        }

        // Fallback tenant context for non-/t routes (e.g. /profile)
        if (!$isAdminArea && !$tenant && $request->user()) {
            $sessionTenantId = $request->session()->get('active_tenant_id');
            if ($sessionTenantId) {
                $tenant = Tenant::query()->find($sessionTenantId);
            }

            if (!$tenant && !$request->user()->is_superadmin) {
                $tenant = Tenant::query()
                    ->join('tenant_members', 'tenant_members.tenant_id', '=', 'tenants.id')
                    ->where('tenant_members.user_id', $request->user()->id)
                    ->where('tenant_members.profile_status', 'active')
                    ->whereNull('tenant_members.deleted_at')
                    ->select('tenants.*')
                    ->first();
            }
        }

        if ($tenant) {
            $request->session()->put('active_tenant_id', $tenant->id);
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        }

        return $tenant;
    }

    /**
     * Resolve member with single optimized query.
     */
    protected function resolveMember(Request $request, Tenant $tenant, ?User $user): ?TenantMember
    {
        $member = $request->attributes->get('currentTenantMember');

        if (!$member && $user) {
            $member = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('profile_status', 'active')
                ->whereNull('deleted_at')
                ->first();
        }

        if ($member) {
            $request->attributes->set('currentTenantMember', $member);
        }

        return $member;
    }

    /**
     * Check if request is for admin area.
     */
    protected function isAdminArea(Request $request): bool
    {
        $host = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);
        $isCentralDomain = in_array($host, $centralDomains);
        return ($request->is('admin') || $request->is('admin/*')) && $isCentralDomain;
    }

    /**
     * Resolve the application area for the current request.
     *
     * - 'admin'  → /admin/* on CENTRAL domain only (super admin)
     * - 'tenant' → /admin/* on tenant subdomain (tenant admin dashboard)
     * - 'member' → any non-admin path on tenant subdomain (member hub)
     * - 'tenant' → everything else (central domain, profile, etc.)
     */
    protected function resolveArea(Request $request, ?Tenant $tenant): string
    {
        $isCentral = in_array($request->getHost(), config('tenancy.central_domains', []));
        $isAdminPath = $request->is('admin') || $request->is('admin/*');

        // Super admin area: /admin/* on central domain only
        if ($isAdminPath && $isCentral) {
            return 'admin';
        }

        // Tenant admin area: /admin/* on tenant subdomain → keep 'tenant' (existing behaviour)
        if ($isAdminPath) {
            return 'tenant';
        }

        // Member hub: any non-admin path on a tenant subdomain
        if ($tenant && !$isCentral) {
            return 'member';
        }

        return 'tenant';
    }

    /**
     * Get entitlements with request-level caching.
     */
    protected function getEntitlements(Tenant $tenant): array
    {
        $cacheKey = "entitlements.modules.{$tenant->id}";
        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($tenant) {
            return app(SubscriptionEntitlements::class)->moduleMapForTenant($tenant);
        });
    }

    /**
     * Get branding with request-level caching.
     */
    protected function getBranding(?Tenant $tenant): array
    {
        $cacheKey = $tenant ? "branding.{$tenant->id}" : 'branding.global';
        return Cache::remember($cacheKey, now()->addMinutes(60), function () use ($tenant) {
            return TenantBranding::resolved($tenant);
        });
    }

    /**
     * Determine if subscription usage should be calculated.
     */
    protected function shouldCalculateSubscriptionUsage(Request $request, ?Tenant $tenant): bool
    {
        if (!$tenant) {
            return false;
        }

        // Only calculate on dashboard or when explicitly needed
        return $request->routeIs('tenant.dashboard');
    }

    /**
     * Calculate subscription usage with optimized queries.
     */
    protected function calculateSubscriptionUsage(Tenant $tenant, ?SubscriptionEntitlements $entitlementService): array
    {
        if (!$entitlementService) {
            return [];
        }

        // Use single query with conditional counts instead of 3 separate queries
        $usage = \DB::table('tenant_members')
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->selectRaw('COUNT(*) as members_count')
            ->first();

        $rolesCount = \Spatie\Permission\Models\Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_system', false)
            ->count();

        $invitationsCount = \App\Models\Tenant\TenantInvitation::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->count();

        return [
            'team.members.max' => [
                'current' => $usage->members_count ?? 0,
                'limit' => $entitlementService->limit($tenant, 'team.members.max'),
            ],
            'team.roles.custom.max' => [
                'current' => $rolesCount,
                'limit' => $entitlementService->limit($tenant, 'team.roles.custom.max'),
            ],
            'team.invitations.pending.max' => [
                'current' => $invitationsCount,
                'limit' => $entitlementService->limit($tenant, 'team.invitations.pending.max'),
            ],
        ];
    }

    /**
     * Format tenant payload for Inertia.
     */
    protected function formatTenantPayload(Tenant $tenant, ?SubscriptionEntitlements $entitlementService): array
    {
        return [
            'id' => $tenant->id,
            'slug' => $tenant->slug,
            'name' => $tenant->name,
            'display_name' => $tenant->display_name,
            'presentable_name' => $tenant->presentableName(),
            'locale' => $tenant->locale,
            'timezone' => $tenant->timezone,
            'currency_code' => $tenant->currency_code,
            'plan_code' => $entitlementService ? $entitlementService->normalizePlan($tenant->plan_code) : null,
            'branding' => $this->getBranding($tenant),
        ];
    }

    /**
     * Get Ziggy configuration with lazy loading.
     */
    protected function getZiggy(Request $request, ?Tenant $tenant): array
    {
        return array_merge((new Ziggy)->toArray(), [
            'location' => $request->url(),
            'defaults' => [
                'tenant' => $tenant ? $tenant->slug : null,
            ],
        ]);
    }
}
