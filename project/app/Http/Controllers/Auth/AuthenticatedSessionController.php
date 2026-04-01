<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\TenantMember;
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

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'turnstileSiteKey' => app(TurnstileService::class)->siteKey(),
            'turnstileEnabled' => app(TurnstileService::class)->enabled(),
            'invitationToken' => $invitationToken,
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

        if ($user?->is_superadmin) {
            $target = '/admin/dashboard';
        } else {
            $membership = TenantMember::query()
                ->with('tenant:id,slug')
                ->where('user_id', $user?->id)
                ->where('profile_status', 'active')
                ->whereNull('deleted_at')
                ->first();

            if ($membership?->tenant?->slug) {
                $centralDomain = 'appsah.my.id';
                $host = $request->getHost();
                $centralDomains = config('tenancy.central_domains', []);
                foreach ($centralDomains as $cd) {
                    if (str_contains($host, $cd)) {
                        $centralDomain = $cd;
                        break;
                    }
                }
                $target = "https://{$membership->tenant->slug}.{$centralDomain}/admin/dashboard";
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
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location(config('app.url'));
    }
}
