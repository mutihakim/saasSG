<?php

namespace App\Services\Finance;

use App\Models\Tenant;
use App\Models\TenantMember;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinanceReportService
{
    public function __construct(
        private readonly FinanceAccessService $access,
    ) {
    }

    public function getReport(Tenant $tenant, ?TenantMember $member, array $filters): array
    {
        $dateFrom = $filters['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $filters['date_to'] ?? now()->endOfMonth()->toDateString();
        $groupBy = $filters['group_by'] ?? 'day';

        $this->assertRangeWithinLimit($dateFrom, $dateTo);

        $cacheKey = sprintf(
            'finance_report:%s:%s:%s',
            $tenant->id,
            $member?->id ?? 'all',
            md5(json_encode([
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'group_by' => $groupBy,
                'account_id' => $filters['account_id'] ?? null,
                'budget_id' => $filters['budget_id'] ?? null,
                'category_id' => $filters['category_id'] ?? null,
                'owner_member_id' => $filters['owner_member_id'] ?? null,
            ], JSON_THROW_ON_ERROR))
        );

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($tenant, $member, $filters, $dateFrom, $dateTo, $groupBy) {
            $baseQuery = $this->buildBaseQuery($tenant, $member, $filters, $dateFrom, $dateTo);

            return [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'group_by' => $groupBy,
                ],
                'totals' => $this->totals($baseQuery),
                'trend' => $this->trend($baseQuery, $groupBy),
                'expense_by_category' => $this->categoryBreakdown($baseQuery, 'pengeluaran'),
                'income_by_category' => $this->categoryBreakdown($baseQuery, 'pemasukan'),
                'account_breakdown' => $this->accountBreakdown($baseQuery),
                'budget_usage' => $this->budgetUsage($tenant, $member, $filters, $dateFrom, $dateTo),
            ];
        });
    }

    private function buildBaseQuery(
        Tenant $tenant,
        ?TenantMember $member,
        array $filters,
        string $dateFrom,
        string $dateTo,
    ): Builder {
        return $this->access->visibleTransactionsQuery($tenant, $member)
            ->whereBetween('transaction_date', [$dateFrom, $dateTo])
            ->when($filters['account_id'] ?? null, fn (Builder $query, string $accountId) => $query->where('bank_account_id', $accountId))
            ->when($filters['budget_id'] ?? null, fn (Builder $query, string $budgetId) => $query->where('budget_id', $budgetId))
            ->when($filters['category_id'] ?? null, fn (Builder $query, int|string $categoryId) => $query->where('category_id', $categoryId))
            ->when($filters['owner_member_id'] ?? null, fn (Builder $query, int|string $ownerMemberId) => $query->where('owner_member_id', $ownerMemberId));
    }

    private function totals(Builder $baseQuery): array
    {
        $totals = (clone $baseQuery)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount_base ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount_base ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN type = 'transfer' THEN amount_base ELSE 0 END), 0) as transfer,
                COUNT(*) as count
            ")
            ->first();

        return [
            'income' => round((float) ($totals?->income ?? 0), 2),
            'expense' => round((float) ($totals?->expense ?? 0), 2),
            'transfer' => round((float) ($totals?->transfer ?? 0), 2),
            'count' => (int) ($totals?->count ?? 0),
        ];
    }

    private function trend(Builder $baseQuery, string $groupBy): array
    {
        $dailyRows = (clone $baseQuery)
            ->selectRaw("
                DATE(transaction_date) as bucket_date,
                COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount_base ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount_base ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN type = 'transfer' THEN amount_base ELSE 0 END), 0) as transfer
            ")
            ->groupBy(DB::raw('DATE(transaction_date)'))
            ->orderBy(DB::raw('DATE(transaction_date)'))
            ->get();

        $bucketed = collect($dailyRows)->groupBy(function ($row) use ($groupBy) {
            $date = Carbon::parse($row->bucket_date);

            return match ($groupBy) {
                'week' => $date->copy()->startOfWeek()->format('Y-m-d'),
                'month' => $date->format('Y-m'),
                default => $date->format('Y-m-d'),
            };
        });

        return $bucketed->map(function (Collection $items, string $bucket) {
            return [
                'bucket' => $bucket,
                'income' => round((float) $items->sum('income'), 2),
                'expense' => round((float) $items->sum('expense'), 2),
                'transfer' => round((float) $items->sum('transfer'), 2),
            ];
        })->values()->all();
    }

    private function categoryBreakdown(Builder $baseQuery, string $type): array
    {
        return (clone $baseQuery)
            ->join('tenant_categories', 'tenant_categories.id', '=', 'finance_transactions.category_id')
            ->where('finance_transactions.type', $type)
            ->selectRaw('tenant_categories.name as name, tenant_categories.color as color, tenant_categories.icon as icon, SUM(finance_transactions.amount_base) as amount')
            ->groupBy('tenant_categories.id', 'tenant_categories.name', 'tenant_categories.color', 'tenant_categories.icon')
            ->orderByDesc('amount')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'amount' => round((float) $row->amount, 2),
                'color' => $row->color,
                'icon' => $row->icon,
            ])
            ->values()
            ->all();
    }

    private function accountBreakdown(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->leftJoin('tenant_bank_accounts', 'tenant_bank_accounts.id', '=', 'finance_transactions.bank_account_id')
            ->selectRaw("
                COALESCE(tenant_bank_accounts.name, 'Tanpa Akun') as name,
                COALESCE(SUM(CASE WHEN finance_transactions.type = 'pemasukan' THEN finance_transactions.amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN finance_transactions.type = 'pengeluaran' THEN finance_transactions.amount ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN finance_transactions.type = 'transfer' THEN finance_transactions.amount ELSE 0 END), 0) as transfer,
                COALESCE(SUM(CASE
                    WHEN finance_transactions.type = 'pemasukan' THEN finance_transactions.amount
                    WHEN finance_transactions.type = 'pengeluaran' THEN -finance_transactions.amount
                    WHEN finance_transactions.transfer_direction = 'in' THEN finance_transactions.amount
                    ELSE -finance_transactions.amount
                END), 0) as net
            ")
            ->groupBy('tenant_bank_accounts.id', 'tenant_bank_accounts.name')
            ->orderBy('name')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'income' => round((float) $row->income, 2),
                'expense' => round((float) $row->expense, 2),
                'transfer' => round((float) $row->transfer, 2),
                'net' => round((float) $row->net, 2),
            ])
            ->values()
            ->all();
    }

    private function budgetUsage(
        Tenant $tenant,
        ?TenantMember $member,
        array $filters,
        string $dateFrom,
        string $dateTo,
    ): array {
        return $this->access->accessibleBudgetsQuery($tenant, $member)
            ->when($filters['budget_id'] ?? null, fn (Builder $query, string $budgetId) => $query->whereKey($budgetId))
            ->whereBetween('period_month', [substr($dateFrom, 0, 7), substr($dateTo, 0, 7)])
            ->orderByDesc('period_month')
            ->orderBy('name')
            ->get(['id', 'name', 'period_month', 'allocated_amount', 'spent_amount', 'remaining_amount', 'scope'])
            ->map(fn ($budget) => [
                'id' => $budget->id,
                'name' => $budget->name,
                'period_month' => $budget->period_month,
                'allocated_amount' => round((float) $budget->allocated_amount, 2),
                'spent_amount' => round((float) $budget->spent_amount, 2),
                'remaining_amount' => round((float) $budget->remaining_amount, 2),
                'scope' => $budget->scope,
            ])
            ->values()
            ->all();
    }

    private function assertRangeWithinLimit(string $dateFrom, string $dateTo): void
    {
        $from = Carbon::parse($dateFrom)->startOfDay();
        $to = Carbon::parse($dateTo)->startOfDay();

        if ($to->lt($from) || $from->diffInDays($to) > 366) {
            throw ValidationException::withMessages([
                'date_to' => 'Rentang laporan maksimal 366 hari.',
            ]);
        }
    }
}
