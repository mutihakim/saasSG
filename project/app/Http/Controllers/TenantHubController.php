<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantHubController extends Controller
{
    /**
     * Get the full demo data (shared across all module pages).
     */
    private function getDemo(): array
    {
        return app(TenantHomeController::class)->getDemoData();
    }

    private function baseProps(Request $request): array
    {
        $tenant = tenant();
        $user = $request->user();
        $member = $tenant->members()->where('user_id', $user->id)->first();

        return [
            'tenantName' => $tenant->name ?? $tenant->slug,
            'tenantSlug' => $tenant->slug,
            'member' => $member,
            'demo' => $this->getDemo(),
        ];
    }

    public function index(Request $request): mixed
    {
        // Hub is the root / — redirect there
        $tenant = tenant();
        return redirect("https://{$tenant->slug}.appsah.my.id/");
    }

    public function calendar(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Calendar', $this->baseProps($request));
    }

    public function projects(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Projects', $this->baseProps($request));
    }

    public function tasks(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Tasks', $this->baseProps($request));
    }

    public function rewards(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Rewards', $this->baseProps($request));
    }

    public function wallet(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Wallet', $this->baseProps($request));
    }

    public function finance(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Finance', $this->baseProps($request));
    }

    public function kitchen(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Kitchen', $this->baseProps($request));
    }

    public function health(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Health', $this->baseProps($request));
    }

    public function assets(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Assets', $this->baseProps($request));
    }

    public function leisure(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Leisure', $this->baseProps($request));
    }

    public function games(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Games', $this->baseProps($request));
    }

    public function wa(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/WhatsApp', $this->baseProps($request));
    }

    public function gallery(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Gallery', $this->baseProps($request));
    }

    public function blog(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Blog', $this->baseProps($request));
    }

    public function files(Request $request): Response
    {
        return Inertia::render('Tenant/Frontend/Member/Files', $this->baseProps($request));
    }

    /**
     * Profile page rendered within MemberLayout (not AdminShell).
     * Accessed via /me  — stays inside the Family Hub shell.
     */
    public function memberProfile(Request $request): Response
    {
        $props = $this->baseProps($request);
        return Inertia::render('Tenant/Frontend/Member/UserProfile', [
            'tenantName'      => $props['tenantName'],
            'tenantSlug'      => $props['tenantSlug'],
            'member'          => $props['member'],
            'mustVerifyEmail' => $request->user()
                                    ->getEmailForVerification() !== null
                                    && !$request->user()->hasVerifiedEmail(),
            'status'          => session('status'),
        ]);
    }

    /**
     * Settings page rendered within MemberLayout (not AdminShell).
     * Accessed via /me/settings — stays inside the Family Hub shell.
     */
    public function memberSettings(Request $request): Response
    {
        $props = $this->baseProps($request);
        return Inertia::render('Tenant/Frontend/Member/UserSettings', [
            'tenantName' => $props['tenantName'],
            'tenantSlug' => $props['tenantSlug'],
            'member'     => $props['member'],
        ]);
    }

}
