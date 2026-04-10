import type { MemberAccessState } from "../components/MemberAccessSelector";

import { FinanceTransaction } from "./transaction";
import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceMember, FinancePaymentMethodOption, FinanceSavingsGoal, FinanceWallet, FinanceWish } from "./wallet";

export type FinanceWalletFormState = {
    name: string;
    type: string;
    purpose_type: "spending" | "saving" | "income";
    scope: "private" | "shared";
    real_account_id: string;
    owner_member_id: string;
    default_budget_id: string;
    default_budget_key: string;
    budget_lock_enabled: boolean;
    icon_key: string;
    notes: string;
    background_color: string;
    row_version: number;
    member_access: MemberAccessState[];
};

export type FinanceGoalFormState = {
    wallet_id: string;
    name: string;
    target_amount: string;
    target_date: string;
    status: "active" | "completed" | "paused";
    notes: string;
    row_version: number;
};

export type FinanceGoalFundFormState = {
    source_wallet_id: string;
    amount: string;
    transaction_date: string;
    description: string;
    notes: string;
};

export type FinanceGoalSpendFormState = {
    amount: string;
    transaction_date: string;
    category_id: string;
    budget_id: string;
    payment_method: string;
    description: string;
    merchant_name: string;
    reference_number: string;
    location: string;
    notes: string;
};

export type FinanceGoalDetailPayload = {
    goal: FinanceSavingsGoal | null;
    activities: FinanceTransaction[];
};

export type FinanceWishFormState = {
    title: string;
    description: string;
    estimated_amount: string;
    priority: "low" | "medium" | "high";
    image_url: string;
    notes: string;
    row_version: number;
};

export type FinanceWishConvertFormState = {
    wallet_id: string;
    target_amount: string;
    target_date: string;
    notes: string;
};

export type FinancePlanningLimits = {
    accounts: number | null;
    wallets: number | null;
    goals: number | null;
    wishes: number | null;
};

export type FinanceMonthlyReviewMonthStatus = {
    period_month: string;
    status: "open" | "in_review" | "closed";
    closed_at?: string | null;
};

export type FinanceMonthlyReviewStatus = {
    current_month: string;
    previous_month: string;
    previous_month_status: "open" | "in_review" | "closed";
    planning_blocked: boolean;
    eligible_months: FinanceMonthlyReviewMonthStatus[];
    suggested_period_month?: string | null;
};

export type FinanceMonthlyReviewAccountPreview = {
    id: string;
    name: string;
    type: string;
    currency_code: string;
    ending_balance: number;
    allocated_amount: number;
    unallocated_amount: number;
};

export type FinanceMonthlyReviewWalletPreview = {
    id: string;
    name: string;
    scope: string;
    is_system: boolean;
    real_account_id: string;
    real_account_name?: string | null;
    owner_member_name?: string | null;
    ending_balance: number;
    period_inflow: number;
    period_outflow: number;
    suggested_action: "rollover" | "sweep_to_wallet" | "sweep_to_goal";
    suggested_amount: number;
};

export type FinanceMonthlyReviewGoalPreview = {
    id: string;
    name: string;
    wallet_id: string;
    pocket_name?: string | null;
};

export type FinanceMonthlyReviewSweepDraft = {
    source_wallet_id: string;
    action: "rollover" | "sweep_to_wallet" | "sweep_to_goal";
    amount: number | string;
    target_wallet_id?: string | null;
    goal_id?: string | null;
};

export type FinanceMonthlyReviewBudgetDraft = {
    budget_key: string;
    name: string;
    scope: "private" | "shared";
    owner_member_id?: number | null;
    wallet_id?: string | null;
    period_month: string;
    allocated_amount: number | string;
    existing_budget_id?: string | null;
};

export type FinanceMonthlyReviewPreview = {
    period_month: string;
    next_period_month: string;
    status: "open" | "in_review" | "closed";
    budget_method: "copy_last_month" | "average_3_months" | "zero_based";
    accounts: FinanceMonthlyReviewAccountPreview[];
    wallets: FinanceMonthlyReviewWalletPreview[];
    goals: FinanceMonthlyReviewGoalPreview[];
    sweep_actions: FinanceMonthlyReviewSweepDraft[];
    budget_drafts: FinanceMonthlyReviewBudgetDraft[];
};

export type FinanceGroupedAccountPockets = {
    account: FinanceAccount;
    wallets: FinanceWallet[];
};

export type FinancePlanningPageProps = {
    accounts: FinanceAccount[];
    wallets: FinanceWallet[];
    pockets?: FinanceWallet[];
    budgets: FinanceBudget[];
    goals: FinanceSavingsGoal[];
    wishes: FinanceWish[];
    summary: import("./report").FinanceWalletSummary;
    monthlyReview: FinanceMonthlyReviewStatus | null;
    members: FinanceMember[];
    currencies: FinanceCurrency[];
    categories: FinanceCategory[];
    paymentMethods: FinancePaymentMethodOption[];
    defaultCurrency: string;
    activeMemberId?: number | null;
    walletSubscribed: boolean;
    permissions: import("./page").FinancePermissions;
    limits: FinancePlanningLimits;
    financeRoute?: import("./page").FinancePlanningRouteMeta;
};
