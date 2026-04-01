<?php

namespace App\Http\Middleware;

use App\Models\TenantMember;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();

                if ($user?->is_superadmin) {
                    return redirect('/tenants');
                }

                $membership = TenantMember::query()
                    ->with('tenant:id,slug')
                    ->where('user_id', $user?->id)
                    ->where('profile_status', 'active')
                    ->whereNull('deleted_at')
                    ->first();

                if ($membership?->tenant?->slug) {
                    $centralDomain = 'appsah.my.id'; // Default central domain
                    $host = $request->getHost();
                    $centralDomains = config('tenancy.central_domains', []);
                    
                    // Identify which central domain we are on
                    foreach ($centralDomains as $cd) {
                        if (str_contains($host, $cd)) {
                            $centralDomain = $cd;
                            break;
                        }
                    }
                    
                    return redirect()->away("https://{$membership->tenant->slug}.{$centralDomain}/admin/dashboard");
                }

                return redirect('/tenant-access-required');
            }
        }

        return $next($request);
    }
}
