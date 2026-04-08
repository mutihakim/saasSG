<?php

namespace App\Services;

use App\Models\FinancePocket;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
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

        return $accounts->map(function (TenantBankAccount $account) use ($periodMetrics, $totalMetrics) {
            $periodMetric = $periodMetrics[(string) $account->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $totalMetric = $totalMetrics[(string) $account->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $account->setAttribute('period_inflow', round((float) $periodMetric['inflow'], 2));
            $account->setAttribute('period_outflow', round((float) $periodMetric['outflow'], 2));
            $account->setAttribute('total_inflow', round((float) $totalMetric['inflow'], 2));
            $account->setAttribute('total_outflow', round((float) $totalMetric['outflow'], 2));

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

        return $pockets->map(function (FinancePocket $pocket) use ($periodMetrics, $totalMetrics) {
            $periodMetric = $periodMetrics[(string) $pocket->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $totalMetric = $totalMetrics[(string) $pocket->id] ?? ['inflow' => 0.0, 'outflow' => 0.0];
            $pocket->setAttribute('period_inflow', round((float) $periodMetric['inflow'], 2));
            $pocket->setAttribute('period_outflow', round((float) $periodMetric['outflow'], 2));
            $pocket->setAttribute('total_inflow', round((float) $totalMetric['inflow'], 2));
            $pocket->setAttribute('total_outflow', round((float) $totalMetric['outflow'], 2));

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
