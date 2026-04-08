<?php

namespace App\Services\Finance;

use App\Models\FinanceTransaction;
use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantMember;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

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

    public function canManageStructureSharing(?TenantMember $member, ?int $ownerMemberId): bool
    {
        if (! $member) {
            return false;
        }

        return $this->isPrivileged($member) || (string) $member->id === (string) $ownerMemberId;
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
        $query = FinancePocket::query()
            ->forTenant($tenant->id)
            ->with([
                'ownerMember:id,full_name',
                'memberAccess:id,full_name',
                'realAccount:id,name,type,currency_code',
                'defaultBudget:id,name,period_month,pocket_id,budget_key',
            ]);

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
                    ->where('finance_pocket_member_access.can_view', true));
        });
    }

    public function usablePocketsQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = $this->accessiblePocketsQuery($tenant, $member);

        if (! $member || $this->isPrivileged($member)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhereHas('memberAccess', fn (Builder $access) => $access
                    ->where('tenant_members.id', $member->id)
                    ->where('finance_pocket_member_access.can_use', true));
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

    public function canUsePocket(FinancePocket $pocket, Tenant $tenant, ?TenantMember $member): bool
    {
        return $this->usablePocketsQuery($tenant, $member)
            ->whereKey($pocket->id)
            ->exists();
    }

    public function canManagePocket(FinancePocket $pocket, ?TenantMember $member): bool
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
            ->where('finance_pocket_member_access.can_manage', true)
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

        return $query->where(function (Builder $nested) use ($tenant, $member) {
            $nested
                ->where('owner_member_id', $member->id)
                ->orWhere('created_by', $member->id)
                ->orWhereExists(function ($accountAccess) use ($tenant, $member) {
                    $accountAccess
                        ->select(DB::raw(1))
                        ->from('tenant_bank_accounts')
                        ->leftJoin('tenant_bank_account_member_access', 'tenant_bank_account_member_access.tenant_bank_account_id', '=', 'tenant_bank_accounts.id')
                        ->whereColumn('tenant_bank_accounts.id', 'finance_transactions.bank_account_id')
                        ->where('tenant_bank_accounts.tenant_id', $tenant->id)
                        ->where(function ($scopedAccount) use ($member) {
                            $scopedAccount
                                ->where('tenant_bank_accounts.owner_member_id', $member->id)
                                ->orWhere(function ($sharedAccess) use ($member) {
                                    $sharedAccess
                                        ->where('tenant_bank_account_member_access.member_id', $member->id)
                                        ->where('tenant_bank_account_member_access.can_view', true);
                                });
                        });
                })
                ->orWhereExists(function ($budgetAccess) use ($tenant, $member) {
                    $budgetAccess
                        ->select(DB::raw(1))
                        ->from('tenant_budgets')
                        ->leftJoin('tenant_budget_member_access', 'tenant_budget_member_access.tenant_budget_id', '=', 'tenant_budgets.id')
                        ->whereColumn('tenant_budgets.id', 'finance_transactions.budget_id')
                        ->where('tenant_budgets.tenant_id', $tenant->id)
                        ->where(function ($scopedBudget) use ($member) {
                            $scopedBudget
                                ->where('tenant_budgets.owner_member_id', $member->id)
                                ->orWhere(function ($sharedAccess) use ($member) {
                                    $sharedAccess
                                        ->where('tenant_budget_member_access.member_id', $member->id)
                                        ->where('tenant_budget_member_access.can_view', true);
                                });
                        });
                })
                ->orWhereExists(function ($pocketAccess) use ($tenant, $member) {
                    $pocketAccess
                        ->select(DB::raw(1))
                        ->from('finance_pockets')
                        ->leftJoin('finance_pocket_member_access', 'finance_pocket_member_access.finance_pocket_id', '=', 'finance_pockets.id')
                        ->whereColumn('finance_pockets.id', 'finance_transactions.pocket_id')
                        ->where('finance_pockets.tenant_id', $tenant->id)
                        ->where(function ($scopedPocket) use ($member) {
                            $scopedPocket
                                ->where('finance_pockets.owner_member_id', $member->id)
                                ->orWhere(function ($sharedAccess) use ($member) {
                                    $sharedAccess
                                        ->where('finance_pocket_member_access.member_id', $member->id)
                                        ->where('finance_pocket_member_access.can_view', true);
                                });
                        });
                });
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
