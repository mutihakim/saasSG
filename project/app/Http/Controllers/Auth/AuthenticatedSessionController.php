<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Tenant\TenantMember;
use App\Services\TurnstileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $invitationToken = request()->query('invitation_token');
        $isAdmin = request()->routeIs('tenant.admin.login');

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'turnstileSiteKey' => app(TurnstileService::class)->siteKey(),
            'turnstileEnabled' => app(TurnstileService::class)->enabled(),
            'invitationToken' => $invitationToken,
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): \Symfony\Component\HttpFoundation\Response
    {
        $request->authenticate();

        $request->session()->regenerate();

        $invitationToken = $request->string('invitation_token')->toString();
        if ($invitationToken !== '') {
            return redirect("/invitations/accept/{$invitationToken}");
        }

        $target = '/tenant-access-required';
        $user = $request->user();
        $centralDomain = parse_url(config('app.url'), PHP_URL_HOST) ?: 'sanjo.my.id';
        $protocol = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https';

        if ($user?->is_superadmin) {
            // Force Superadmin to central dashboard regardless of where they log in
            $target = config('app.url') . '/admin/dashboard';
        } else {
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
                    // Already on a tenant subdomain
                    // /admin/login → admin dashboard (free theme)
                    // /login (public) → member hub (locked horizontal theme)
                    if ($request->routeIs('tenant.admin.login') || $request->routeIs('tenant.admin.login.store')) {
                        $target = "/admin/dashboard";
                    } else {
                        $target = "/hub";
                    }
                } else {
                    // On central domain, redirect to their tenant's subdomain
                    $target = "{$protocol}://{$membership->tenant->slug}.{$matchedDomain}/admin/dashboard";
                }
            }
        }

        $url = session()->pull('url.intended', $target);
        return Inertia::location(url($url));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $host = $request->getHost();
        $referer = $request->headers->get('referer');
        
        $centralDomains = config('tenancy.central_domains', []);
        $isCentral = in_array($host, $centralDomains);

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($isCentral) {
            return Inertia::location(config('app.url'));
        }

        // On tenant subdomain
        if ($referer && str_contains(parse_url($referer, PHP_URL_PATH) ?? '', '/admin')) {
            // Logout from tenant admin dashboard -> back to tenant admin login
            return Inertia::location(url('/admin/login'));
        }

        // Logout from tenant hub/landing -> stay on tenant home
        return Inertia::location(url('/'));
    }
}
