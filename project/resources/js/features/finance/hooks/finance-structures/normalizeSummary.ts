import { FinanceWalletSummary } from "../../types";

export const normalizeSummary = (summary: any, fallbackPeriodMonth?: string): FinanceWalletSummary => ({
    totalAssets: Number(summary?.totalAssets ?? summary?.total_assets ?? 0),
    cashBankAssets: Number(summary?.cashBankAssets ?? summary?.cash_bank_assets ?? 0),
    totalLiabilities: Number(summary?.totalLiabilities ?? summary?.total_liabilities ?? 0),
    netWorth: Number(summary?.netWorth ?? summary?.net_worth ?? 0),
    lockedFunds: Number(summary?.lockedFunds ?? summary?.locked_funds ?? 0),
    freeFunds: Number(summary?.freeFunds ?? summary?.free_funds ?? 0),
    liquidityRatio: Number(summary?.liquidityRatio ?? summary?.liquidity_ratio ?? 0),
    monthlyIncome: Number(summary?.monthlyIncome ?? summary?.monthly_income ?? 0),
    monthlySpending: Number(summary?.monthlySpending ?? summary?.monthly_spending ?? 0),
    monthlySaving: Number(summary?.monthlySaving ?? summary?.monthly_saving ?? 0),
    savingRate: Number(summary?.savingRate ?? summary?.saving_rate ?? 0),
    debtRatio: Number(summary?.debtRatio ?? summary?.debt_ratio ?? 0),
    debtStatusTotal: Number(summary?.debtStatusTotal ?? summary?.debt_status_total ?? 0),
    highPriorityWishes: Number(summary?.highPriorityWishes ?? summary?.high_priority_wishes ?? 0),
    goalTargetTotal: Number(summary?.goalTargetTotal ?? summary?.goal_target_total ?? 0),
    goalCurrentTotal: Number(summary?.goalCurrentTotal ?? summary?.goal_current_total ?? 0),
    assetAllocation: summary?.assetAllocation ?? summary?.asset_allocation ?? [],
    wishlistQuickView: summary?.wishlistQuickView ?? summary?.wishlist_quick_view ?? [],
    periodMonth: String(summary?.periodMonth ?? summary?.period_month ?? fallbackPeriodMonth ?? ""),
});
