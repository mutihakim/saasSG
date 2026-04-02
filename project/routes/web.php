<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileSecurityController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\TenantDirectoryController;
use App\Http\Controllers\Admin\TenantSubscriptionController;
use App\Http\Controllers\InvitationAcceptanceController;
use App\Http\Controllers\Api\V1\InternalWhatsappCallbackController;
use App\Http\Controllers\TenantSettingsController;
use App\Http\Controllers\ThemePreferenceController;
use App\Http\Controllers\TenantWorkspaceController;
use App\Http\Controllers\TenantHomeController;
use App\Http\Controllers\TenantHubController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'web',
    'tenant.resolve',
])->group(function () {

    // Branching Root Route: Central Landing OR Tenant Family Profile
    Route::get('/', function (\Illuminate\Http\Request $request) {
        if (in_array($request->getHost(), config('tenancy.central_domains'))) {
            return Inertia::render('Landing/OnePage/index');
        }
        return app(TenantHomeController::class)->index($request);
    })->name('home');

    Route::get('/landing', function () {
        return Inertia::render('Landing/OnePage/index');
    })->name('landing');

    // --- TENANT FAMILY HUB MEMBER PAGES (PRD Modules A-I) ---
    Route::domain('{tenant}.appsah.my.id')
        ->middleware(['auth', 'verified', 'tenant.resolve'])
        ->group(function () {
            Route::get('/hub',       [TenantHubController::class, 'index'])->name('tenant.hub');
            Route::get('/calendar',  [TenantHubController::class, 'calendar'])->name('tenant.calendar');
            Route::get('/projects',  [TenantHubController::class, 'projects'])->name('tenant.projects');
            Route::get('/tasks',     [TenantHubController::class, 'tasks'])->name('tenant.tasks');
            Route::get('/rewards',   [TenantHubController::class, 'rewards'])->name('tenant.rewards');
            Route::get('/wallet',    [TenantHubController::class, 'wallet'])->name('tenant.wallet');
            Route::get('/finance',   [TenantHubController::class, 'finance'])->name('tenant.finance');
            Route::get('/kitchen',   [TenantHubController::class, 'kitchen'])->name('tenant.kitchen');
            Route::get('/shopping',  [TenantHubController::class, 'kitchen'])->name('tenant.shopping');
            Route::get('/health',    [TenantHubController::class, 'health'])->name('tenant.health');
            Route::get('/medical',   [TenantHubController::class, 'health'])->name('tenant.medical');
            Route::get('/records',   [TenantHubController::class, 'health'])->name('tenant.records');
            Route::get('/assets',    [TenantHubController::class, 'assets'])->name('tenant.assets');
            Route::get('/inventory', [TenantHubController::class, 'assets'])->name('tenant.inventory');
            Route::get('/dimensions',[TenantHubController::class, 'assets'])->name('tenant.dimensions');
            Route::get('/leisure',   [TenantHubController::class, 'leisure'])->name('tenant.leisure');
            Route::get('/vacation',  [TenantHubController::class, 'leisure'])->name('tenant.vacation');
            Route::get('/games',     [TenantHubController::class, 'games'])->name('tenant.games');
            Route::get('/whatsapp',  [TenantHubController::class, 'wa'])->name('tenant.wa');
            Route::get('/gallery',   [TenantHubController::class, 'gallery'])->name('tenant.gallery');
            Route::get('/blog',      [TenantHubController::class, 'blog'])->name('tenant.blog');
            Route::get('/files',     [TenantHubController::class, 'files'])->name('tenant.files');

            // Member-context Profile & Settings (rendered in MemberLayout, not AdminShell)
            Route::get('/me',          [TenantHubController::class, 'memberProfile'])->name('tenant.me');
            Route::get('/me/settings', [TenantHubController::class, 'memberSettings'])->name('tenant.me.settings');
            Route::get('/me/security', [TenantHubController::class, 'memberSettings'])->name('tenant.me.security');
        });


    Route::get('/health', fn () => response()->json(['ok' => true]));

    Route::get('/test-broadcast', function() {
        event(new \App\Events\WhatsappMessageReceived(tenantId: 4));
        return 'Broadcast Sent!';
    });

    Route::get('/invitations/accept/{token}', [InvitationAcceptanceController::class, 'show'])->name('invitation.accept.page');

    // Internal API for WhatsApp
    Route::middleware('api')->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class)->prefix('/internal/v1/whatsapp')->group(function () {
        Route::get('/sessions', [InternalWhatsappCallbackController::class, 'sessions']);
        Route::post('/session-state', [InternalWhatsappCallbackController::class, 'sessionState']);
        Route::post('/messages', [InternalWhatsappCallbackController::class, 'messages']);
        Route::post('/media', [InternalWhatsappCallbackController::class, 'media']);
    });

    // Robots & Sitemap
    Route::get('/robots.txt', function () {
        return response("User-agent: *\nAllow: /\nSitemap: ".url('/sitemap.xml')."\n", 200)
            ->header('Content-Type', 'text/plain');
    });

    // Authenticated Shared Routes (Profile)
    Route::middleware('auth')->group(function () {
        Route::get('/tenants', [TenantWorkspaceController::class, 'selector'])->name('tenant.selector');
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::get('/profile/settings', [ProfileController::class, 'settings'])->name('profile.settings');
        Route::get('/profile/security', [ProfileSecurityController::class, 'index'])->name('profile.security');
        Route::post('/profile/security/mfa/enable', [ProfileSecurityController::class, 'enable'])->name('profile.security.mfa.enable');
        Route::post('/profile/security/mfa/verify', [ProfileSecurityController::class, 'verify'])->name('profile.security.mfa.verify');
        Route::delete('/profile/security/mfa', [ProfileSecurityController::class, 'disable'])->name('profile.security.mfa.disable');
        Route::post('/profile/security/passkeys', [ProfileSecurityController::class, 'passkeys'])->name('profile.security.passkeys');

        Route::put('/settings/theme', ThemePreferenceController::class)->name('settings.theme.update');
    });

    // --- TENANT MANAGEMENT AREA (Tenant Subdomains Only) ---
    Route::domain('{tenant}.appsah.my.id')->group(function () {
        Route::middleware('guest')->prefix('admin')->group(function () {
            Route::get('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])->name('tenant.admin.login');
            Route::post('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store'])->name('tenant.admin.login.store');
        });
    });

    Route::domain('{tenant}.appsah.my.id')->middleware(['auth', 'verified'])->prefix('admin')->group(function () {
        Route::get('/dashboard', [TenantWorkspaceController::class, 'dashboard'])->name('tenant.dashboard');

        // Settings redirect (index)
        Route::get('/settings', fn() => redirect()->route('tenant.settings.profile', ['tenant' => request()->route('tenant')]))->name('tenant.settings');

        // Members Management
        Route::get('/members', [TenantWorkspaceController::class, 'members'])->name('tenant.members.index');
        Route::get('/members/{member}', [TenantWorkspaceController::class, 'memberView'])->name('tenant.members.view');
        Route::get('/members/{member}/edit', [TenantWorkspaceController::class, 'memberEdit'])->name('tenant.members.edit');
        Route::get('/roles', [TenantWorkspaceController::class, 'roles'])->name('tenant.roles');
        Route::get('/invitations', [TenantWorkspaceController::class, 'invitations'])
            ->name('tenant.invitations')
            ->middleware('tenant.feature:team.invitations,view');

        // WhatsApp Management
        Route::get('/whatsapp/settings', [TenantWorkspaceController::class, 'whatsappSettings'])->name('tenant.whatsapp.settings');
        Route::get('/whatsapp/chats', [TenantWorkspaceController::class, 'whatsappChats'])->name('tenant.whatsapp.chats');

        // Workspace Settings
        Route::get('/settings/profile', [TenantSettingsController::class, 'profile'])->name('tenant.settings.profile');
        Route::patch('/settings/profile', [TenantSettingsController::class, 'updateProfile'])->name('tenant.settings.profile.update');
        Route::get('/settings/branding', [TenantSettingsController::class, 'branding'])->name('tenant.settings.branding');
        Route::patch('/settings/branding', [TenantSettingsController::class, 'updateBranding'])->name('tenant.settings.branding.update');
        Route::delete('/settings/branding/{slot}', [TenantSettingsController::class, 'removeBranding'])->name('tenant.settings.branding.remove');
        Route::get('/settings/localization', [TenantSettingsController::class, 'localization'])->name('tenant.settings.localization');
        Route::patch('/settings/localization', [TenantSettingsController::class, 'updateLocalization'])->name('tenant.settings.localization.update');
        Route::get('/settings/billing', [TenantSettingsController::class, 'billing'])->name('tenant.settings.billing');
        Route::patch('/settings/billing', [TenantSettingsController::class, 'updateBilling'])->name('tenant.settings.billing.update');
        Route::get('/upgrade-required', [TenantWorkspaceController::class, 'upgradeRequired'])->name('tenant.upgrade.required');
    });

    // --- SUPER ADMIN AREA (Central Domains Only) ---
    foreach (config('tenancy.central_domains') as $domain) {
        Route::domain($domain)->middleware(['auth', 'superadmin.only'])->prefix('/admin')->group(function () {
            Route::get('/dashboard', DashboardController::class)->name('admin.dashboard');
            Route::get('/tenants', TenantDirectoryController::class)->name('admin.tenants.index');
            Route::get('/tenants/subscriptions', [TenantSubscriptionController::class, 'index'])->name('admin.tenants.subscriptions');
            Route::patch('/tenants/{tenant}/subscription', [TenantSubscriptionController::class, 'update'])->name('admin.tenants.subscription.update');
            Route::post('/impersonations/{user}', [ImpersonationController::class, 'start'])->name('admin.impersonations.start');
            Route::delete('/impersonations', [ImpersonationController::class, 'stop'])->name('admin.impersonations.stop');
        });
    }

    require __DIR__.'/auth.php';

});
