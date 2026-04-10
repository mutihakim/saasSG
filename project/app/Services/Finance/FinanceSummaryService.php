<?php

namespace App\Services\Finance;

use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class FinanceSummaryService
{
    public function __construct(
        private readonly FinanceCacheKeyService $cacheKeys,
    ) {
    }

    /**
     * Get summary data for the given tenant and month (YYYY-MM).
     */
    public function getSummary(Tenant $tenant, string $month): array
    {
        $cacheKey = $this->cacheKeys->versioned($tenant->id, "finance_summary:{$month}");

        return Cache::remember($cacheKey, 300, function () use ($tenant, $month) {
            [$year, $mon] = explode('-', $month);

            $totals = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $mon)
                ->selectRaw('type, SUM(amount_base) as total')
                ->groupBy('type')
                ->get()
                ->mapWithKeys(fn ($item) => [$item->type->value => (float) $item->total]);

            $totalIncome  = $totals['pemasukan'] ?? 0;
            $totalExpense = $totals['pengeluaran'] ?? 0;

            $transactionCount = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $mon)
                ->count();

            $hasMultiCurrency = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $mon)
                ->join('tenant_currencies', 'tenant_currencies.id', '=', 'finance_transactions.currency_id')
                ->where('tenant_currencies.code', '!=', $tenant->currency_code ?? 'IDR')
                ->exists();

            // Top 5 expense categories
            $topCategories = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $mon)
                ->where('type', 'pengeluaran')
                ->join('tenant_categories', 'tenant_categories.id', '=', 'finance_transactions.category_id')
                ->selectRaw('tenant_categories.id, tenant_categories.name, tenant_categories.icon, tenant_categories.color, SUM(finance_transactions.amount_base) as total')
                ->groupBy('tenant_categories.id', 'tenant_categories.name', 'tenant_categories.icon', 'tenant_categories.color')
                ->orderByDesc('total')
                ->limit(5)
                ->get()
                ->map(fn ($row) => [
                    'id'     => $row->id,
                    'name'   => $row->name,
                    'icon'   => $row->icon,
                    'color'  => $row->color,
                    'amount' => (float) $row->total,
                    'pct'    => $totalExpense > 0 ? round($row->total / $totalExpense * 100, 1) : 0,
                ])
                ->all();

            return [
                'period'               => $month,
                'base_currency'        => $tenant->currency_code ?? 'IDR',
                'total_income_base'    => $totalIncome,
                'total_expense_base'   => $totalExpense,
                'balance_base'         => $totalIncome - $totalExpense,
                'transaction_count'    => $transactionCount,
                'has_multi_currency'   => $hasMultiCurrency,
                'top_expense_categories' => $topCategories,
            ];
        });
    }

    /**
     * Warm summary cache for active period after transaction mutations.
     */
    public function recalculateForTenant(Tenant $tenant): void
    {
        $this->getSummary($tenant, now()->format('Y-m'));
    }

    /**
     * Invalidate summary cache after a transaction mutation.
     * Also clears filtered summaries and account metrics caches for this tenant.
     */
    public function invalidate(int $tenantId, string $month): void
    {
        Cache::forget("finance_summary:{$tenantId}:{$month}"); // legacy key (best effort)
        $this->invalidateTenantCaches($tenantId);
    }

    /**
     * Flush all tenant-scoped caches that depend on transaction data.
     * Used when any transaction is created/updated/deleted.
     */
    public function invalidateTenantCaches(int $tenantId): void
    {
        $this->cacheKeys->bumpTenantVersion($tenantId);

        // Best-effort cleanup for pre-versioned keys only.
        Cache::forget("wallet_goal_reserved_accounts:{$tenantId}");
        Cache::forget("wallet_goal_reserved_pockets:{$tenantId}");
    }

    public function cacheVersion(int $tenantId): int
    {
        return $this->cacheKeys->tenantVersion($tenantId);
    }

    public function getFilteredSummary(Builder $query, Tenant $tenant, array $options = []): array
    {
        $excludeInternalTransfers = (bool) ($options['exclude_internal_transfers'] ?? false);
        $cacheKey = $options['cache_key'] ?? null;

        $compute = function () use ($query, $tenant, $excludeInternalTransfers) {
            $totals = (clone $query)
                ->selectRaw('
                    COALESCE(SUM(CASE WHEN type = ? THEN amount_base ELSE 0 END), 0) as income_total,
                    COALESCE(SUM(CASE WHEN type = ? THEN amount_base ELSE 0 END), 0) as expense_total,
                    COALESCE(SUM(CASE WHEN type = ? OR COALESCE(is_internal_transfer, false) = true THEN amount_base ELSE 0 END), 0) as transfer_total,
                    COUNT(*) as transaction_count
                ', ['pemasukan', 'pengeluaran', 'transfer'])
                ->first();

            $topExpenseCategories = (clone $query)
                ->where('type', 'pengeluaran')
                ->when($excludeInternalTransfers, fn (Builder $expenseQuery) => $expenseQuery->where(function (Builder $safeQuery) {
                    $safeQuery
                        ->whereNull('is_internal_transfer')
                        ->orWhere('is_internal_transfer', false);
                }))
                ->join('tenant_categories', 'tenant_categories.id', '=', 'finance_transactions.category_id')
                ->selectRaw('tenant_categories.id, tenant_categories.name, tenant_categories.icon, tenant_categories.color, SUM(finance_transactions.amount_base) as total')
                ->groupBy('tenant_categories.id', 'tenant_categories.name', 'tenant_categories.icon', 'tenant_categories.color')
                ->orderByDesc('total')
                ->limit(5)
                ->get();

            $income = round((float) ($totals?->income_total ?? 0), 2);
            $expense = round((float) ($totals?->expense_total ?? 0), 2);
            $transfer = round((float) ($totals?->transfer_total ?? 0), 2);

            return [
                'base_currency' => $tenant->currency_code ?? 'IDR',
                'total_income_base' => $income,
                'total_expense_base' => $expense,
                'balance_base' => round($income - $expense, 2),
                'transfer_total_base' => $transfer,
                'transaction_count' => (int) ($totals?->transaction_count ?? 0),
                'top_expense_categories' => $topExpenseCategories
                    ->map(fn ($row) => [
                        'id' => $row->id,
                        'name' => $row->name,
                        'icon' => $row->icon,
                        'color' => $row->color,
                        'amount' => (float) $row->total,
                        'pct' => $expense > 0 ? round(((float) $row->total / $expense) * 100, 1) : 0,
                    ])
                    ->all(),
            ];
        };

        if ($cacheKey) {
            $versionedKey = $this->cacheKeys->versioned($tenant->id, "finance_summary_filtered:{$cacheKey}");

            return Cache::remember($versionedKey, 120, $compute);
        }

        return $compute();
    }
}
