import { FinanceReport, FinanceSummary } from "./report";
import { FinanceTransaction } from "./transaction";
import { FinanceBudget, FinanceSavingsGoal, FinanceWallet } from "./wallet";

export type FinanceBootstrapSection = "home" | "accounts" | "planning" | "review" | "transactions" | "reports";
export type FinanceBootstrapPlanningView = "budgets" | "goals" | "wishes";

export type FinanceBootstrapPayload = {
    section: FinanceBootstrapSection;
    view?: FinanceBootstrapPlanningView | null;
    period_month: string;
    cache_version: number;
    preloaded?: {
        accounts?: boolean;
        wallets?: boolean;
        pockets?: boolean;
        budgets?: boolean;
        goals?: boolean;
        wishes?: boolean;
        summary?: boolean;
        monthly_review?: boolean;
        transactions?: boolean;
        report?: boolean;
    };
    accounts?: import("./wallet").FinanceAccount[];
    wallets?: FinanceWallet[];
    pockets?: FinanceWallet[];
    budgets?: FinanceBudget[];
    goals?: FinanceSavingsGoal[];
    wishes?: any[];
    wallet_summary?: Record<string, unknown> | null;
    monthly_review?: Record<string, unknown> | null;
    finance_summary?: FinanceSummary | null;
    transactions?: FinanceTransaction[];
    transactions_meta?: {
        current_page?: number;
        per_page?: number;
        total?: number;
        last_page?: number;
        has_more?: boolean;
    } | null;
    report?: FinanceReport | null;
};
