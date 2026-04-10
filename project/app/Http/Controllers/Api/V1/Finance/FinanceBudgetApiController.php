<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\Tenant;
use App\Models\Finance\TenantBudget;
use App\Models\Tenant\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\FinanceSummaryService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class FinanceBudgetApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly MonthlyReviewService $monthlyReview,
        private readonly FinanceSummaryService $summary,
        private readonly ActivityLogService $activityLogs,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);

        $period = $request->get('period_month');

        $budgets = $this->access->accessibleBudgetsQuery($tenant, $member)
            ->when($request->boolean('active_only', true), fn ($query) => $query->active())
            ->when($period, fn ($query) => $query->forPeriod($period))
            ->orderByDesc('period_month')
            ->orderBy('name')
            ->get();

        return response()->json(['ok' => true, 'data' => ['budgets' => $budgets]]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.create'), 403);
        abort_unless($this->access->canCreatePrivateStructures($member), 403);

        $limit = $this->entitlements->limit($tenant, 'finance.budgets.active.max') ?? -1;
        if ($limit !== -1) {
            // Atomic quota check with pessimistic lock to prevent race conditions
            $activeBudgets = DB::transaction(function () use ($tenant) {
                return TenantBudget::query()
                    ->forTenant($tenant->id)
                    ->active()
                    ->lockForUpdate()
                    ->get(['id'])
                    ->count();
            });

            if ($activeBudgets >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'message' => "Batas {$limit} budget aktif tercapai. Upgrade plan untuk menambah budget.",
                ], 422);
            }
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50'],
            'budget_key' => ['nullable', 'string', 'max:120'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'period_month' => ['required', 'date_format:Y-m'],
            'allocated_amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'owner_member_id' => [
                'nullable',
                Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id),
            ],
            'wallet_id' => ['nullable', 'string', 'size:26', Rule::exists('finance_wallets', 'id')->where('tenant_id', $tenant->id)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
        ]);

        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $data['period_month'])) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        $wallet = null;
        if (! empty($data['wallet_id'])) {
            $wallet = $this->access->usablePocketsQuery($tenant, $member)
                ->whereKey($data['wallet_id'])
                ->first();

            if (! $wallet) {
                return response()->json(['ok' => false, 'message' => 'Wallet budget tidak ditemukan atau tidak bisa diakses.'], 422);
            }
        }

        if (! $this->access->isPrivileged($member)) {
            $data['owner_member_id'] = $member?->id;
        }

        $budget = TenantBudget::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'wallet_id' => $wallet?->id,
            'name' => $data['name'],
            'code' => $this->resolveBudgetCode(
                tenant: $tenant,
                providedCode: $data['code'] ?? null,
                name: $data['name'],
                periodMonth: $data['period_month'],
            ),
            'budget_key' => $this->resolveBudgetKey($data['budget_key'] ?? null, $data['code'] ?? null, $data['name']),
            'scope' => $data['scope'],
            'period_month' => $data['period_month'],
            'allocated_amount' => $data['allocated_amount'],
            'spent_amount' => 0,
            'remaining_amount' => $data['allocated_amount'],
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'row_version' => 1,
        ]);

        $this->syncAccess($budget, $tenant, $data['member_access'] ?? [], $member?->id);

        $fresh = $budget->load(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'pocket:id,name,real_account_id']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.budget.created',
            'tenant_budgets',
            $budget->id,
            null,
            $this->activityLogs->snapshot($fresh),
            ['scope' => $budget->scope, 'period_month' => $budget->period_month],
            null,
            (int) $budget->row_version,
            $member
        );

        $this->summary->invalidateTenantCaches($tenant->id);

        return response()->json([
            'ok' => true,
            'data' => ['budget' => $fresh],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, TenantBudget $budget): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.update'), 403);
        abort_if((int) $budget->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManageBudget($budget, $member), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:50'],
            'budget_key' => ['nullable', 'string', 'max:120'],
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'period_month' => ['required', 'date_format:Y-m'],
            'allocated_amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'owner_member_id' => [
                'nullable',
                Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id),
            ],
            'wallet_id' => ['nullable', 'string', 'size:26', Rule::exists('finance_wallets', 'id')->where('tenant_id', $tenant->id)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'member_access' => ['nullable', 'array'],
            'member_access.*.id' => ['required', Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id)],
            'member_access.*.can_view' => ['nullable', 'boolean'],
            'member_access.*.can_use' => ['nullable', 'boolean'],
            'member_access.*.can_manage' => ['nullable', 'boolean'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $data['period_month'])) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        if (! $this->access->isPrivileged($member)) {
            if (! $this->access->canManageBudget($budget, $member)) {
                abort(403);
            }

            if (! $this->access->canManageStructureSharing($member, $budget->owner_member_id)) {
                $data['scope'] = $budget->scope;
                $data['owner_member_id'] = $budget->owner_member_id;
                $data['member_access'] = $budget->memberAccess()
                    ->get(['tenant_members.id'])
                    ->map(fn (TenantMember $sharedMember) => [
                        'id' => $sharedMember->id,
                        'can_view' => (bool) $sharedMember->pivot?->can_view,
                        'can_use' => (bool) $sharedMember->pivot?->can_use,
                        'can_manage' => (bool) $sharedMember->pivot?->can_manage,
                    ])
                    ->all();
            } else {
                $data['owner_member_id'] = $member?->id;
            }
        }

        if ((int) $budget->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Budget diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $wallet = null;
        if (! empty($data['wallet_id'])) {
            $wallet = $this->access->usablePocketsQuery($tenant, $member)
                ->whereKey($data['wallet_id'])
                ->first();

            if (! $wallet) {
                return response()->json(['ok' => false, 'message' => 'Wallet budget tidak ditemukan atau tidak bisa diakses.'], 422);
            }
        }

        $before = $this->activityLogs->snapshot($budget->load(['memberAccess:id', 'pocket:id']));
        $beforeVersion = (int) $budget->row_version;

        $budget->update([
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'wallet_id' => $wallet?->id,
            'name' => $data['name'],
            'code' => $this->resolveBudgetCode(
                tenant: $tenant,
                providedCode: $data['code'] ?? null,
                name: $data['name'],
                periodMonth: $data['period_month'],
                currentBudgetId: $budget->id,
                existingCode: $budget->code,
            ),
            'budget_key' => $this->resolveBudgetKey($data['budget_key'] ?? null, $data['code'] ?? null, $data['name']),
            'scope' => $data['scope'],
            'period_month' => $data['period_month'],
            'allocated_amount' => $data['allocated_amount'],
            'remaining_amount' => round((float) $data['allocated_amount'] - (float) $budget->spent_amount, 2),
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? $budget->is_active,
            'row_version' => $budget->row_version + 1,
        ]);

        $this->syncAccess($budget, $tenant, $data['member_access'] ?? [], $member?->id);

        $fresh = $budget->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'pocket:id,name,real_account_id']);
        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.budget.updated',
            'tenant_budgets',
            $budget->id,
            $before,
            $this->activityLogs->snapshot($fresh),
            ['scope' => $fresh->scope, 'period_month' => $fresh->period_month],
            $beforeVersion,
            (int) $fresh->row_version,
            $member
        );

        $this->summary->invalidateTenantCaches($tenant->id);

        return response()->json([
            'ok' => true,
            'data' => ['budget' => $fresh],
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantBudget $budget): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.delete'), 403);
        abort_if((int) $budget->tenant_id !== (int) $tenant->id, 404);
        abort_unless($this->access->canManageBudget($budget, $member), 403);

        if ($budget->transactions()->exists()) {
            return response()->json([
                'ok' => false,
                'error_code' => 'BUDGET_IN_USE',
                'message' => 'Budget masih dipakai transaksi dan tidak dapat dihapus.',
            ], 422);
        }

        FinanceWallet::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($budget): void {
                $query
                    ->where('default_budget_id', $budget->id)
                    ->orWhere('default_budget_key', $budget->budget_key);
            })
            ->update([
                'default_budget_id' => null,
                'default_budget_key' => null,
                'budget_lock_enabled' => false,
            ]);

        $before = $this->activityLogs->snapshot($budget->load(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'pocket:id,name,real_account_id']));
        $beforeVersion = (int) $budget->row_version;
        $budget->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'finance.budget.deleted',
            'tenant_budgets',
            $budget->id,
            $before,
            null,
            ['scope' => $budget->scope, 'period_month' => $budget->period_month],
            $beforeVersion,
            null,
            $member
        );

        $this->summary->invalidateTenantCaches($tenant->id);

        return response()->json(['ok' => true]);
    }

    private function syncAccess(TenantBudget $budget, Tenant $tenant, array $memberAccess, ?int $actorMemberId): void
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

        if ($budget->owner_member_id) {
            $sync[(int) $budget->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
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

        $budget->memberAccess()->sync(array_intersect_key($sync, array_flip($validIds)));
    }

    private function resolveBudgetCode(
        Tenant $tenant,
        ?string $providedCode,
        string $name,
        string $periodMonth,
        ?string $currentBudgetId = null,
        ?string $existingCode = null,
    ): string {
        $providedCode = trim((string) $providedCode);
        if ($providedCode !== '') {
            return Str::upper(Str::limit($providedCode, 50, ''));
        }

        $existingCode = trim((string) $existingCode);
        if ($existingCode !== '') {
            return $existingCode;
        }

        $periodToken = str_replace('-', '', $periodMonth);
        $nameToken = Str::upper(Str::limit(Str::slug($name, ''), 18, ''));
        $base = Str::limit("BGT-{$periodToken}-{$nameToken}", 50, '');
        $candidate = $base;
        $counter = 2;

        while ($this->budgetCodeExists($tenant, $candidate, $currentBudgetId)) {
            $suffix = '-' . $counter;
            $candidate = Str::limit($base, 50 - strlen($suffix), '') . $suffix;
            $counter++;
        }

        return $candidate;
    }

    private function budgetCodeExists(Tenant $tenant, string $code, ?string $ignoreBudgetId = null): bool
    {
        return TenantBudget::withTrashed()
            ->where('tenant_id', $tenant->id)
            ->where('code', $code)
            ->when($ignoreBudgetId, fn ($query) => $query->whereKeyNot($ignoreBudgetId))
            ->exists();
    }

    private function resolveBudgetKey(?string $providedKey, ?string $code, string $name): string
    {
        $candidate = Str::of((string) ($providedKey ?: $code ?: $name))
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->value();

        return $candidate !== '' ? $candidate : 'budget';
    }
}
