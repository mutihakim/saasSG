<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Services\WalletCashflowService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;

class WalletPocketApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly WalletCashflowService $cashflow,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.view'), 403);

        $pockets = $this->access->accessiblePocketsQuery($tenant, $member)
            ->when($request->boolean('active_only', true), fn ($query) => $query->active())
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key'])
            ->orderBy('scope')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
        $pockets = $this->cashflow->enrichPockets($tenant, $member, $pockets);

        return response()->json(['ok' => true, 'data' => ['wallets' => $pockets, 'pockets' => $pockets]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.create'), 403);
        abort_unless($this->access->canCreatePrivateStructures($member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['personal', 'business', 'shared'])],
            'purpose_type' => ['required', Rule::in(['spending', 'saving', 'income'])],
            'background_color' => ['nullable', 'string', 'max:50'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'real_account_id' => ['required', 'string', 'size:26', Rule::exists('tenant_bank_accounts', 'id')->where('tenant_id', $tenant->id)],
            'owner_member_id' => ['nullable', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'default_budget_id' => ['nullable', 'string', 'size:26', Rule::exists('tenant_budgets', 'id')->where('tenant_id', $tenant->id)],
            'default_budget_key' => ['nullable', 'string', 'max:120'],
            'budget_lock_enabled' => ['nullable', 'boolean'],
            'icon_key' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access_ids' => ['nullable', 'array'],
            'member_access_ids.*' => [Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
        ]);

        try {
            $this->entitlements->assertUnderLimit(
                $tenant,
                'wallet.pockets.max',
                FinancePocket::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('is_system', false)
                    ->count()
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'error_code' => 'PLAN_QUOTA_EXCEEDED',
                'message' => 'Batas wallet tambahan pada plan ini sudah tercapai.',
            ], 422);
        }

        $account = $this->access->usableAccountsQuery($tenant, $member)
            ->whereKey($data['real_account_id'])
            ->first();

        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun sumber wallet tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (! $this->access->isPrivileged($member)) {
            $data['scope'] = 'private';
            $data['owner_member_id'] = $member?->id;
            $data['member_access_ids'] = [];
        }

        $defaultBudget = null;
        if (! empty($data['default_budget_id']) || ! empty($data['default_budget_key'])) {
            $defaultBudget = $this->access->usableBudgetsQuery($tenant, $member)
                ->active()
                ->when(
                    ! empty($data['default_budget_id']),
                    fn ($query) => $query->whereKey($data['default_budget_id']),
                    fn ($query) => $query->where('budget_key', $data['default_budget_key'])
                )
                ->orderByDesc('period_month')
                ->first();

            if (! $defaultBudget) {
                return response()->json(['ok' => false, 'message' => 'Budget default wallet tidak ditemukan atau tidak bisa diakses.'], 422);
            }
        }

        if (($data['budget_lock_enabled'] ?? false) && ! $defaultBudget) {
            return response()->json(['ok' => false, 'message' => 'Budget lock membutuhkan budget default yang valid.'], 422);
        }

        $pocket = FinancePocket::create([
            'tenant_id' => $tenant->id,
            'real_account_id' => $account->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'type' => $data['type'],
            'purpose_type' => $data['purpose_type'],
            'scope' => $data['scope'],
            'currency_code' => $account->currency_code,
            'background_color' => $data['background_color'] ?? null,
            'reference_code' => $this->nextReferenceCode($tenant),
            'icon_key' => $data['icon_key'] ?? null,
            'default_budget_id' => $data['purpose_type'] === 'spending' ? $defaultBudget?->id : null,
            'default_budget_key' => $data['purpose_type'] === 'spending' ? ($defaultBudget?->budget_key ?? ($data['default_budget_key'] ?? null)) : null,
            'budget_lock_enabled' => $data['purpose_type'] === 'spending' ? (bool) ($data['budget_lock_enabled'] ?? false) : false,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'row_version' => 1,
        ]);

        $this->syncAccess($pocket, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['wallet' => $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key']), 'pocket' => $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key'])],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, FinancePocket $pocket): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.update'), 403);
        abort_if((int) $pocket->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManagePocket($pocket, $member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['personal', 'business', 'shared'])],
            'purpose_type' => ['required', Rule::in(['spending', 'saving', 'income'])],
            'background_color' => ['nullable', 'string', 'max:50'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'real_account_id' => ['required', 'string', 'size:26', Rule::exists('tenant_bank_accounts', 'id')->where('tenant_id', $tenant->id)],
            'owner_member_id' => ['nullable', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'default_budget_id' => ['nullable', 'string', 'size:26', Rule::exists('tenant_budgets', 'id')->where('tenant_id', $tenant->id)],
            'default_budget_key' => ['nullable', 'string', 'max:120'],
            'budget_lock_enabled' => ['nullable', 'boolean'],
            'icon_key' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access_ids' => ['nullable', 'array'],
            'member_access_ids.*' => [Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ((int) $pocket->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Wallet diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        if ($pocket->is_system) {
            return response()->json([
                'ok' => false,
                'error_code' => 'SYSTEM_POCKET_LOCKED',
                'message' => 'Wallet utama sistem tidak dapat diubah.',
            ], 422);
        }

        if ((string) $pocket->real_account_id !== (string) $data['real_account_id']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'POCKET_ACCOUNT_CHANGE_NOT_ALLOWED',
                'message' => 'Wallet tidak dapat dipindahkan ke akun lain. Gunakan transfer internal untuk memindahkan saldo.',
            ], 422);
        }

        $account = $this->access->usableAccountsQuery($tenant, $member)
            ->whereKey($data['real_account_id'])
            ->first();

        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun sumber wallet tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (! $this->access->isPrivileged($member)) {
            $data['scope'] = 'private';
            $data['owner_member_id'] = $member?->id;
            $data['member_access_ids'] = [];
        }

        $defaultBudget = null;
        if (! empty($data['default_budget_id']) || ! empty($data['default_budget_key'])) {
            $defaultBudget = $this->access->usableBudgetsQuery($tenant, $member)
                ->active()
                ->when(
                    ! empty($data['default_budget_id']),
                    fn ($query) => $query->whereKey($data['default_budget_id']),
                    fn ($query) => $query->where('budget_key', $data['default_budget_key'])
                )
                ->orderByDesc('period_month')
                ->first();

            if (! $defaultBudget) {
                return response()->json(['ok' => false, 'message' => 'Budget default wallet tidak ditemukan atau tidak bisa diakses.'], 422);
            }
        }

        if (($data['budget_lock_enabled'] ?? false) && ! $defaultBudget) {
            return response()->json(['ok' => false, 'message' => 'Budget lock membutuhkan budget default yang valid.'], 422);
        }

        $pocket->update([
            'real_account_id' => $account->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'type' => $data['type'],
            'purpose_type' => $data['purpose_type'],
            'background_color' => $data['background_color'] ?? null,
            'scope' => $data['scope'],
            'currency_code' => $account->currency_code,
            'icon_key' => $data['icon_key'] ?? null,
            'default_budget_id' => $data['purpose_type'] === 'spending' ? $defaultBudget?->id : null,
            'default_budget_key' => $data['purpose_type'] === 'spending' ? ($defaultBudget?->budget_key ?? ($data['default_budget_key'] ?? null)) : null,
            'budget_lock_enabled' => $data['purpose_type'] === 'spending' ? (bool) ($data['budget_lock_enabled'] ?? false) : false,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? $pocket->is_active,
            'row_version' => $pocket->row_version + 1,
        ]);

        $this->syncAccess($pocket, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['wallet' => $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key']), 'pocket' => $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key'])],
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, FinancePocket $pocket): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('wallet.delete'), 403);
        abort_if((int) $pocket->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManagePocket($pocket, $member), 403);

        if ($pocket->is_system) {
            return response()->json([
                'ok' => false,
                'error_code' => 'SYSTEM_POCKET_LOCKED',
                'message' => 'Wallet utama sistem tidak dapat dihapus.',
            ], 422);
        }

        if ($pocket->transactions()->exists()) {
            return response()->json([
                'ok' => false,
                'error_code' => 'POCKET_IN_USE',
                'message' => 'Wallet masih dipakai transaksi dan tidak dapat dihapus.',
            ], 422);
        }

        $pocket->delete();

        return response()->json(['ok' => true]);
    }

    private function syncAccess(FinancePocket $pocket, Tenant $tenant, array $memberAccessIds, ?int $actorMemberId): void
    {
        $sync = collect($memberAccessIds)
            ->mapWithKeys(fn ($memberId) => [(int) $memberId => ['can_view' => true, 'can_use' => true, 'can_manage' => false]])
            ->all();

        if ($pocket->owner_member_id) {
            $sync[(int) $pocket->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
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

        $pocket->memberAccess()->sync(array_intersect_key($sync, array_flip($validIds)));
    }

    private function nextReferenceCode(Tenant $tenant): string
    {
        do {
            $reference = 'WLT-' . strtoupper(Str::random(8));
        } while (FinancePocket::query()->where('tenant_id', $tenant->id)->where('reference_code', $reference)->exists());

        return $reference;
    }
}
