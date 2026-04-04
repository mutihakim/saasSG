<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceAccountApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);

        $accounts = $this->access->accessibleAccountsQuery($tenant, $member)
            ->when($request->boolean('active_only', true), fn ($query) => $query->active())
            ->orderBy('scope')
            ->orderBy('name')
            ->get();

        return response()->json(['ok' => true, 'data' => ['accounts' => $accounts]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);
        abort_unless($this->access->canCreatePrivateStructures($member), 403);

        $limit = $this->entitlements->limit($tenant, 'finance.accounts.max') ?? -1;
        if ($limit !== -1) {
            $activeAccounts = TenantBankAccount::query()
                ->forTenant($tenant->id)
                ->active()
                ->count();

            if ($activeAccounts >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'message' => "Batas {$limit} akun aktif tercapai. Upgrade plan untuk menambah akun.",
                ], 422);
            }
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'type' => ['required', Rule::in(['cash', 'bank', 'ewallet', 'credit_card', 'paylater'])],
            'currency_code' => [
                'required',
                Rule::exists('tenant_currencies', 'code')
                    ->where('tenant_id', $tenant->id)
                    ->where('is_active', true),
            ],
            'owner_member_id' => [
                'nullable',
                Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id),
            ],
            'opening_balance' => ['nullable', 'numeric', 'min:-999999999.99', 'max:999999999.99'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access_ids' => ['nullable', 'array'],
            'member_access_ids.*' => [Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
        ]);

        if (! $this->access->isPrivileged($member)) {
            $data['scope'] = 'private';
            $data['owner_member_id'] = $member?->id;
            $data['member_access_ids'] = [];
        }

        $account = TenantBankAccount::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'scope' => $data['scope'],
            'type' => $data['type'],
            'currency_code' => $data['currency_code'],
            'opening_balance' => $data['opening_balance'] ?? 0,
            'current_balance' => $data['opening_balance'] ?? 0,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'row_version' => 1,
        ]);

        $this->syncAccess($account, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['account' => $account->load(['ownerMember:id,full_name', 'memberAccess:id,full_name'])],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, TenantBankAccount $account): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.update'), 403);
        abort_if((int) $account->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManageAccount($account, $member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'type' => ['required', Rule::in(['cash', 'bank', 'ewallet', 'credit_card', 'paylater'])],
            'currency_code' => [
                'required',
                Rule::exists('tenant_currencies', 'code')
                    ->where('tenant_id', $tenant->id)
                    ->where('is_active', true),
            ],
            'owner_member_id' => [
                'nullable',
                Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access_ids' => ['nullable', 'array'],
            'member_access_ids.*' => [Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if (! $this->access->isPrivileged($member)) {
            if ($account->scope !== 'private' || (string) $account->owner_member_id !== (string) $member?->id) {
                abort(403);
            }

            $data['scope'] = 'private';
            $data['owner_member_id'] = $member?->id;
            $data['member_access_ids'] = [];
        }

        if ((int) $account->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Akun diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $account->update([
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'scope' => $data['scope'],
            'type' => $data['type'],
            'currency_code' => $data['currency_code'],
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? $account->is_active,
            'row_version' => $account->row_version + 1,
        ]);

        $this->syncAccess($account, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['account' => $account->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name'])],
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantBankAccount $account): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.delete'), 403);
        abort_if((int) $account->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManageAccount($account, $member), 403);

        if ($account->transactions()->exists()) {
            return response()->json([
                'ok' => false,
                'error_code' => 'ACCOUNT_IN_USE',
                'message' => 'Akun masih dipakai transaksi dan tidak dapat dihapus.',
            ], 422);
        }

        $account->delete();

        return response()->json(['ok' => true]);
    }

    private function syncAccess(TenantBankAccount $account, Tenant $tenant, array $memberAccessIds, ?int $actorMemberId): void
    {
        $sync = collect($memberAccessIds)
            ->mapWithKeys(fn ($memberId) => [(int) $memberId => ['can_view' => true, 'can_use' => true, 'can_manage' => false]])
            ->all();

        if ($account->owner_member_id) {
            $sync[(int) $account->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
        }

        if ($actorMemberId) {
            $sync[(int) $actorMemberId] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
        }

        $validIds = TenantMember::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', array_keys($sync))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $account->memberAccess()->sync(array_intersect_key($sync, array_flip($validIds)));
    }
}
