<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class WalletSavingsGoalApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.view'), 403);
        $accessiblePocketIds = $this->access->accessiblePocketsQuery($tenant, $member)->pluck('finance_pockets.id');

        $goals = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->with(['pocket:id,name,real_account_id,current_balance', 'ownerMember:id,full_name'])
            ->whereIn('pocket_id', $accessiblePocketIds)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['ok' => true, 'data' => ['goals' => $goals]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.create'), 403);

        $data = $request->validate([
            'pocket_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'name' => ['required', 'string', 'max:120'],
            'target_amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
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

        $pocket = $this->access->usablePocketsQuery($tenant, $member)->whereKey($data['pocket_id'])->first();
        if (! $pocket) {
            return response()->json(['ok' => false, 'message' => 'Wallet goal tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        $goal = FinanceSavingsGoal::create([
            'tenant_id' => $tenant->id,
            'pocket_id' => $pocket->id,
            'owner_member_id' => $member?->id,
            'name' => $data['name'],
            'target_amount' => $data['target_amount'],
            'current_amount' => $pocket->current_balance ?? 0,
            'target_date' => $data['target_date'] ?? null,
            'status' => 'active',
            'notes' => $data['notes'] ?? null,
            'row_version' => 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['goal' => $goal->fresh(['pocket:id,name,real_account_id,current_balance', 'ownerMember:id,full_name'])]], 201);
    }

    public function update(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.update'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validate([
            'pocket_id' => ['required', 'string', 'size:26', Rule::exists('finance_pockets', 'id')->where('tenant_id', $tenant->id)],
            'name' => ['required', 'string', 'max:120'],
            'target_amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'target_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'completed', 'paused'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ((int) $goal->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Savings goal diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $pocket = $this->access->usablePocketsQuery($tenant, $member)->whereKey($data['pocket_id'])->first();
        if (! $pocket) {
            return response()->json(['ok' => false, 'message' => 'Wallet goal tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        $goal->update([
            'pocket_id' => $pocket->id,
            'name' => $data['name'],
            'target_amount' => $data['target_amount'],
            'current_amount' => $pocket->current_balance ?? 0,
            'target_date' => $data['target_date'] ?? null,
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
            'row_version' => $goal->row_version + 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['goal' => $goal->fresh(['pocket:id,name,real_account_id,current_balance', 'ownerMember:id,full_name'])]]);
    }

    public function destroy(Request $request, Tenant $tenant, FinanceSavingsGoal $goal): JsonResponse
    {
        abort_unless($request->user()?->hasPermissionTo('wallet.delete'), 403);
        abort_if((int) $goal->tenant_id !== (int) $tenant->id, 404);

        $goal->delete();

        return response()->json(['ok' => true]);
    }
}
