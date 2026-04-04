<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantMember;
use Illuminate\Database\Eloquent\Builder;

class FinanceAccessService
{
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

    public function accessibleAccountsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = TenantBankAccount::query()
            ->forTenant($tenant->id)
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name']);

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
        $query = $this->accessibleAccountsQuery($tenant, $member);

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
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name']);

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

    public function usableBudgetsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = $this->accessibleBudgetsQuery($tenant, $member);

        if (! $member || $this->isPrivileged($member)) {
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

        $accountIds = $this->accessibleAccountsQuery($tenant, $member)->pluck('tenant_bank_accounts.id');
        $budgetIds = $this->accessibleBudgetsQuery($tenant, $member)->pluck('tenant_budgets.id');

        return $query->where(function (Builder $nested) use ($member, $accountIds, $budgetIds) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhere('created_by', $member->id)
                ->orWhereIn('bank_account_id', $accountIds)
                ->orWhereIn('budget_id', $budgetIds);
        });
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
