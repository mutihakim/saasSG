<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\WalletWish;
use App\Services\FinanceAccessService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class WalletWishApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        abort_unless($request->user()?->hasPermissionTo('wallet.view'), 403);

        $wishes = WalletWish::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])
            ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 when status = 'converted' then 2 else 3 end")
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['ok' => true, 'data' => ['wishes' => $wishes]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.create'), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'description' => ['nullable', 'string', 'max:3000'],
            'estimated_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $this->entitlements->assertUnderLimit(
                $tenant,
                'wallet.wishes.max',
                WalletWish::query()->where('tenant_id', $tenant->id)->count()
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'error_code' => 'PLAN_QUOTA_EXCEEDED',
                'message' => 'Batas wish pada plan ini sudah tercapai.',
            ], 422);
        }

        $wish = WalletWish::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $member?->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'estimated_amount' => $data['estimated_amount'] ?? null,
            'priority' => $data['priority'],
            'status' => 'pending',
            'image_url' => $data['image_url'] ?? null,
            'notes' => $data['notes'] ?? null,
            'row_version' => 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['wish' => $wish->fresh(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])]], 201);
    }

    public function update(Request $request, Tenant $tenant, WalletWish $wish): JsonResponse
    {
        abort_unless($request->user()?->hasPermissionTo('wallet.update'), 403);
        abort_if((int) $wish->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'description' => ['nullable', 'string', 'max:3000'],
            'estimated_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'image_url' => ['nullable', 'url', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ((int) $wish->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Wish diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $wish->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'estimated_amount' => $data['estimated_amount'] ?? null,
            'priority' => $data['priority'],
            'image_url' => $data['image_url'] ?? null,
            'notes' => $data['notes'] ?? null,
            'row_version' => $wish->row_version + 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['wish' => $wish->fresh(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])]]);
    }

    public function destroy(Request $request, Tenant $tenant, WalletWish $wish): JsonResponse
    {
        abort_unless($request->user()?->hasPermissionTo('wallet.delete'), 403);
        abort_if((int) $wish->tenant_id !== (int) $tenant->id, 404);

        $wish->delete();

        return response()->json(['ok' => true]);
    }

    public function approve(Request $request, Tenant $tenant, WalletWish $wish): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.update'), 403);
        abort_if((int) $wish->tenant_id !== (int) $tenant->id, 404);

        $wish->update([
            'status' => 'approved',
            'approved_at' => now()->utc(),
            'approved_by_member_id' => $member?->id,
            'row_version' => $wish->row_version + 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['wish' => $wish->fresh(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])]]);
    }

    public function reject(Request $request, Tenant $tenant, WalletWish $wish): JsonResponse
    {
        abort_unless($request->user()?->hasPermissionTo('wallet.update'), 403);
        abort_if((int) $wish->tenant_id !== (int) $tenant->id, 404);

        $wish->update([
            'status' => 'rejected',
            'row_version' => $wish->row_version + 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['wish' => $wish->fresh(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])]]);
    }

    public function convert(Request $request, Tenant $tenant, WalletWish $wish): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.create'), 403);
        abort_if((int) $wish->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validate([
            'wallet_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'target_amount' => ['nullable', 'numeric', 'min:0.01', 'max:999999999.99'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $this->entitlements->assertUnderLimit(
                $tenant,
                'wallet.goals.max',
                FinanceSavingsGoal::query()->where('tenant_id', $tenant->id)->count()
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'error_code' => 'PLAN_QUOTA_EXCEEDED',
                'message' => 'Batas savings goal pada plan ini sudah tercapai.',
            ], 422);
        }

        /** @var FinancePocket|null $wallet */
        $wallet = $this->access->usablePocketsQuery($tenant, $member)->whereKey($data['wallet_id'])->first();
        if (! $wallet) {
            return response()->json(['ok' => false, 'message' => 'Wallet tujuan tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        $goal = FinanceSavingsGoal::create([
            'tenant_id' => $tenant->id,
            'pocket_id' => $wallet->id,
            'owner_member_id' => $member?->id ?: $wish->owner_member_id,
            'name' => $wish->title,
            'target_amount' => $data['target_amount'] ?? $wish->estimated_amount ?? 0.01,
            'current_amount' => $wallet->current_balance ?? 0,
            'target_date' => $data['target_date'] ?? null,
            'status' => 'active',
            'notes' => $data['notes'] ?? $wish->notes,
            'row_version' => 1,
        ]);

        $wish->update([
            'goal_id' => $goal->id,
            'status' => 'converted',
            'approved_at' => $wish->approved_at ?: now()->utc(),
            'approved_by_member_id' => $wish->approved_by_member_id ?: $member?->id,
            'row_version' => $wish->row_version + 1,
        ]);

        return response()->json([
            'ok' => true,
            'data' => [
                'wish' => $wish->fresh(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id']),
                'goal' => $goal->fresh(['pocket:id,name,real_account_id,current_balance', 'ownerMember:id,full_name']),
            ],
        ]);
    }
}
