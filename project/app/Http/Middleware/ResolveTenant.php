<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantMember;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeTenant = $request->route('tenant');

        if (!$routeTenant) {
            // Try to identify by subdomain if route parameter is missing
            $host = $request->getHost();
            $centralDomains = config('tenancy.central_domains', []);

            // Skip identification if host is exactly one of the central domains
            if (in_array($host, $centralDomains)) {
                return $next($request);
            }

            $subdomain = null;
            foreach ($centralDomains as $centralDomain) {
                if (str_ends_with($host, '.' . $centralDomain)) {
                    $subdomain = substr($host, 0, strpos($host, '.' . $centralDomain));
                    break;
                }
            }

            if ($subdomain) {
                $routeTenant = $subdomain;
            }
        }

        $tenant = $routeTenant instanceof Tenant
            ? $routeTenant
            : (app()->environment('testing')
                ? Tenant::query()->where('slug', (string) $routeTenant)->first()
                : Cache::remember("tenant.slug.{$routeTenant}", now()->addHours(1), function () use ($routeTenant) {
                    return Tenant::query()->where('slug', (string) $routeTenant)->first();
                }));

        if (!$tenant) {
            abort(404);
        }

        $request->attributes->set('currentTenant', $tenant);
        app()->instance('currentTenant', $tenant);
        app()->instance(Tenant::class, $tenant);

        // Initialize Stancl Tenancy
        tenancy()->initialize($tenant);

        URL::defaults(['tenant' => $tenant->slug]);

        // Set Spatie Permission Team ID
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        // Resolve current member context
        $user = $request->user();
        if ($user) {
            $member = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('profile_status', 'active')
                ->whereNull('deleted_at')
                ->first();
            if ($member) {
                $request->attributes->set('currentTenantMember', $member);
            }
        }

        return $next($request);
    }
}
