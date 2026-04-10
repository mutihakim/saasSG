<?php

namespace App\Http\Middleware;

use App\Models\Tenant\TenantMember;
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

                $centralDomain = parse_url(config('app.url'), PHP_URL_HOST) ?: 'sanjo.my.id';
                $protocol = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https';

                if ($user?->is_superadmin) {
                    // Force Superadmin to central dashboard
                    return redirect()->away(config('app.url') . '/admin/dashboard');
                }

                $membership = TenantMember::query()
                    ->with('tenant:id,slug')
                    ->where('user_id', $user?->id)
                    ->where('profile_status', 'active')
                    ->whereNull('deleted_at')
                    ->first();

                if ($membership?->tenant?->slug) {
                    $host = $request->getHost();
                    $centralDomains = config('tenancy.central_domains', []);
                    $matchedDomain = $centralDomain;
                    
                    foreach ($centralDomains as $cd) {
                        if (str_contains($host, $cd) && $cd !== 'localhost' && $cd !== '127.0.0.1') {
                            $matchedDomain = $cd;
                            break;
                        }
                    }
                    
                    if (str_ends_with($host, ".{$matchedDomain}") && $host !== "www.{$matchedDomain}") {
                        // Already on a tenant subdomain, if hitting login, go to admin dashboard
                        return redirect('/admin/dashboard');
                    }

                    return redirect()->away("{$protocol}://{$membership->tenant->slug}.{$matchedDomain}/admin/dashboard");
                }

                return redirect()->away(config('app.url') . '/tenant-access-required');
            }
        }

        return $next($request);
    }
}
