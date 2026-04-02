<?php

use App\Http\Controllers\Api\MasterCategoryApiController;
use App\Http\Controllers\Api\MasterTagApiController;
use App\Http\Controllers\Api\MasterCurrencyApiController;
use App\Http\Controllers\Api\MasterUomApiController;
use App\Http\Controllers\Api\FinanceTransactionApiController;
use App\Http\Controllers\Api\V1\TenantMemberApiController;
use App\Http\Controllers\Api\V1\TenantMemberProfileApiController;
use App\Http\Controllers\Api\V1\TenantLifecycleApiController;
use App\Http\Controllers\Api\V1\TenantRoleApiController;
use App\Http\Controllers\Api\V1\TenantWhatsappApiController;
use Illuminate\Support\Facades\Route;

Route::post('/v1/invitations/accept', [TenantLifecycleApiController::class, 'invitationsAccept'])
    ->middleware('throttle:invitation.accept');

Route::prefix('v1')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::post('/tenants', [TenantLifecycleApiController::class, 'createTenant'])->middleware('throttle:tenant.mutation');

        Route::middleware(['tenant.resolve', 'tenant.access', 'permission.team'])
            ->prefix('tenants/{tenant}')
            ->group(function () {

                // ── Team Members ───────────────────────────────────────────────────────
                Route::get('/members', [TenantMemberApiController::class, 'index'])->middleware('tenant.feature:team.members,view');
                Route::post('/members', [TenantMemberApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,create', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}', [TenantMemberApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,update', 'throttle:tenant.mutation']);
                Route::delete('/members/{member}', [TenantMemberApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,delete', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}/profile', [TenantMemberProfileApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,update', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}/whatsapp-jid', [TenantMemberApiController::class, 'updateWhatsappJid'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);

                // ── Team Roles ─────────────────────────────────────────────────────────
                Route::get('/roles', [TenantRoleApiController::class, 'index'])->middleware('tenant.feature:team.roles,view');
                Route::post('/roles', [TenantRoleApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,create', 'throttle:tenant.mutation']);
                Route::patch('/roles/{role}', [TenantRoleApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,update', 'throttle:tenant.mutation']);
                Route::patch('/roles/{role}/permissions', [TenantRoleApiController::class, 'updatePermissions'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,assign', 'throttle:tenant.mutation']);
                Route::delete('/roles/{role}', [TenantRoleApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,delete', 'throttle:tenant.mutation']);

                // ── Team Invitations ───────────────────────────────────────────────────
                Route::get('/invitations', [TenantLifecycleApiController::class, 'invitationsIndex'])->middleware('tenant.feature:team.invitations,view');
                Route::post('/invitations', [TenantLifecycleApiController::class, 'invitationsStore'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,create', 'throttle:tenant.mutation']);
                Route::post('/invitations/{invitation}/revoke', [TenantLifecycleApiController::class, 'invitationsRevoke'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);
                Route::delete('/invitations/{invitation}', [TenantLifecycleApiController::class, 'invitationsRevoke'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);
                Route::post('/invitations/{invitation}/resend', [TenantLifecycleApiController::class, 'invitationsResend'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);

                // ── WhatsApp Settings ──────────────────────────────────────────────────
                Route::get('/whatsapp/session', [TenantWhatsappApiController::class, 'session'])->middleware('tenant.feature:whatsapp.settings,view');
                Route::post('/whatsapp/session/connect', [TenantWhatsappApiController::class, 'connect'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/session/disconnect', [TenantWhatsappApiController::class, 'disconnect'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/session/remove', [TenantWhatsappApiController::class, 'removeSession'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);

                // ── WhatsApp Chats ─────────────────────────────────────────────────────
                Route::get('/whatsapp/chats', [TenantWhatsappApiController::class, 'chats'])->middleware('tenant.feature:whatsapp.chats,view');
                Route::get('/whatsapp/chats/{jid}/messages', [TenantWhatsappApiController::class, 'chatMessages'])->middleware('tenant.feature:whatsapp.chats,view');
                Route::post('/whatsapp/chats/{jid}/send', [TenantWhatsappApiController::class, 'sendToChat'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.chats,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/chats/{jid}/read', [TenantWhatsappApiController::class, 'markChatRead'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.chats,update', 'throttle:tenant.mutation']);

                Route::post('/suspend', [TenantLifecycleApiController::class, 'suspendTenant'])->middleware(['superadmin.impersonation', 'throttle:tenant.mutation']);
                Route::post('/restore', [TenantLifecycleApiController::class, 'restoreTenant'])->middleware(['superadmin.impersonation', 'throttle:tenant.mutation']);

                // ── Finance ────────────────────────────────────────────────────────────
                Route::prefix('finance')->group(function () {
                    Route::get('/summary', [FinanceTransactionApiController::class, 'summary'])->middleware('tenant.feature:finance,view');
                    Route::get('/transactions/export', [FinanceTransactionApiController::class, 'export'])->middleware('tenant.feature:finance,view');
                    Route::get('/transactions', [FinanceTransactionApiController::class, 'index'])->middleware('tenant.feature:finance,view');
                    Route::post('/transactions', [FinanceTransactionApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:finance,create', 'throttle:tenant.mutation']);
                    Route::get('/transactions/{transaction}', [FinanceTransactionApiController::class, 'show'])->middleware('tenant.feature:finance,view');
                    Route::patch('/transactions/{transaction}', [FinanceTransactionApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:finance,update', 'throttle:tenant.mutation']);
                    Route::delete('/transactions', [FinanceTransactionApiController::class, 'bulkDestroy'])->middleware(['superadmin.impersonation', 'tenant.feature:finance,delete', 'throttle:tenant.mutation']);
                    Route::delete('/transactions/{transaction}', [FinanceTransactionApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:finance,delete', 'throttle:tenant.mutation']);
                });

                // ── Master Data ────────────────────────────────────────────────────────
                Route::prefix('master')->group(function () {

                    // Categories
                    Route::get('/categories', [MasterCategoryApiController::class, 'index'])->middleware('tenant.feature:master.categories,view');
                    Route::post('/categories', [MasterCategoryApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:master.categories,create', 'throttle:tenant.mutation']);
                    Route::patch('/categories/bulk-parent', [MasterCategoryApiController::class, 'bulkSetParent'])->middleware(['superadmin.impersonation', 'tenant.feature:master.categories,update', 'throttle:tenant.mutation']);
                    Route::patch('/categories/{category}', [MasterCategoryApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:master.categories,update', 'throttle:tenant.mutation']);
                    Route::delete('/categories', [MasterCategoryApiController::class, 'bulkDestroy'])->middleware(['superadmin.impersonation', 'tenant.feature:master.categories,delete', 'throttle:tenant.mutation']);
                    Route::delete('/categories/{category}', [MasterCategoryApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:master.categories,delete', 'throttle:tenant.mutation']);

                    // Tags
                    Route::get('/tags/suggest', [MasterTagApiController::class, 'suggest'])->middleware('tenant.feature:master.tags,view');
                    Route::get('/tags', [MasterTagApiController::class, 'index'])->middleware('tenant.feature:master.tags,view');
                    Route::post('/tags', [MasterTagApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:master.tags,create', 'throttle:tenant.mutation']);
                    Route::patch('/tags/{tag}', [MasterTagApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:master.tags,update', 'throttle:tenant.mutation']);
                    Route::delete('/tags/{tag}', [MasterTagApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:master.tags,delete', 'throttle:tenant.mutation']);

                    // Currencies
                    Route::get('/currencies', [MasterCurrencyApiController::class, 'index'])->middleware('tenant.feature:master.currencies,view');
                    Route::post('/currencies', [MasterCurrencyApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:master.currencies,create', 'throttle:tenant.mutation']);
                    Route::patch('/currencies/{currency}', [MasterCurrencyApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:master.currencies,update', 'throttle:tenant.mutation']);
                    Route::delete('/currencies/{currency}', [MasterCurrencyApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:master.currencies,delete', 'throttle:tenant.mutation']);

                    // Units of Measure
                    Route::get('/uom', [MasterUomApiController::class, 'index'])->middleware('tenant.feature:master.uom,view');
                    Route::post('/uom', [MasterUomApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:master.uom,create', 'throttle:tenant.mutation']);
                    Route::patch('/uom/{uom}', [MasterUomApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:master.uom,update', 'throttle:tenant.mutation']);
                    Route::delete('/uom/{uom}', [MasterUomApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:master.uom,delete', 'throttle:tenant.mutation']);
                });
            });

    });
