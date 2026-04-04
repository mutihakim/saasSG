<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantBudget;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class FinanceBudgetApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
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
            $activeBudgets = TenantBudget::query()
                ->forTenant($tenant->id)
                ->active()
                ->count();

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
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'period_month' => ['required', 'date_format:Y-m'],
            'allocated_amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'owner_member_id' => [
                'nullable',
                Rule::exists('tenant_members', 'id')->where('tenant_id', $tenant->id),
            ],
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

        $budget = TenantBudget::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'code' => $this->resolveBudgetCode(
                tenant: $tenant,
                providedCode: $data['code'] ?? null,
                name: $data['name'],
                periodMonth: $data['period_month'],
            ),
            'scope' => $data['scope'],
            'period_month' => $data['period_month'],
            'allocated_amount' => $data['allocated_amount'],
            'spent_amount' => 0,
            'remaining_amount' => $data['allocated_amount'],
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'row_version' => 1,
        ]);

        $this->syncAccess($budget, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['budget' => $budget->load(['ownerMember:id,full_name', 'memberAccess:id,full_name'])],
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
            'scope' => ['required', Rule::in(['private', 'shared'])],
            'period_month' => ['required', 'date_format:Y-m'],
            'allocated_amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
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
            if ($budget->scope !== 'private' || (string) $budget->owner_member_id !== (string) $member?->id) {
                abort(403);
            }

            $data['scope'] = 'private';
            $data['owner_member_id'] = $member?->id;
            $data['member_access_ids'] = [];
        }

        if ((int) $budget->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok' => false,
                'error_code' => 'VERSION_CONFLICT',
                'message' => 'Budget diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $budget->update([
            'owner_member_id' => $data['owner_member_id'] ?? null,
            'name' => $data['name'],
            'code' => $this->resolveBudgetCode(
                tenant: $tenant,
                providedCode: $data['code'] ?? null,
                name: $data['name'],
                periodMonth: $data['period_month'],
                currentBudgetId: $budget->id,
                existingCode: $budget->code,
            ),
            'scope' => $data['scope'],
            'period_month' => $data['period_month'],
            'allocated_amount' => $data['allocated_amount'],
            'remaining_amount' => round((float) $data['allocated_amount'] - (float) $budget->spent_amount, 2),
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? $budget->is_active,
            'row_version' => $budget->row_version + 1,
        ]);

        $this->syncAccess($budget, $tenant, $data['member_access_ids'] ?? [], $member?->id);

        return response()->json([
            'ok' => true,
            'data' => ['budget' => $budget->fresh(['ownerMember:id,full_name', 'memberAccess:id,full_name'])],
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

        $budget->delete();

        return response()->json(['ok' => true]);
    }

    private function syncAccess(TenantBudget $budget, Tenant $tenant, array $memberAccessIds, ?int $actorMemberId): void
    {
        $sync = collect($memberAccessIds)
            ->mapWithKeys(fn ($memberId) => [(int) $memberId => ['can_view' => true, 'can_use' => true, 'can_manage' => false]])
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
}
