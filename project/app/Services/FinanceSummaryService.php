<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FinanceSummaryService
{
    /**
     * Get summary data for the given tenant and month (YYYY-MM).
     */
    public function getSummary(Tenant $tenant, string $month): array
    {
        $cacheKey = "finance_summary:{$tenant->id}:{$month}";

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
     * Invalidate summary cache after a transaction mutation.
     */
    public function invalidate(int $tenantId, string $month): void
    {
        Cache::forget("finance_summary:{$tenantId}:{$month}");
    }
}
