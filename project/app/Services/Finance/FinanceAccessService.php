<?php

namespace App\Services\Finance;

use App\Models\Finance\FinanceTransaction;
use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FinanceAccessService
{
    /**
     * Invalidate the Redis-backed visibility scope cache for a given member.
     * Call this when member access to accounts/budgets/pockets changes.
     */
    public function invalidateVisibilityCache(int $tenantId, int $memberId): void
    {
        Cache::forget("finance_visibility:{$tenantId}:{$memberId}");
    }


    public function isPrivileged(?TenantMember $member): bool
    {
        return $member?->isPrivilegedFinanceActor() ?? false;
    }

    public function canCreatePrivateStructures(?TenantMember $member): bool
    {
        return $member !== null;
    }

    public function canManageSharedStructures(?TenantMember $member): bool
    {
        return $this->isPrivileged($member);
    }

    public function canManageStructureSharing(?TenantMember $member, ?int $ownerMemberId): bool
    {
        if (! $member) {
            return false;
        }

        return $this->isPrivileged($member) || (string) $member->id === (string) $ownerMemberId;
    }

    public function accessibleAccountsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        return $this->accessibleAccountsFullQuery($tenant, $member);
    }

    public function accessibleAccountsSummaryQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = TenantBankAccount::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name']);

        return $this->applyAccountVisibilityFilter($query, $member);
    }

    public function accessibleAccountsFullQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = TenantBankAccount::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name']);

        return $this->applyAccountVisibilityFilter($query, $member);
    }

    private function applyAccountVisibilityFilter(Builder $query, ?TenantMember $member): Builder
    {
        if (! $member) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('tenant_bank_account_member_access.can_view', true));
        });
    }

    public function usableAccountsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = $this->accessibleAccountsFullQuery($tenant, $member);

        if (! $member || $this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('tenant_bank_account_member_access.can_use', true));
        });
    }

    public function accessibleBudgetsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = TenantBudget::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'pocket:id,name,real_account_id']);

        if (! $member) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('tenant_budget_member_access.can_view', true));
        });
    }

    public function accessiblePocketsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        return $this->accessiblePocketsFullQuery($tenant, $member);
    }

    public function accessiblePocketsSummaryQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = FinanceWallet::query()
            ->forTenant($tenant->id)
            ->with([
                'ownerMember:id,full_name',
                'realAccount:id,name,type,currency_code',
            ]);

        return $this->applyPocketVisibilityFilter($query, $member);
    }

    public function accessiblePocketsFullQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = FinanceWallet::query()
            ->forTenant($tenant->id)
            ->with([
                'ownerMember:id,full_name',
                'memberAccess:id,full_name',
                'realAccount:id,name,type,currency_code',
                'defaultBudget:id,name,period_month,wallet_id,budget_key',
            ]);

        return $this->applyPocketVisibilityFilter($query, $member);
    }

    private function applyPocketVisibilityFilter(Builder $query, ?TenantMember $member): Builder
    {
        if (! $member) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('finance_wallet_member_access.can_view', true));
        });
    }

    public function usablePocketsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = $this->accessiblePocketsFullQuery($tenant, $member);

        if (! $member || $this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('finance_wallet_member_access.can_use', true));
        });
    }

    public function usableBudgetsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = TenantBudget::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'pocket:id,name,real_account_id']);

        if (! $member) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('tenant_budget_member_access.can_use', true));
        });
    }

    public function isBudgetWalletCrossoverValid(FinanceWallet $pocket, TenantBudget $budget): bool
    {
        // Rule: Jika Pocket adalah SHARED, maka Budget HARUS SHARED.
        // Uang bersama tidak boleh digunakan untuk budget pribadi.
        if ($pocket->scope === 'shared' && $budget->scope === 'private') {
            return false;
        }

        // Jika Pocket PRIVATE, Budget boleh PRIVATE (milik sendiri) atau SHARED (di mana member punya akses).
        // Catatan: Akses ke budget sudah divalidasi oleh query builder (usableBudgetsQuery).
        
        return true;
    }

    public function canUseAccount(TenantBankAccount $account, Tenant $tenant, ?TenantMember $member): bool
    {
        return $this->usableAccountsQuery($tenant, $member)
            ->whereKey($account->id)
            ->exists();
    }

    public function canManageAccount(TenantBankAccount $account, ?TenantMember $member): bool
    {
        if (! $member) {
            return false;
        }

        if ($this->isPrivileged($member)) {
            return true;
        }

        if ($account->scope === 'private' && (string) $account->owner_member_id === (string) $member->id) {
            return true;
        }

        return $account->memberAccess()
            ->where('tenant_members.id', $member->id)
            ->where('tenant_bank_account_member_access.can_manage', true)
            ->exists();
    }

    public function canUseBudget(TenantBudget $budget, Tenant $tenant, ?TenantMember $member): bool
    {
        return $this->usableBudgetsQuery($tenant, $member)
            ->whereKey($budget->id)
            ->exists();
    }

    public function canUsePocket(FinanceWallet $pocket, Tenant $tenant, ?TenantMember $member): bool
    {
        return $this->usablePocketsQuery($tenant, $member)
            ->whereKey($pocket->id)
            ->exists();
    }

    public function canManagePocket(FinanceWallet $pocket, ?TenantMember $member): bool
    {
        if (! $member) {
            return false;
        }

        if ($this->isPrivileged($member)) {
            return true;
        }

        if ($pocket->scope === 'private' && (string) $pocket->owner_member_id === (string) $member->id) {
            return true;
        }

        return $pocket->memberAccess()
            ->where('tenant_members.id', $member->id)
            ->where('finance_wallet_member_access.can_manage', true)
            ->exists();
    }

    public function canManageBudget(TenantBudget $budget, ?TenantMember $member): bool
    {
        if (! $member) {
            return false;
        }

        if ($this->isPrivileged($member)) {
            return true;
        }

        if ($budget->scope === 'private' && (string) $budget->owner_member_id === (string) $member->id) {
            return true;
        }

        return $budget->memberAccess()
            ->where('tenant_members.id', $member->id)
            ->where('tenant_budget_member_access.can_manage', true)
            ->exists();
    }

    public function visibleTransactionsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = FinanceTransaction::query()->forTenant($tenant->id);

        if (! $member) {
            return $query->whereRaw('1 = 0');
        }

        if ($this->isPrivileged($member)) {
            return $query;
        }

        $visibleScope = $this->resolveVisibleStructureScope($tenant, $member);

        return $query->where(function (Builder $nested) use ($member, $visibleScope) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhere('created_by', $member->id);

            if ($visibleScope['account_ids'] !== []) {
                $nested->orWhereIn('bank_account_id', $visibleScope['account_ids']);
            }

            if ($visibleScope['budget_ids'] !== []) {
                $nested->orWhereIn('budget_id', $visibleScope['budget_ids']);
            }

            if ($visibleScope['wallet_ids'] !== []) {
                $nested->orWhereIn('wallet_id', $visibleScope['wallet_ids']);
            }
        });
    }

    /**
     * @return array{account_ids: array<int, int|string>, budget_ids: array<int, int|string>, wallet_ids: array<int, int|string>}
     */
    private function resolveVisibleStructureScope(Tenant $tenant, TenantMember $member): array
    {
        $cacheKey = "finance_visibility:{$tenant->id}:{$member->id}";

        return Cache::remember($cacheKey, 600, fn () => [
            'account_ids' => $this->resolveVisibleEntityIds(
                'tenant_bank_accounts',
                'owner_member_id',
                'tenant_bank_account_member_access',
                'tenant_bank_account_id',
                $tenant,
                $member,
            ),
            'budget_ids' => $this->resolveVisibleEntityIds(
                'tenant_budgets',
                'owner_member_id',
                'tenant_budget_member_access',
                'tenant_budget_id',
                $tenant,
                $member,
            ),
            'wallet_ids' => $this->resolveVisibleEntityIds(
                'finance_wallets',
                'owner_member_id',
                'finance_wallet_member_access',
                'finance_wallet_id',
                $tenant,
                $member,
            ),
        ]);
    }

    /**
     * Resolve visible entity IDs using a single UNION query (owned + shared).
     * Reduces 2 DB round-trips per entity type to 1.
     *
     * @return array<int, int|string>
     */
    private function resolveVisibleEntityIds(
        string $entityTable,
        string $ownerColumn,
        string $pivotTable,
        string $pivotEntityColumn,
        Tenant $tenant,
        TenantMember $member,
    ): array {
        return DB::table($entityTable)
            ->where('tenant_id', $tenant->id)
            ->where($ownerColumn, $member->id)
            ->whereNull('deleted_at')
            ->select('id')
            ->union(
                DB::table($pivotTable)
                    ->join($entityTable, $entityTable . '.id', '=', $pivotTable . '.' . $pivotEntityColumn)
                    ->where($entityTable . '.tenant_id', $tenant->id)
                    ->where($pivotTable . '.member_id', $member->id)
                    ->where($pivotTable . '.can_view', true)
                    ->whereNull($entityTable . '.deleted_at')
                    ->select($entityTable . '.id')
            )
            ->pluck('id')
            ->unique()
            ->values()
            ->all();
    }


    public function resolveTransactionOwner(?TenantMember $actor, Tenant $tenant, ?int $requestedOwnerMemberId): ?TenantMember
    {
        if (! $actor) {
            return null;
        }

        if (! $requestedOwnerMemberId || ! $this->isPrivileged($actor)) {
            return $actor;
        }

        return $tenant->members()
            ->where('id', $requestedOwnerMemberId)
            ->first() ?? $actor;
    }
}
