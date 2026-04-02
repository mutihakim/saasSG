<?php

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
                Route::get('/members', [TenantMemberApiController::class, 'index'])->middleware('tenant.feature:team.members,view');
                Route::post('/members', [TenantMemberApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,create', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}', [TenantMemberApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,update', 'throttle:tenant.mutation']);
                Route::delete('/members/{member}', [TenantMemberApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,delete', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}/profile', [TenantMemberProfileApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.members,update', 'throttle:tenant.mutation']);
                Route::patch('/members/{member}/whatsapp-jid', [TenantMemberApiController::class, 'updateWhatsappJid'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);

                Route::get('/roles', [TenantRoleApiController::class, 'index'])->middleware('tenant.feature:team.roles,view');
                Route::post('/roles', [TenantRoleApiController::class, 'store'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,create', 'throttle:tenant.mutation']);
                Route::patch('/roles/{role}', [TenantRoleApiController::class, 'update'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,update', 'throttle:tenant.mutation']);
                Route::patch('/roles/{role}/permissions', [TenantRoleApiController::class, 'updatePermissions'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,assign', 'throttle:tenant.mutation']);
                Route::delete('/roles/{role}', [TenantRoleApiController::class, 'destroy'])->middleware(['superadmin.impersonation', 'tenant.feature:team.roles,delete', 'throttle:tenant.mutation']);

                Route::get('/invitations', [TenantLifecycleApiController::class, 'invitationsIndex'])->middleware('tenant.feature:team.invitations,view');
                Route::post('/invitations', [TenantLifecycleApiController::class, 'invitationsStore'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,create', 'throttle:tenant.mutation']);
                Route::post('/invitations/{invitation}/revoke', [TenantLifecycleApiController::class, 'invitationsRevoke'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);
                Route::delete('/invitations/{invitation}', [TenantLifecycleApiController::class, 'invitationsRevoke'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);
                Route::post('/invitations/{invitation}/resend', [TenantLifecycleApiController::class, 'invitationsResend'])->middleware(['superadmin.impersonation', 'tenant.feature:team.invitations,update', 'throttle:tenant.mutation']);

                Route::get('/whatsapp/session', [TenantWhatsappApiController::class, 'session'])->middleware('tenant.feature:whatsapp.settings,view');
                Route::post('/whatsapp/session/connect', [TenantWhatsappApiController::class, 'connect'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/session/disconnect', [TenantWhatsappApiController::class, 'disconnect'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/session/remove', [TenantWhatsappApiController::class, 'removeSession'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.settings,update', 'throttle:tenant.mutation']);

                Route::get('/whatsapp/chats', [TenantWhatsappApiController::class, 'chats'])->middleware('tenant.feature:whatsapp.chats,view');
                Route::get('/whatsapp/chats/{jid}/messages', [TenantWhatsappApiController::class, 'chatMessages'])->middleware('tenant.feature:whatsapp.chats,view');
                Route::post('/whatsapp/chats/{jid}/send', [TenantWhatsappApiController::class, 'sendToChat'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.chats,update', 'throttle:tenant.mutation']);
                Route::post('/whatsapp/chats/{jid}/read', [TenantWhatsappApiController::class, 'markChatRead'])->middleware(['superadmin.impersonation', 'tenant.feature:whatsapp.chats,update', 'throttle:tenant.mutation']);

                Route::post('/suspend', [TenantLifecycleApiController::class, 'suspendTenant'])->middleware(['superadmin.impersonation', 'throttle:tenant.mutation']);
                Route::post('/restore', [TenantLifecycleApiController::class, 'restoreTenant'])->middleware(['superadmin.impersonation', 'throttle:tenant.mutation']);

                // ── Finance ────────────────────────────────────────────────────────
                Route::prefix('finance')->group(function () {
                    Route::get('/summary', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'summary']);
                    Route::get('/categories', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'categories']);
                    Route::post('/categories', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'storeCategory'])->middleware('throttle:tenant.mutation');
                    Route::patch('/categories/{category}', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'updateCategory'])->middleware('throttle:tenant.mutation');
                    Route::delete('/categories/{category}', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'destroyCategory'])->middleware('throttle:tenant.mutation');
                    Route::get('/tags/suggest', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'suggestTags']);
                    Route::get('/transactions/export', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'export']);
                    Route::get('/transactions', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'index']);
                    Route::post('/transactions', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'store'])->middleware('throttle:tenant.mutation');
                    Route::get('/transactions/{transaction}', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'show']);
                    Route::patch('/transactions/{transaction}', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'update'])->middleware('throttle:tenant.mutation');
                    Route::delete('/transactions', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'bulkDestroy'])->middleware('throttle:tenant.mutation');
                    Route::delete('/transactions/{transaction}', [\App\Http\Controllers\Api\FinanceTransactionApiController::class, 'destroy'])->middleware('throttle:tenant.mutation');
                });

                // ── Master Data ────────────────────────────────────────────────────
                Route::prefix('master')->group(function () {
                    Route::get('/currencies', [\App\Http\Controllers\Api\MasterCurrencyApiController::class, 'index']);
                    Route::post('/currencies', [\App\Http\Controllers\Api\MasterCurrencyApiController::class, 'store'])->middleware('throttle:tenant.mutation');
                    Route::patch('/currencies/{currency}', [\App\Http\Controllers\Api\MasterCurrencyApiController::class, 'update'])->middleware('throttle:tenant.mutation');
                    Route::delete('/currencies/{currency}', [\App\Http\Controllers\Api\MasterCurrencyApiController::class, 'destroy'])->middleware('throttle:tenant.mutation');

                    Route::get('/uom', [\App\Http\Controllers\Api\MasterUomApiController::class, 'index']);
                    Route::post('/uom', [\App\Http\Controllers\Api\MasterUomApiController::class, 'store'])->middleware('throttle:tenant.mutation');
                    Route::patch('/uom/{uom}', [\App\Http\Controllers\Api\MasterUomApiController::class, 'update'])->middleware('throttle:tenant.mutation');
                    Route::delete('/uom/{uom}', [\App\Http\Controllers\Api\MasterUomApiController::class, 'destroy'])->middleware('throttle:tenant.mutation');
                });
            });

    });
