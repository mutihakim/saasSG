<?php

namespace App\Services\Finance\Transactions;

use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Finance\TenantBudget;
use App\Models\Master\TenantCurrency;
use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Wallet\FinanceWalletService;
use Carbon\Carbon;

class FinanceTransactionResourceResolverService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceWalletService $walletPockets,
    ) {
    }

    public function resolveCurrency(Tenant $tenant, string $currencyCode): ?TenantCurrency
    {
        return TenantCurrency::query()
            ->where('tenant_id', $tenant->id)
            ->where('code', $currencyCode)
            ->first();
    }

    public function resolveUsableAccount(Tenant $tenant, ?TenantMember $member, ?string $accountId): ?TenantBankAccount
    {
        if (! $accountId) {
            return null;
        }

        return $this->access->usableAccountsQuery($tenant, $member)
            ->whereKey($accountId)
            ->first();
    }

    public function resolveUsableBudget(Tenant $tenant, ?TenantMember $member, ?string $budgetId): ?TenantBudget
    {
        if (! $budgetId) {
            return null;
        }

        return $this->access->usableBudgetsQuery($tenant, $member)
            ->whereKey($budgetId)
            ->first();
    }

    public function resolveBudgetForPocket(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $budgetId,
        ?FinanceWallet $pocket,
        ?string $transactionDate = null,
    ): ?TenantBudget {
        $periodMonth = $transactionDate
            ? Carbon::parse($transactionDate)->format('Y-m')
            : now()->format('Y-m');

        if ($pocket?->budget_lock_enabled) {
            $lockedBudget = $this->resolvePocketDefaultBudget($tenant, $member, $pocket, $periodMonth);

            if (! $lockedBudget) {
                return null;
            }

            $budgetId = (string) $lockedBudget->id;
        }

        $budget = $this->resolveUsableBudget($tenant, $member, $budgetId);
        if (! $budget) {
            return null;
        }

        if ($pocket && ! $this->access->isBudgetWalletCrossoverValid($pocket, $budget)) {
            return null;
        }

        if ((string) $budget->period_month !== $periodMonth) {
            return null;
        }

        if ($budget->wallet_id) {
            $mappedPocket = $this->resolveTenantActivePocket($tenant, (string) $budget->wallet_id);

            if ($mappedPocket?->budget_lock_enabled && (! $pocket || (string) $budget->wallet_id !== (string) $pocket->id)) {
                return null;
            }
        }

        $defaultBudget = $pocket ? $this->resolvePocketDefaultBudget($tenant, $member, $pocket, $periodMonth) : null;

        if ($pocket?->budget_lock_enabled && $defaultBudget && (string) $budget->id !== (string) $defaultBudget->id) {
            return null;
        }

        return $budget;
    }

    public function resolvePocketDefaultBudget(
        Tenant $tenant,
        ?TenantMember $member,
        ?FinanceWallet $pocket,
        ?string $periodMonth = null,
    ): ?TenantBudget {
        if (! $pocket) {
            return null;
        }

        $month = $periodMonth ?: now()->format('Y-m');

        if ($pocket->default_budget_key) {
            return $this->access->usableBudgetsQuery($tenant, $member)
                ->active()
                ->where('budget_key', $pocket->default_budget_key)
                ->where('period_month', $month)
                ->orderBy('name')
                ->first();
        }

        if ($pocket->default_budget_id) {
            $budget = $this->resolveUsableBudget($tenant, $member, (string) $pocket->default_budget_id);

            if ($budget && (string) $budget->period_month === $month) {
                return $budget;
            }
        }

        return null;
    }

    public function resolveUsablePocket(Tenant $tenant, ?TenantMember $member, ?string $pocketId): ?FinanceWallet
    {
        if (! $pocketId) {
            return null;
        }

        return $this->access->usablePocketsQuery($tenant, $member)
            ->whereKey($pocketId)
            ->first();
    }

    public function resolveAccessiblePocket(Tenant $tenant, ?TenantMember $member, ?string $pocketId): ?FinanceWallet
    {
        if (! $pocketId) {
            return null;
        }

        return $this->access->accessiblePocketsQuery($tenant, $member)
            ->active()
            ->whereKey($pocketId)
            ->first();
    }

    public function resolveTenantActivePocket(Tenant $tenant, ?string $pocketId): ?FinanceWallet
    {
        if (! $pocketId) {
            return null;
        }

        return FinanceWallet::query()
            ->forTenant($tenant->id)
            ->active()
            ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code'])
            ->whereKey($pocketId)
            ->first();
    }

    public function resolveTenantActiveAccount(Tenant $tenant, ?string $accountId): ?TenantBankAccount
    {
        if (! $accountId) {
            return null;
        }

        return TenantBankAccount::query()
            ->forTenant($tenant->id)
            ->active()
            ->whereKey($accountId)
            ->first();
    }

    public function resolveTransactionPocket(
        Tenant $tenant,
        ?TenantMember $member,
        ?TenantBankAccount $account,
        ?string $pocketId
    ): ?FinanceWallet {
        if (! $account) {
            return null;
        }

        if (! $this->walletPockets->walletSubscribed($tenant)) {
            return $this->walletPockets->resolveMainPocketForAccount($account);
        }

        if (! $pocketId) {
            return $this->walletPockets->resolveMainPocketForAccount($account);
        }

        $pocket = $this->resolveUsablePocket($tenant, $member, $pocketId);
        if (! $pocket) {
            return null;
        }

        if ((string) $pocket->real_account_id !== (string) $account->id) {
            return null;
        }

        return $pocket;
    }

    public function resolveTransactionAccount(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $accountId,
        ?string $pocketId
    ): ?TenantBankAccount {
        if ($pocketId) {
            $pocket = $this->resolveUsablePocket($tenant, $member, $pocketId);

            if ($pocket) {
                return $this->resolveUsableAccount($tenant, $member, (string) $pocket->real_account_id);
            }
        }

        return $this->resolveUsableAccount($tenant, $member, $accountId);
    }
}
