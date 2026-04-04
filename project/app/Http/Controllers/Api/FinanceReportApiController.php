<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\FinanceAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Carbon;

class FinanceReportApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);

        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'group_by' => ['nullable', 'in:day,week,month'],
            'account_id' => ['nullable', 'string', 'size:26'],
            'budget_id' => ['nullable', 'string', 'size:26'],
            'category_id' => ['nullable', 'integer'],
            'owner_member_id' => ['nullable', 'integer'],
        ]);

        $dateFrom = $data['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $data['date_to'] ?? now()->endOfMonth()->toDateString();
        $groupBy = $data['group_by'] ?? 'day';

        $transactions = $this->access->visibleTransactionsQuery($tenant, $member)
            ->with(['category:id,name,color,icon', 'bankAccount:id,name,type', 'budget:id,name,period_month', 'ownerMember:id,full_name'])
            ->whereBetween('transaction_date', [$dateFrom, $dateTo])
            ->when($data['account_id'] ?? null, fn ($query, $accountId) => $query->where('bank_account_id', $accountId))
            ->when($data['budget_id'] ?? null, fn ($query, $budgetId) => $query->where('budget_id', $budgetId))
            ->when($data['category_id'] ?? null, fn ($query, $categoryId) => $query->where('category_id', $categoryId))
            ->when($data['owner_member_id'] ?? null, fn ($query, $ownerMemberId) => $query->where('owner_member_id', $ownerMemberId))
            ->orderBy('transaction_date')
            ->get();

        $trend = $transactions
            ->groupBy(fn ($transaction) => $this->bucketLabel((string) $transaction->transaction_date, $groupBy))
            ->map(fn (Collection $items, string $bucket) => [
                'bucket' => $bucket,
                'income' => round($items->where('type', 'pemasukan')->sum('amount_base'), 2),
                'expense' => round($items->where('type', 'pengeluaran')->sum('amount_base'), 2),
                'transfer' => round($items->where('type', 'transfer')->sum('amount_base'), 2),
            ])
            ->values();

        $expenseByCategory = $transactions
            ->where('type', 'pengeluaran')
            ->groupBy(fn ($transaction) => $transaction->category?->name ?? 'Tanpa Kategori')
            ->map(fn (Collection $items, string $name) => [
                'name' => $name,
                'amount' => round($items->sum('amount_base'), 2),
                'color' => $items->first()?->category?->color,
                'icon' => $items->first()?->category?->icon,
            ])
            ->sortByDesc('amount')
            ->values();

        $incomeByCategory = $transactions
            ->where('type', 'pemasukan')
            ->groupBy(fn ($transaction) => $transaction->category?->name ?? 'Tanpa Kategori')
            ->map(fn (Collection $items, string $name) => [
                'name' => $name,
                'amount' => round($items->sum('amount_base'), 2),
                'color' => $items->first()?->category?->color,
                'icon' => $items->first()?->category?->icon,
            ])
            ->sortByDesc('amount')
            ->values();

        $accountBreakdown = $transactions
            ->groupBy(fn ($transaction) => $transaction->bankAccount?->name ?? 'Tanpa Akun')
            ->map(fn (Collection $items, string $name) => [
                'name' => $name,
                'income' => round($items->where('type', 'pemasukan')->sum('amount'), 2),
                'expense' => round($items->where('type', 'pengeluaran')->sum('amount'), 2),
                'transfer' => round($items->where('type', 'transfer')->sum('amount'), 2),
                'net' => round($items->reduce(function (float $carry, $transaction) {
                    if ($transaction->type === 'pemasukan') {
                        return $carry + (float) $transaction->amount;
                    }

                    if ($transaction->type === 'pengeluaran') {
                        return $carry - (float) $transaction->amount;
                    }

                    return $carry + ($transaction->transfer_direction === 'in'
                        ? (float) $transaction->amount
                        : -(float) $transaction->amount);
                }, 0), 2),
            ])
            ->values();

        $budgetUsage = $this->access->accessibleBudgetsQuery($tenant, $member)
            ->when($data['budget_id'] ?? null, fn ($query, $budgetId) => $query->whereKey($budgetId))
            ->when(substr($dateFrom, 0, 7), fn ($query, $periodMonth) => $query->whereBetween('period_month', [substr($dateFrom, 0, 7), substr($dateTo, 0, 7)]))
            ->orderByDesc('period_month')
            ->orderBy('name')
            ->get(['id', 'name', 'period_month', 'allocated_amount', 'spent_amount', 'remaining_amount', 'scope']);

        return response()->json([
            'ok' => true,
            'data' => [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'group_by' => $groupBy,
                ],
                'totals' => [
                    'income' => round($transactions->where('type', 'pemasukan')->sum('amount_base'), 2),
                    'expense' => round($transactions->where('type', 'pengeluaran')->sum('amount_base'), 2),
                    'transfer' => round($transactions->where('type', 'transfer')->sum('amount_base'), 2),
                    'count' => $transactions->count(),
                ],
                'trend' => $trend,
                'expense_by_category' => $expenseByCategory,
                'income_by_category' => $incomeByCategory,
                'account_breakdown' => $accountBreakdown,
                'budget_usage' => $budgetUsage,
            ],
        ]);
    }

    private function bucketLabel(string $date, string $groupBy): string
    {
        $carbon = Carbon::parse($date);

        return match ($groupBy) {
            'week' => $carbon->startOfWeek()->format('Y-m-d'),
            'month' => $carbon->format('Y-m'),
            default => $carbon->format('Y-m-d'),
        };
    }
}
