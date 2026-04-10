import { FinanceAccount, FinanceScope, FinanceWish } from "./wallet";

export type FinanceSummary = {
    base_currency: string;
    total_income_base: number;
    total_expense_base: number;
    balance_base: number;
    transfer_total_base?: number;
    transaction_count: number;
    top_expense_categories?: Array<{
        id?: number | string;
        name: string;
        icon?: string | null;
        color?: string | null;
        amount: number;
        pct: number;
    }>;
};

export type FinanceReportSeriesPoint = {
    bucket: string;
    income: number;
    expense: number;
    transfer: number;
};

export type FinanceCategoryBreakdownItem = {
    name: string;
    amount: number;
    color?: string | null;
    icon?: string | null;
};

export type FinanceAccountBreakdownItem = {
    name: string;
    income: number;
    expense: number;
    transfer: number;
    net: number;
};

export type FinanceBudgetUsageItem = {
    id: string;
    name: string;
    period_month: string;
    allocated_amount: number;
    spent_amount: number;
    remaining_amount: number;
    scope: FinanceScope;
};

export type FinanceReport = {
    filters: {
        date_from: string;
        date_to: string;
        group_by: "day" | "week" | "month";
    };
    totals: {
        income: number;
        expense: number;
        transfer: number;
        count: number;
    };
    trend: FinanceReportSeriesPoint[];
    expense_by_category: FinanceCategoryBreakdownItem[];
    income_by_category: FinanceCategoryBreakdownItem[];
    account_breakdown: FinanceAccountBreakdownItem[];
    budget_usage: FinanceBudgetUsageItem[];
};

export type FinanceMetricsItem = {
    label: string;
    value: string;
    tone?: "success" | "info" | "warning";
};

export type FinanceWalletSummary = {
    periodMonth?: string;
    totalAssets: number;
    cashBankAssets?: number;
    totalLiabilities: number;
    netWorth: number;
    lockedFunds: number;
    freeFunds?: number;
    liquidityRatio?: number;
    monthlyIncome?: number;
    monthlySpending?: number;
    monthlySaving?: number;
    savingRate?: number;
    debtRatio?: number;
    debtStatusTotal?: number;
    goalTargetTotal?: number;
    goalCurrentTotal?: number;
    highPriorityWishes: number;
    assetAllocation?: Array<{
        label: FinanceAccount["type"] | string;
        value: number;
    }>;
    wishlistQuickView?: Array<{
        id: string;
        estimated_amount: number;
        priority: FinanceWish["priority"];
        status: FinanceWish["status"];
    }>;
};
