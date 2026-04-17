<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileSecurityController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\TenantDirectoryController;
use App\Http\Controllers\Admin\TenantSubscriptionController;
use App\Http\Controllers\InvitationAcceptanceController;
use App\Http\Controllers\Api\V1\Whatsapp\InternalWhatsappCallbackController;
use App\Http\Controllers\TenantSettingsController;
use App\Http\Controllers\TenantWorkspaceController;
use App\Http\Controllers\ThemePreferenceController;
use App\Http\Controllers\TenantHomeController;
use App\Http\Controllers\TenantHubController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
// ── Tenant Controllers ──────────────────────────────────────────────────────
use App\Http\Controllers\Tenant\TenantDashboardController;
use App\Http\Controllers\Tenant\TenantFinanceController;
use App\Http\Controllers\Tenant\TenantWalletController;
use App\Http\Controllers\Tenant\TenantMemberController;
use App\Http\Controllers\Tenant\TenantRoleController;
use App\Http\Controllers\Tenant\TenantInvitationController;
use App\Http\Controllers\Tenant\TenantWhatsappSettingController;
use App\Http\Controllers\Tenant\TenantWhatsappChatController;
// ── Master Data Controllers ─────────────────────────────────────────────────
use App\Http\Controllers\Tenant\Master\TenantMasterCategoryController;
use App\Http\Controllers\Tenant\Master\TenantMasterTagController;
use App\Http\Controllers\Tenant\Master\TenantMasterCurrencyController;
use App\Http\Controllers\Tenant\Master\TenantMasterUomController;
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

    Route::get('/manifest.webmanifest', function (\Illuminate\Http\Request $request) {
        $tenant = $request->attributes->get('currentTenant');
        $tenantName = trim((string) (
            $tenant?->presentable_name
            ?? $tenant?->display_name
            ?? $tenant?->name
            ?? config('app.name', 'Family Hub')
        ));

        $name = $tenantName !== '' ? $tenantName : config('app.name', 'Family Hub');
        $shortName = \Illuminate\Support\Str::limit($name, 12, '');

        return response()->json([
            'id' => '/',
            'name' => $name,
            'short_name' => $shortName !== '' ? $shortName : 'Family Hub',
            'description' => 'Aplikasi keluarga untuk finance, aktivitas, dan hub WhatsApp.',
            'start_url' => '/hub',
            'scope' => '/',
            'display' => 'standalone',
            'background_color' => '#f6f8fb',
            'theme_color' => '#0dcaf0',
            'icons' => [
                [
                    'src' => '/icons/pwa-192.png',
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any maskable',
                ],
                [
                    'src' => '/icons/pwa-512.png',
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any maskable',
                ],
            ],
        ])->header('Content-Type', 'application/manifest+json');
    })->name('tenant.pwa.manifest');

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
    Route::domain('{tenant}.sanjo.my.id')
        ->middleware(['auth', 'verified', 'tenant.resolve'])
        ->group(function () {
            Route::get('/hub',       [TenantHubController::class, 'hub'])->name('tenant.hub');
            Route::get('/calendar',  [TenantHubController::class, 'calendar'])->name('tenant.calendar');
            Route::get('/projects',  [TenantHubController::class, 'projects'])->name('tenant.projects');
            Route::get('/tasks',     [TenantHubController::class, 'tasks'])->name('tenant.tasks');
            Route::get('/rewards',   [TenantHubController::class, 'rewards'])->name('tenant.rewards');
            Route::get('/finance',   [TenantFinanceController::class, 'index'])
                ->name('tenant.finance')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/home', [TenantWalletController::class, 'home'])
                ->name('tenant.finance.home')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/accounts', [TenantWalletController::class, 'accounts'])
                ->name('tenant.finance.accounts')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/planning', [TenantWalletController::class, 'planning'])
                ->name('tenant.finance.planning')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/review', [TenantWalletController::class, 'review'])
                ->name('tenant.finance.review')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/transactions', [TenantFinanceController::class, 'transactions'])
                ->name('tenant.finance.transactions')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/reports', [TenantFinanceController::class, 'reports'])
                ->name('tenant.finance.reports')
                ->middleware('tenant.feature:finance,view');
            Route::get('/finance/budgets', [TenantFinanceController::class, 'budgets'])
                ->name('tenant.finance.budgets')
                ->middleware('tenant.feature:finance,view');
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
            Route::get('/games/math', [TenantHubController::class, 'gamesMath'])->name('tenant.games.math')->middleware('tenant.feature:games.math,view');
            Route::get('/games/math/mastered', [TenantHubController::class, 'gamesMathMastered'])->name('tenant.games.math.mastered')->middleware('tenant.feature:games.math,view');
            Route::get('/games/math/history', [TenantHubController::class, 'gamesMathHistory'])->name('tenant.games.math.history')->middleware('tenant.feature:games.math,view');
            Route::get('/games/math/settings', [TenantHubController::class, 'gamesMathSettings'])->name('tenant.games.math.settings')->middleware('tenant.feature:games.math,view');
            Route::get('/games/vocabulary', [TenantHubController::class, 'gamesVocabulary'])->name('tenant.games.vocabulary')->middleware('tenant.feature:games.vocabulary,view');
            Route::get('/games/vocabulary/mastered', [TenantHubController::class, 'gamesVocabularyMastered'])->name('tenant.games.vocabulary.mastered')->middleware('tenant.feature:games.vocabulary,view');
            Route::get('/games/vocabulary/history', [TenantHubController::class, 'gamesVocabularyHistory'])->name('tenant.games.vocabulary.history')->middleware('tenant.feature:games.vocabulary,view');
            Route::get('/games/vocabulary/settings', [TenantHubController::class, 'gamesVocabularySettings'])->name('tenant.games.vocabulary.settings')->middleware('tenant.feature:games.vocabulary,view');
            Route::get('/games/tahfiz', [TenantHubController::class, 'gamesTahfiz'])->name('tenant.games.tahfiz');
            Route::get('/games/tahfiz/reading', [TenantHubController::class, 'gamesTahfizReading'])->name('tenant.games.tahfiz.reading');
            Route::get('/games/tahfiz/murojaah', [TenantHubController::class, 'gamesTahfizMurojaah'])->name('tenant.games.tahfiz.murojaah');
            Route::get('/games/tahfiz/history', [TenantHubController::class, 'gamesTahfizHistory'])->name('tenant.games.tahfiz.history');
            Route::get('/games/tahfiz/settings', [TenantHubController::class, 'gamesTahfizSettings'])->name('tenant.games.tahfiz.settings');
            Route::get('/games/curriculum', [TenantHubController::class, 'gamesCurriculum'])->name('tenant.games.curriculum')->middleware('tenant.feature:games.curriculum,view');
            Route::get('/games/curriculum/history', [TenantHubController::class, 'gamesCurriculumHistory'])->name('tenant.games.curriculum.history')->middleware('tenant.feature:games.curriculum,view');
            Route::get('/games/curriculum/settings', [TenantHubController::class, 'gamesCurriculumSettings'])->name('tenant.games.curriculum.settings')->middleware('tenant.feature:games.curriculum,view');
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
    Route::domain('{tenant}.sanjo.my.id')->group(function () {
        Route::middleware('guest')->prefix('admin')->group(function () {
            Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('tenant.admin.login');
            Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('tenant.admin.login.store');
        });
    });

    Route::domain('{tenant}.sanjo.my.id')->middleware(['auth', 'verified'])->group(function () {
        Route::prefix('admin')->group(function () {
            Route::get('/dashboard', [TenantDashboardController::class, 'index'])->name('tenant.dashboard');

            // Settings redirect (index)
            Route::get('/settings', fn() => redirect()->route('tenant.settings.profile', ['tenant' => request()->route('tenant')]))->name('tenant.settings');

            // Members Management
            Route::get('/members', [TenantMemberController::class, 'index'])->name('tenant.members.index');
            Route::get('/members/{member}', [TenantMemberController::class, 'show'])->name('tenant.members.view');
            Route::get('/members/{member}/edit', [TenantMemberController::class, 'edit'])->name('tenant.members.edit');

            // Roles
            Route::get('/roles', [TenantRoleController::class, 'index'])->name('tenant.roles');

            // Invitations
            Route::get('/invitations', [TenantInvitationController::class, 'index'])
                ->name('tenant.invitations')
                ->middleware('tenant.feature:team.invitations,view');

            // WhatsApp Management
            Route::get('/whatsapp/settings', [TenantWhatsappSettingController::class, 'index'])->name('tenant.whatsapp.settings');
            Route::get('/whatsapp/chats', [TenantWhatsappChatController::class, 'index'])->name('tenant.whatsapp.chats');

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

            // ── Master Data ────────────────────────────────────────────────────────
            Route::prefix('master')->name('tenant.master.')->group(function () {
                Route::get('/categories', [TenantMasterCategoryController::class, 'index'])->name('categories');
                Route::get('/tags',       [TenantMasterTagController::class, 'index'])->name('tags');
                Route::get('/currencies', [TenantMasterCurrencyController::class, 'index'])->name('currencies');
                Route::get('/uom',        [TenantMasterUomController::class, 'index'])->name('uom');
            });
        }); // End prefix('admin')
        

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
