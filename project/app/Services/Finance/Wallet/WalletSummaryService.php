<?php

namespace App\Services\Finance\Wallet;

use App\Models\Finance\FinanceSavingsGoal;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Finance\WalletWish;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceCacheKeyService;
use App\DTOs\Finance\SummaryDTO;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class WalletSummaryService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceCacheKeyService $cacheKeys,
    ) {
    }

    public function build(Tenant $tenant, ?TenantMember $member): array
    {
        $currentMonth = now()->format('Y-m');
        $memberId = $member?->id ?? 0;
        $cacheKey = $this->cacheKeys->versioned($tenant->id, "wallet_summary:{$memberId}:{$currentMonth}");

        return Cache::remember($cacheKey, 120, function () use ($tenant, $member, $currentMonth) {
            // 1. Account Aggregations (SQL)
            $accountTotals = $this->access->accessibleAccountsQuery($tenant, $member)
                ->active()
                ->selectRaw("
                    COALESCE(SUM(CASE WHEN type NOT IN ('credit_card', 'paylater') THEN current_balance ELSE 0 END), 0) as total_assets,
                    COALESCE(SUM(CASE WHEN type IN ('cash', 'bank') THEN GREATEST(current_balance, 0) ELSE 0 END), 0) as cash_bank_assets,
                    COALESCE(SUM(CASE WHEN type IN ('credit_card', 'paylater') THEN ABS(current_balance) ELSE 0 END), 0) as total_liabilities
                ")
                ->first();

            $totalAssets = (float) $accountTotals->total_assets;
            $cashBankAssets = (float) $accountTotals->cash_bank_assets;
            $totalLiabilities = (float) $accountTotals->total_liabilities;

            // 2. Asset Allocation (SQL)
            $assetAllocation = $this->access->accessibleAccountsQuery($tenant, $member)
                ->active()
                ->whereNotIn('type', ['credit_card', 'paylater'])
                ->groupBy('type')
                ->selectRaw("type as label, COALESCE(SUM(GREATEST(current_balance, 0)), 0) as value")
                ->get()
                ->filter(fn ($item) => $item->value > 0)
                ->values()
                ->toArray();

            // 3. Goals (SQL)
            $accessiblePocketIds = $this->access->accessiblePocketsQuery($tenant, $member)
                ->pluck('finance_wallets.id');

            $goalTotals = FinanceSavingsGoal::query()
                ->forTenant($tenant->id)
                ->whereIn('wallet_id', $accessiblePocketIds)
                ->selectRaw("
                    COALESCE(SUM(target_amount), 0) as target_total,
                    COALESCE(SUM(current_amount), 0) as current_total
                ")
                ->first();

            $lockedFunds = (float) $goalTotals->current_total;
            $goalTargetTotal = (float) $goalTotals->target_total;

            // 4. Transactions (SQL)
            $visibleTransactions = $this->access->visibleTransactionsQuery($tenant, $member)
                ->forMonth($currentMonth)
                ->where(function ($query) {
                    $query->whereNull('is_internal_transfer')->orWhere('is_internal_transfer', false);
                });

            $transactionTotals = (clone $visibleTransactions)
                ->selectRaw("
                    COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount_base ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount_base ELSE 0 END), 0) as spending
                ")
                ->first();

            $income = (float) $transactionTotals->income;
            $spending = (float) $transactionTotals->spending;
            $monthlySaving = $income - $spending;

            // 5. Wishlist
            $wishes = WalletWish::query()
                ->forTenant($tenant->id)
                ->get(['id', 'estimated_amount', 'priority', 'status']);

            $highPriorityWishesTotal = (float) $wishes
                ->filter(fn ($wish) => $wish->priority === 'high' && $wish->status !== 'converted')
                ->sum(fn ($wish) => (float) $wish->estimated_amount);

            $freeFunds = max($totalAssets - $lockedFunds, 0);

            $dto = new SummaryDTO(
                income: $income,
                spending: $spending,
                monthlySaving: $monthlySaving,
                totalAssets: $totalAssets,
                cashBankAssets: $cashBankAssets,
                totalLiabilities: $totalLiabilities,
                lockedFunds: $lockedFunds,
                freeFunds: $freeFunds,
                liquidityRatio: $totalAssets > 0 ? round(($cashBankAssets / $totalAssets) * 100, 1) : 0.0,
                savingRate: $income > 0 ? round(($monthlySaving / $income) * 100, 1) : 0.0,
                debtRatio: $totalAssets > 0 ? round(($totalLiabilities / $totalAssets) * 100, 1) : 0.0,
                assetAllocation: $assetAllocation,
            );

            $wishlistQuickView = $wishes
                ->filter(fn ($wish) => $wish->status !== 'converted')
                ->sortBy(fn ($wish) => abs((float) $wish->estimated_amount - $freeFunds))
                ->take(3)
                ->values()
                ->map(fn ($wish) => [
                    'id' => (string) $wish->id,
                    'estimated_amount' => (float) $wish->estimated_amount,
                    'priority' => $wish->priority,
                    'status' => $wish->status,
                ])
                ->all();

            return array_merge($dto->toArray(), [
                'period_month' => $currentMonth,
                'net_worth' => round($totalAssets - $totalLiabilities, 2),
                'monthly_income' => round($income, 2), // Compatibility
                'monthly_spending' => round($spending, 2), // Compatibility
                'debt_status_total' => round($totalLiabilities, 2),
                'high_priority_wishes' => $highPriorityWishesTotal,
                'goal_target_total' => $goalTargetTotal,
                'goal_current_total' => $lockedFunds,
                'wishlist_quick_view' => $wishlistQuickView,
            ]);
        });
    }
}
