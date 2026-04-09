<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Wallet\WalletCashflowService;
use App\Services\Finance\Wallet\WalletPocketService;
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
        private readonly WalletPocketService $walletPockets,
        private readonly ActivityLogService $activityLogs,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);
        $detailLevel = $request->string('detail')->toString() === WalletCashflowService::DETAIL_FULL
            ? WalletCashflowService::DETAIL_FULL
            : WalletCashflowService::DETAIL_SUMMARY;

        $pockets = $this->access->accessiblePocketsQuery($tenant, $member)
            ->when($request->boolean('active_only', true), fn ($query) => $query->active())
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key'])
            ->orderBy('scope')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
        $pockets = $this->cashflow->enrichPockets($tenant, $member, $pockets, detailLevel: $detailLevel);

        return response()->json(['ok' => true, 'data' => ['wallets' => $pockets, 'pockets' => $pockets]]);
    }

    public function show(Request $request, Tenant $tenant, FinancePocket $pocket): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);
        abort_if((int) $pocket->tenant_id !== (int) $tenant->id, 404);

        $record = $this->access->accessiblePocketsQuery($tenant, $member)
            ->whereKey($pocket->id)
            ->first();

        abort_if(! $record, 404);

        $enriched = $this->cashflow->enrichPockets(
            $tenant,
            $member,
            collect([$record]),
            detailLevel: WalletCashflowService::DETAIL_FULL,
        )->first();

        return response()->json(['ok' => true, 'data' => ['wallet' => $enriched, 'pocket' => $enriched]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);
        abort_unless($this->access->canCreatePrivateStructures($member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'string', 'max:50'],
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
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
        ]);

        try {
            $this->entitlements->assertUnderLimit(
                $tenant,
                'finance.pockets.max',
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

        if (($data['scope'] ?? 'private') === 'shared' && $account->scope !== 'shared') {
            return response()->json([
                'ok' => false,
                'error_code' => 'WALLET_SCOPE_EXCEEDS_ACCOUNT_SCOPE',
                'message' => 'Wallet shared hanya bisa dibuat di dalam account shared.',
            ], 422);
        }

        if (! $this->access->isPrivileged($member)) {
            $data['owner_member_id'] = $member?->id;
        }

        $data['type'] = Str::of((string) ($data['type'] ?? ''))
            ->trim()
            ->substr(0, 50)
            ->value();

        if ($data['type'] === '') {
            return response()->json(['ok' => false, 'message' => 'Tipe atau konteks wallet wajib diisi.'], 422);
        }

        if (($data['scope'] ?? 'private') === 'shared') {
            $data['owner_member_id'] = $account->owner_member_id;
            $data['member_access'] = [];
            if ($data['type'] === 'shared') {
                $data['type'] = WalletPocketService::DEFAULT_SHARED_TYPE;
            }
        } else {
            $data['member_access'] = [];
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

        if (($data['scope'] ?? 'private') === 'shared' && $defaultBudget && $defaultBudget->scope !== 'shared') {
            return response()->json(['ok' => false, 'message' => 'Wallet shared hanya dapat memakai budget shared.'], 422);
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

        if ($pocket->scope === 'shared') {
            $this->walletPockets->syncPocketAccessFromAccount($account, $pocket);
        } else {
            $this->syncAccess($pocket, $tenant, [], null);
        }

        $fresh = $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.wallet.created',
            'finance_pockets',
            $pocket->id,
            null,
            $this->activityLogs->snapshot($fresh),
            ['scope' => $pocket->scope, 'is_system' => (bool) $pocket->is_system],
            null,
            (int) $pocket->row_version,
            $member
        );

        return response()->json([
            'ok' => true,
            'data' => ['wallet' => $fresh, 'pocket' => $fresh],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, FinancePocket $pocket): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.update'), 403);
        abort_if((int) $pocket->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManagePocket($pocket, $member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'string', 'max:50'],
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
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ((int) $pocket->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Wallet diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $account = $pocket->realAccount()->first();
        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun sumber wallet tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (! $pocket->is_system && (string) $pocket->real_account_id !== (string) $data['real_account_id']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'POCKET_ACCOUNT_CHANGE_NOT_ALLOWED',
                'message' => 'Wallet tidak dapat dipindahkan ke akun lain. Gunakan transfer internal untuk memindahkan saldo.',
            ], 422);
        }

        if (! $this->access->isPrivileged($member)) {
            if (! $this->access->canManagePocket($pocket, $member)) {
                abort(403);
            }

            if (! $this->access->canManageStructureSharing($member, $pocket->owner_member_id)) {
                $data['scope'] = $pocket->scope;
                $data['owner_member_id'] = $pocket->owner_member_id;
                $data['member_access'] = [];
            } else {
                $data['owner_member_id'] = $member?->id;
            }
        }

        if ($pocket->is_system) {
            $data['name'] = WalletPocketService::MAIN_POCKET_NAME;
            $data['type'] = 'personal';
            $data['purpose_type'] = 'spending';
            $data['scope'] = $account->scope;
            $data['owner_member_id'] = $account->owner_member_id;
            $data['real_account_id'] = $account->id;
            $data['notes'] = $pocket->notes;
            $data['is_active'] = (bool) $account->is_active;
            $data['member_access'] = [];
        } else {
            $account = $this->access->usableAccountsQuery($tenant, $member)
                ->whereKey($data['real_account_id'])
                ->first();

            if (! $account) {
                return response()->json(['ok' => false, 'message' => 'Akun sumber wallet tidak ditemukan atau tidak bisa diakses.'], 422);
            }
        }

        if (($data['scope'] ?? 'private') === 'shared' && $account->scope !== 'shared') {
            return response()->json([
                'ok' => false,
                'error_code' => 'WALLET_SCOPE_EXCEEDS_ACCOUNT_SCOPE',
                'message' => 'Wallet shared hanya bisa dipakai di dalam account shared.',
            ], 422);
        }

        $data['type'] = Str::of((string) ($data['type'] ?? ''))
            ->trim()
            ->substr(0, 50)
            ->value();

        if ($data['type'] === '') {
            return response()->json(['ok' => false, 'message' => 'Tipe atau konteks wallet wajib diisi.'], 422);
        }

        if (($data['scope'] ?? 'private') === 'shared') {
            $data['owner_member_id'] = $account->owner_member_id;
            $data['member_access'] = [];
            if ($data['type'] === 'shared') {
                $data['type'] = WalletPocketService::DEFAULT_SHARED_TYPE;
            }
        } else {
            $data['member_access'] = [];
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

        if (($data['scope'] ?? 'private') === 'shared' && $defaultBudget && $defaultBudget->scope !== 'shared') {
            return response()->json(['ok' => false, 'message' => 'Wallet shared hanya dapat memakai budget shared.'], 422);
        }

        $before = $this->activityLogs->snapshot($pocket->load(['memberAccess:id', 'realAccount:id', 'defaultBudget:id']));
        $beforeVersion = (int) $pocket->row_version;

        $pocket->update([
            'real_account_id' => $account->id,
            'owner_member_id' => $pocket->is_system ? $account->owner_member_id : ($data['owner_member_id'] ?? null),
            'name' => $pocket->is_system ? WalletPocketService::MAIN_POCKET_NAME : $data['name'],
            'slug' => Str::slug($pocket->is_system ? WalletPocketService::MAIN_POCKET_NAME : $data['name']),
            'type' => $pocket->is_system ? 'main' : $data['type'],
            'purpose_type' => $data['purpose_type'],
            'background_color' => $data['background_color'] ?? null,
            'scope' => $pocket->is_system ? $account->scope : $data['scope'],
            'currency_code' => $account->currency_code,
            'icon_key' => $data['icon_key'] ?? null,
            'default_budget_id' => $data['purpose_type'] === 'spending' ? $defaultBudget?->id : null,
            'default_budget_key' => $data['purpose_type'] === 'spending' ? ($defaultBudget?->budget_key ?? ($data['default_budget_key'] ?? null)) : null,
            'budget_lock_enabled' => $data['purpose_type'] === 'spending' ? (bool) ($data['budget_lock_enabled'] ?? false) : false,
            'notes' => $pocket->is_system ? $pocket->notes : ($data['notes'] ?? null),
            'is_active' => $pocket->is_system ? (bool) $account->is_active : ($data['is_active'] ?? $pocket->is_active),
            'row_version' => $pocket->row_version + 1,
        ]);

        $finalScope = $pocket->is_system ? $account->scope : ($data['scope'] ?? $pocket->scope);

        if ($pocket->is_system) {
            $this->walletPockets->syncMainPocketAccessFromAccount($account);
        } elseif ($finalScope === 'shared') {
            $this->walletPockets->syncPocketAccessFromAccount($account, $pocket);
        } else {
            $this->syncAccess($pocket, $tenant, [], null);
        }

        $fresh = $pocket->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code', 'defaultBudget:id,name,period_month,pocket_id,budget_key']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.wallet.updated',
            'finance_pockets',
            $pocket->id,
            $before,
            $this->activityLogs->snapshot($fresh),
            ['scope' => $fresh->scope, 'is_system' => (bool) $fresh->is_system],
            $beforeVersion,
            (int) $fresh->row_version,
            $member
        );

        return response()->json([
            'ok' => true,
            'data' => ['wallet' => $fresh, 'pocket' => $fresh],
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, FinancePocket $pocket): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.delete'), 403);
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

        $before = $this->activityLogs->snapshot($pocket->load(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code']));
        $beforeVersion = (int) $pocket->row_version;
        $pocket->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.wallet.deleted',
            'finance_pockets',
            $pocket->id,
            $before,
            null,
            ['scope' => $pocket->scope, 'is_system' => (bool) $pocket->is_system],
            $beforeVersion,
            null,
            $member
        );

        return response()->json(['ok' => true]);
    }

    private function syncAccess(FinancePocket $pocket, Tenant $tenant, array $memberAccess, ?int $actorMemberId): void
    {
        $sync = collect($memberAccess)
            ->mapWithKeys(fn ($access) => [
                (int) $access['id'] => [
                    'can_view' => (bool) ($access['can_view'] ?? false),
                    'can_use' => (bool) ($access['can_use'] ?? false),
                    'can_manage' => (bool) ($access['can_manage'] ?? false),
                ]
            ])
            ->all();

        if ($pocket->owner_member_id) {
            $sync[(int) $pocket->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
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
