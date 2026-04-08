<?php

namespace App\Services\Finance\Wallet;

use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use Illuminate\Support\Collection;

class WalletCashflowService
{
    public function __construct(
        private readonly FinanceAccessService $access,
    ) {
    }

    public function enrichAccounts(Tenant $tenant, ?TenantMember $member, Collection $accounts, ?string $periodMonth = null): Collection
    {
        $periodMetrics = $this->accountMetrics($tenant, $member, $periodMonth);
        $totalMetrics = $this->accountMetrics($tenant, $member, null, false);
        $accessibleAccountIds = $accounts->pluck('id')->values();
        $accountGoalReserved = FinanceSavingsGoal::query()
            ->join('finance_pockets', 'finance_pockets.id', '=', 'finance_savings_goals.pocket_id')
            ->where('finance_savings_goals.tenant_id', $tenant->id)
            ->whereIn('finance_pockets.real_account_id', $accessibleAccountIds)
            ->whereNull('finance_pockets.deleted_at')
            ->selectRaw('finance_pockets.real_account_id as account_id, COALESCE(SUM(finance_savings_goals.current_amount), 0) as reserved_total')
            ->groupBy('finance_pockets.real_account_id')
            ->get()
            ->keyBy('account_id');

        return $accounts->map(function (TenantBankAccount $account) use ($periodMetrics, $totalMetrics, $accountGoalReserved) {
            $periodMetric = $periodMetrics[(string) $account->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $totalMetric = $totalMetrics[(string) $account->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $reservedTotal = round((float) ($accountGoalReserved->get((string) $account->id)?->reserved_total ?? 0), 2);
            $account->setAttribute('period_inflow', round((float) $periodMetric['inflow'], 2));
            $account->setAttribute('period_outflow', round((float) $periodMetric['outflow'], 2));
            $account->setAttribute('total_inflow', round((float) $totalMetric['inflow'], 2));
            $account->setAttribute('total_outflow', round((float) $totalMetric['outflow'], 2));
            $account->setAttribute('goal_reserved_total', $reservedTotal);
            $account->setAttribute('available_balance', round(((float) $account->current_balance) - $reservedTotal, 2));

            // No longer needs unallocated_amount, allocated_amount mismatch because
            // 'Utama' pocket perfectly acts as the unallocated pool.
            $account->setAttribute('allocated_amount', 0.0);
            $account->setAttribute('unallocated_amount', 0.0);
            $account->setAttribute('wallet_mismatch_amount', 0.0);

            return $account;
        });
    }

    public function enrichPockets(Tenant $tenant, ?TenantMember $member, Collection $pockets, ?string $periodMonth = null): Collection
    {
        $periodMetrics = $this->pocketMetrics($tenant, $member, $periodMonth);
        $totalMetrics = $this->pocketMetrics($tenant, $member, null, false);
        $goalReserved = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->whereIn('pocket_id', $pockets->pluck('id'))
            ->selectRaw('pocket_id, COALESCE(SUM(current_amount), 0) as reserved_total, COUNT(*) as goal_count')
            ->groupBy('pocket_id')
            ->get()
            ->keyBy('pocket_id');

        return $pockets->map(function (FinancePocket $pocket) use ($periodMetrics, $totalMetrics, $goalReserved) {
            $periodMetric = $periodMetrics[(string) $pocket->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $totalMetric = $totalMetrics[(string) $pocket->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $reservedMetric = $goalReserved->get((string) $pocket->id);
            $reservedTotal = round((float) ($reservedMetric->reserved_total ?? 0), 2);
            $pocket->setAttribute('period_inflow', round((float) $periodMetric['inflow'], 2));
            $pocket->setAttribute('period_outflow', round((float) $periodMetric['outflow'], 2));
            $pocket->setAttribute('total_inflow', round((float) $totalMetric['inflow'], 2));
            $pocket->setAttribute('total_outflow', round((float) $totalMetric['outflow'], 2));
            $pocket->setAttribute('goal_reserved_total', $reservedTotal);
            $pocket->setAttribute('available_balance', round(((float) $pocket->current_balance) - $reservedTotal, 2));
            $pocket->setAttribute('goal_count', (int) ($reservedMetric->goal_count ?? 0));

            return $pocket;
        });
    }

    /**
     * Inflow/outflow di wallet memakai cash movement aktual:
     * inflow = income + transfer in
     * outflow = expense + transfer out
     */
    private function accountMetrics(Tenant $tenant, ?TenantMember $member, ?string $periodMonth = null, bool $forMonth = true): array
    {
        return $this->baseQuery($tenant, $member, $periodMonth, $forMonth)
            ->selectRaw("
                bank_account_id as aggregate_id,
                COALESCE(SUM(CASE WHEN type = 'pemasukan' OR (type = 'transfer' AND transfer_direction = 'in') THEN amount_base ELSE 0 END), 0) as inflow,
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' OR (type = 'transfer' AND transfer_direction = 'out') THEN amount_base ELSE 0 END), 0) as outflow
            ")
            ->whereNotNull('bank_account_id')
            ->groupBy('bank_account_id')
            ->get()
            ->mapWithKeys(fn ($row) => [
                (string) $row->aggregate_id => [
                    'inflow' => (float) $row->inflow,
                    'outflow' => (float) $row->outflow,
                ],
            ])
            ->all();
    }

    private function pocketMetrics(Tenant $tenant, ?TenantMember $member, ?string $periodMonth = null, bool $forMonth = true): array
    {
        return $this->baseQuery($tenant, $member, $periodMonth, $forMonth)
            ->selectRaw("
                pocket_id as aggregate_id,
                COALESCE(SUM(CASE WHEN type = 'pemasukan' OR (type = 'transfer' AND transfer_direction = 'in') THEN amount_base ELSE 0 END), 0) as inflow,
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' OR (type = 'transfer' AND transfer_direction = 'out') THEN amount_base ELSE 0 END), 0) as outflow
            ")
            ->whereNotNull('pocket_id')
            ->groupBy('pocket_id')
            ->get()
            ->mapWithKeys(fn ($row) => [
                (string) $row->aggregate_id => [
                    'inflow' => (float) $row->inflow,
                    'outflow' => (float) $row->outflow,
                ],
            ])
            ->all();
    }

    private function baseQuery(Tenant $tenant, ?TenantMember $member, ?string $periodMonth = null, bool $forMonth = true)
    {
        $query = $this->access->visibleTransactionsQuery($tenant, $member);

        if ($forMonth) {
            $month = $periodMonth ?: now()->format('Y-m');
            $query->forMonth($month);
        }

        return $query;
    }
}
