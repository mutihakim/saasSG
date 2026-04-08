<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Wallet\WalletCashflowService;
use App\Services\Finance\Wallet\WalletPocketService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FinanceAccountApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly WalletPocketService $pockets,
        private readonly WalletCashflowService $cashflow,
        private readonly ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        $requiredPermission = str_starts_with($request->path(), 'api/v1/tenants/') && str_contains($request->path(), '/wallet/')
            ? 'wallet.view'
            : 'finance.view';
        abort_unless($request->user()?->hasPermissionTo($requiredPermission), 403);

        $accounts = $this->access->accessibleAccountsQuery($tenant, $member)
            ->when($request->boolean('active_only', true), fn ($query) => $query->active())
            ->orderBy('scope')
            ->orderBy('name')
            ->get();
        $accounts = $this->cashflow->enrichAccounts($tenant, $member, $accounts);

        return response()->json(['ok' => true, 'data' => ['accounts' => $accounts]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        $requiredPermission = str_starts_with($request->path(), 'api/v1/tenants/') && str_contains($request->path(), '/wallet/')
            ? 'wallet.create'
            : 'finance.create';
        abort_unless($request->user()?->hasPermissionTo($requiredPermission), 403);
        abort_unless($this->access->canCreatePrivateStructures($member), 403);

        $limit = $this->entitlements->limit($tenant, 'finance.accounts.max') ?? -1;
        if ($limit !== -1) {
            // Atomic quota check with pessimistic lock to prevent race conditions
            $activeAccounts = DB::transaction(function () use ($tenant) {
                return TenantBankAccount::query()
                    ->forTenant($tenant->id)
                    ->active()
                    ->lockForUpdate()
                    ->count();
            });

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
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
        ]);

        if (! $this->access->isPrivileged($member)) {
            $data['owner_member_id'] = $member?->id;
        }

        $openingBalance = (float) ($data['opening_balance'] ?? 0);
        if (! $this->isLiabilityType($data['type']) && $openingBalance < 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Opening balance akun non-liability tidak boleh negatif.',
            ], 422);
        }

        $account = TenantBankAccount::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'scope' => $data['scope'],
            'type' => $data['type'],
            'currency_code' => $data['currency_code'],
            'opening_balance' => $openingBalance,
            'current_balance' => $openingBalance,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'row_version' => 1,
        ]);

        $this->syncAccess($account, $tenant, $data['member_access'] ?? []);
        $this->pockets->ensureMainPocket($account);
        $this->pockets->syncMainPocketAccessFromAccount($account);

        $fresh = $account->load(['ownerMember:id,full_name', 'memberAccess:id,full_name']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.account.created',
            'tenant_bank_accounts',
            $account->id,
            null,
            $this->activityLogs->snapshot($fresh),
            ['scope' => $account->scope],
            null,
            (int) $account->row_version,
            $member
        );

        return response()->json([
            'ok' => true,
            'data' => ['account' => $fresh],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, TenantBankAccount $account): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        $requiredPermission = str_starts_with($request->path(), 'api/v1/tenants/') && str_contains($request->path(), '/wallet/')
            ? 'wallet.update'
            : 'finance.update';
        abort_unless($request->user()?->hasPermissionTo($requiredPermission), 403);
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
            'opening_balance' => ['nullable', 'numeric', 'min:-999999999.99', 'max:999999999.99'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if (! $this->access->isPrivileged($member)) {
            if (! $this->access->canManageAccount($account, $member)) {
                abort(403);
            }

            if (! $this->access->canManageStructureSharing($member, $account->owner_member_id)) {
                $data['scope'] = $account->scope;
                $data['owner_member_id'] = $account->owner_member_id;
                $data['member_access'] = $account->memberAccess()
                    ->get(['tenant_members.id'])
                    ->map(fn (TenantMember $sharedMember) => [
                        'id' => $sharedMember->id,
                        'can_view' => (bool) $sharedMember->pivot?->can_view,
                        'can_use' => (bool) $sharedMember->pivot?->can_use,
                        'can_manage' => (bool) $sharedMember->pivot?->can_manage,
                    ])
                    ->all();
            }
        }

        if ((int) $account->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Akun diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        if ($account->transactions()->exists()) {
            if (($data['type'] ?? $account->type) !== $account->type) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'ACCOUNT_TYPE_LOCKED',
                    'message' => 'Tipe akun tidak dapat diubah setelah akun memiliki histori transaksi.',
                ], 422);
            }

            if (array_key_exists('currency_code', $data) && $data['currency_code'] !== $account->currency_code) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'ACCOUNT_CURRENCY_LOCKED',
                    'message' => 'Mata uang akun tidak dapat diubah setelah akun memiliki histori transaksi.',
                ], 422);
            }
        }

        $previousOpeningBalance = (float) $account->opening_balance;
        $nextOpeningBalance = array_key_exists('opening_balance', $data)
            ? (float) ($data['opening_balance'] ?? 0)
            : $previousOpeningBalance;

        if (! $this->isLiabilityType($data['type']) && $nextOpeningBalance < 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Opening balance akun non-liability tidak boleh negatif.',
            ], 422);
        }

        $before = $this->activityLogs->snapshot($account->load(['memberAccess:id']));
        $beforeVersion = (int) $account->row_version;

        $previousOwnerMemberId = $account->owner_member_id ? (int) $account->owner_member_id : null;
        $nextOwnerMemberId = array_key_exists('owner_member_id', $data) && $data['owner_member_id'] !== null
            ? (int) $data['owner_member_id']
            : null;
        $ownerChanged = (string) ($previousOwnerMemberId ?? '') !== (string) ($nextOwnerMemberId ?? '');

        $account->update([
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'scope' => $data['scope'],
            'type' => $data['type'],
            'currency_code' => $data['currency_code'],
            'opening_balance' => $nextOpeningBalance,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? $account->is_active,
            'row_version' => $account->row_version + 1,
        ]);

        $this->syncAccess(
            $account,
            $tenant,
            $data['member_access'] ?? [],
            preserveManagerMemberId: $ownerChanged && $account->scope === 'shared' ? $previousOwnerMemberId : null,
        );
        $this->pockets->ensureMainPocket($account);
        $this->pockets->applyOpeningBalanceDelta($account, round($nextOpeningBalance - $previousOpeningBalance, 2));
        $this->pockets->syncInheritedPocketsFromAccount($account->fresh(['memberAccess:id']));

        $fresh = $account->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.account.updated',
            'tenant_bank_accounts',
            $account->id,
            $before,
            $this->activityLogs->snapshot($fresh),
            [
                'scope' => $fresh->scope,
                'owner_changed' => $ownerChanged,
                'previous_owner_member_id' => $previousOwnerMemberId,
                'next_owner_member_id' => $nextOwnerMemberId,
            ],
            $beforeVersion,
            (int) $fresh->row_version,
            $member
        );

        return response()->json([
            'ok' => true,
            'data' => ['account' => $fresh],
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantBankAccount $account): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        $requiredPermission = str_starts_with($request->path(), 'api/v1/tenants/') && str_contains($request->path(), '/wallet/')
            ? 'wallet.delete'
            : 'finance.delete';
        abort_unless($request->user()?->hasPermissionTo($requiredPermission), 403);
        abort_if((int) $account->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManageAccount($account, $member), 403);

        if ($account->transactions()->exists()) {
            return response()->json([
                'ok' => false,
                'error_code' => 'ACCOUNT_IN_USE',
                'message' => 'Akun masih dipakai transaksi dan tidak dapat dihapus.',
            ], 422);
        }

        $before = $this->activityLogs->snapshot($account->load(['ownerMember:id,full_name', 'memberAccess:id,full_name']));
        $beforeVersion = (int) $account->row_version;
        $account->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.account.deleted',
            'tenant_bank_accounts',
            $account->id,
            $before,
            null,
            ['scope' => $account->scope],
            $beforeVersion,
            null,
            $member
        );

        return response()->json(['ok' => true]);
    }

    private function syncAccess(
        TenantBankAccount $account,
        Tenant $tenant,
        array $memberAccess,
        ?int $preserveManagerMemberId = null,
    ): void
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

        if ($preserveManagerMemberId) {
            $sync[(int) $preserveManagerMemberId] = [
                'can_view' => true,
                'can_use' => true,
                'can_manage' => true,
            ];
        }

        if ($account->owner_member_id) {
            $sync[(int) $account->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
        }

        $validIds = TenantMember::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', array_keys($sync))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $account->memberAccess()->sync(array_intersect_key($sync, array_flip($validIds)));
    }

    private function isLiabilityType(?string $accountType): bool
    {
        return in_array($accountType, ['credit_card', 'paylater'], true);
    }
}
