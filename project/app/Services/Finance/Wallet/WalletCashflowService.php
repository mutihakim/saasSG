<?php

namespace App\Services\Finance\Wallet;

use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class WalletCashflowService
{
    public const DETAIL_SUMMARY = 'summary';
    public const DETAIL_FULL = 'full';

    public function __construct(
        private readonly FinanceAccessService $access,
    ) {
    }

    public function enrichAccounts(
        Tenant $tenant,
        ?TenantMember $member,
        Collection $accounts,
        ?string $periodMonth = null,
        string $detailLevel = self::DETAIL_FULL,
    ): Collection
    {
        $metrics = $this->accountMetrics(
            $tenant,
            $member,
            $periodMonth,
            includeLifetime: $detailLevel === self::DETAIL_FULL,
        );
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

        return $accounts->map(function (TenantBankAccount $account) use ($metrics, $accountGoalReserved) {
            $metric = $metrics[(string) $account->id] ?? [
                'period_inflow' => 0.0,
                'period_outflow' => 0.0,
                'total_inflow' => 0.0,
                'total_outflow' => 0.0,
            ];
            $reservedTotal = round((float) ($accountGoalReserved->get((string) $account->id)?->reserved_total ?? 0), 2);
            $account->setAttribute('period_inflow', round((float) $metric['period_inflow'], 2));
            $account->setAttribute('period_outflow', round((float) $metric['period_outflow'], 2));
            $account->setAttribute('goal_reserved_total', $reservedTotal);
            $account->setAttribute('available_balance', round(((float) $account->current_balance) - $reservedTotal, 2));
            $account->setAttribute('total_inflow', round((float) ($metric['total_inflow'] ?? 0), 2));
            $account->setAttribute('total_outflow', round((float) ($metric['total_outflow'] ?? 0), 2));

            // No longer needs unallocated_amount, allocated_amount mismatch because
            // 'Utama' pocket perfectly acts as the unallocated pool.
            $account->setAttribute('allocated_amount', 0.0);
            $account->setAttribute('unallocated_amount', 0.0);
            $account->setAttribute('wallet_mismatch_amount', 0.0);

            return $account;
        });
    }

    public function enrichPockets(
        Tenant $tenant,
        ?TenantMember $member,
        Collection $pockets,
        ?string $periodMonth = null,
        string $detailLevel = self::DETAIL_FULL,
    ): Collection
    {
        $metrics = $detailLevel === self::DETAIL_FULL
            ? $this->pocketMetrics($tenant, $member, $periodMonth, includeLifetime: true)
            : [];
        $goalReserved = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->whereIn('pocket_id', $pockets->pluck('id'))
            ->selectRaw('pocket_id, COALESCE(SUM(current_amount), 0) as reserved_total, COUNT(*) as goal_count')
            ->groupBy('pocket_id')
            ->get()
            ->keyBy('pocket_id');

        return $pockets->map(function (FinancePocket $pocket) use ($metrics, $goalReserved) {
            $metric = $metrics[(string) $pocket->id] ?? [
                'period_inflow' => 0.0,
                'period_outflow' => 0.0,
                'total_inflow' => 0.0,
                'total_outflow' => 0.0,
            ];
            $reservedMetric = $goalReserved->get((string) $pocket->id);
            $reservedTotal = round((float) ($reservedMetric->reserved_total ?? 0), 2);
            $pocket->setAttribute('period_inflow', round((float) ($metric['period_inflow'] ?? 0), 2));
            $pocket->setAttribute('period_outflow', round((float) ($metric['period_outflow'] ?? 0), 2));
            $pocket->setAttribute('total_inflow', round((float) ($metric['total_inflow'] ?? 0), 2));
            $pocket->setAttribute('total_outflow', round((float) ($metric['total_outflow'] ?? 0), 2));
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
    private function accountMetrics(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $periodMonth = null,
        bool $includeLifetime = true,
    ): array
    {
        return $this->metricsByAggregate($tenant, $member, 'bank_account_id', $periodMonth, $includeLifetime);
    }

    private function pocketMetrics(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $periodMonth = null,
        bool $includeLifetime = true,
    ): array
    {
        return $this->metricsByAggregate($tenant, $member, 'pocket_id', $periodMonth, $includeLifetime);
    }

    private function metricsByAggregate(
        Tenant $tenant,
        ?TenantMember $member,
        string $aggregateColumn,
        ?string $periodMonth = null,
        bool $includeLifetime = true,
    ): array
    {
        $month = $periodMonth ?: now()->format('Y-m');
        $memberId = $member?->id ?? 0;
        $cacheKey = "wallet_account_metrics:{$tenant->id}:{$aggregateColumn}:{$memberId}:{$month}:" . ($includeLifetime ? 'full' : 'summary');

        return Cache::remember($cacheKey, 300, function () use ($tenant, $member, $aggregateColumn, $periodMonth, $includeLifetime, $month) {
            $query = $this->access->visibleTransactionsQuery($tenant, $member);
            $periodStart = CarbonImmutable::createFromFormat('Y-m', $month)->startOfMonth();
            $nextPeriodStart = $periodStart->addMonth();

            $selectRaw = "
                    {$aggregateColumn} as aggregate_id,
                    COALESCE(SUM(CASE
                        WHEN transaction_date >= ? AND transaction_date < ?
                            AND (type = 'pemasukan' OR (type = 'transfer' AND transfer_direction = 'in'))
                        THEN amount_base ELSE 0
                    END), 0) as period_inflow,
                    COALESCE(SUM(CASE
                        WHEN transaction_date >= ? AND transaction_date < ?
                            AND (type = 'pengeluaran' OR (type = 'transfer' AND transfer_direction = 'out'))
                        THEN amount_base ELSE 0
                    END), 0) as period_outflow,
            ";
            $bindings = [
                $periodStart->toDateString(),
                $nextPeriodStart->toDateString(),
                $periodStart->toDateString(),
                $nextPeriodStart->toDateString(),
            ];

            if ($includeLifetime) {
                $selectRaw .= "
                    COALESCE(SUM(CASE
                        WHEN type = 'pemasukan' OR (type = 'transfer' AND transfer_direction = 'in')
                        THEN amount_base ELSE 0
                    END), 0) as total_inflow,
                    COALESCE(SUM(CASE
                        WHEN type = 'pengeluaran' OR (type = 'transfer' AND transfer_direction = 'out')
                        THEN amount_base ELSE 0
                    END), 0) as total_outflow
                ";
            } else {
                $selectRaw .= "0 as total_inflow, 0 as total_outflow";
            }

            return $query
                ->selectRaw($selectRaw, $bindings)
                ->whereNotNull($aggregateColumn)
                ->groupBy($aggregateColumn)
                ->get()
                ->mapWithKeys(fn ($row) => [
                    (string) $row->aggregate_id => [
                        'period_inflow' => (float) $row->period_inflow,
                        'period_outflow' => (float) $row->period_outflow,
                        'total_inflow' => (float) $row->total_inflow,
                        'total_outflow' => (float) $row->total_outflow,
                    ],
                ])
                ->all();
        });
    }
}
