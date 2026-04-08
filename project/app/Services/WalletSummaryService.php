<?php

namespace App\Services;

use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\WalletWish;

class WalletSummaryService
{
    public function __construct(
        private readonly FinanceAccessService $access,
    ) {
    }

    public function build(Tenant $tenant, ?TenantMember $member): array
    {
        $accounts = $this->access->accessibleAccountsQuery($tenant, $member)
            ->active()
            ->get(['id', 'type', 'currency_code', 'current_balance']);

        $accessiblePocketIds = $this->access->accessiblePocketsQuery($tenant, $member)
            ->pluck('finance_pockets.id');

        $goals = FinanceSavingsGoal::query()
            ->forTenant($tenant->id)
            ->whereIn('pocket_id', $accessiblePocketIds)
            ->get(['id', 'target_amount', 'current_amount', 'status']);

        $wishes = WalletWish::query()
            ->forTenant($tenant->id)
            ->get(['id', 'estimated_amount', 'priority', 'status']);

        $currentMonth = now()->format('Y-m');
        $visibleTransactions = $this->access->visibleTransactionsQuery($tenant, $member)
            ->forMonth($currentMonth)
            ->where(function ($query) {
                $query->whereNull('is_internal_transfer')->orWhere('is_internal_transfer', false);
            });

        $totals = (clone $visibleTransactions)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount_base ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount_base ELSE 0 END), 0) as spending
            ")
            ->first();

        $totalAssets = (float) $accounts
            ->filter(fn ($account) => ! in_array($account->type, ['credit_card', 'paylater'], true))
            ->sum(fn ($account) => (float) $account->current_balance);

        $cashBankAssets = (float) $accounts
            ->filter(fn ($account) => in_array($account->type, ['cash', 'bank'], true))
            ->sum(fn ($account) => max((float) $account->current_balance, 0));

        $totalLiabilities = (float) $accounts
            ->filter(fn ($account) => in_array($account->type, ['credit_card', 'paylater'], true))
            ->sum(fn ($account) => abs((float) $account->current_balance));

        $lockedFunds = (float) $goals->sum(fn ($goal) => (float) $goal->current_amount);
        $freeFunds = max($totalAssets - $lockedFunds, 0);
        $income = (float) ($totals->income ?? 0);
        $spending = (float) ($totals->spending ?? 0);
        $monthlySaving = $income - $spending;
        $liquidityRatio = $totalAssets > 0 ? round(($cashBankAssets / $totalAssets) * 100, 1) : 0.0;
        $savingRate = $income > 0 ? round(($monthlySaving / $income) * 100, 1) : 0.0;
        $debtRatio = $totalAssets > 0 ? round(($totalLiabilities / $totalAssets) * 100, 1) : 0.0;

        $assetAllocation = $accounts
            ->filter(fn ($account) => ! in_array($account->type, ['credit_card', 'paylater'], true))
            ->groupBy('type')
            ->map(function ($group, $type) {
                return [
                    'label' => (string) $type,
                    'value' => (float) $group->sum(fn ($account) => max((float) $account->current_balance, 0)),
                ];
            })
            ->filter(fn (array $item) => $item['value'] > 0)
            ->values()
            ->all();

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

        return [
            'period_month' => $currentMonth,
            'total_assets' => round($totalAssets, 2),
            'cash_bank_assets' => round($cashBankAssets, 2),
            'total_liabilities' => round($totalLiabilities, 2),
            'net_worth' => round($totalAssets - $totalLiabilities, 2),
            'locked_funds' => round($lockedFunds, 2),
            'free_funds' => round($freeFunds, 2),
            'liquidity_ratio' => $liquidityRatio,
            'monthly_income' => round($income, 2),
            'monthly_spending' => round($spending, 2),
            'monthly_saving' => round($monthlySaving, 2),
            'saving_rate' => $savingRate,
            'debt_ratio' => $debtRatio,
            'debt_status_total' => round($totalLiabilities, 2),
            'high_priority_wishes' => (float) $wishes
                ->filter(fn ($wish) => $wish->priority === 'high' && $wish->status !== 'converted')
                ->sum(fn ($wish) => (float) $wish->estimated_amount),
            'goal_target_total' => (float) $goals->sum(fn ($goal) => (float) $goal->target_amount),
            'goal_current_total' => (float) $goals->sum(fn ($goal) => (float) $goal->current_amount),
            'asset_allocation' => $assetAllocation,
            'wishlist_quick_view' => $wishlistQuickView,
        ];
    }
}
