import { FinanceAccount, FinanceBudget, FinanceCurrency, FinanceMember, FinancePocket, FinanceSavingsGoal, FinanceTransaction } from "../Finance/types";

export type WalletWish = {
    id: string;
    title: string;
    description?: string | null;
    estimated_amount?: number | string | null;
    priority: "low" | "medium" | "high";
    status: "pending" | "approved" | "rejected" | "converted";
    image_url?: string | null;
    notes?: string | null;
    row_version?: number;
    owner_member?: FinanceMember | null;
    ownerMember?: FinanceMember | null;
    goal?: FinanceSavingsGoal | null;
};

export type WalletPermissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
    manageShared: boolean;
    managePrivateStructures: boolean;
};

export type WalletPageProps = {
    accounts: FinanceAccount[];
    pockets: FinancePocket[];
    budgets: FinanceBudget[];
    goals: FinanceSavingsGoal[];
    wishes: WalletWish[];
    summary: WalletSummary;
    monthlyReview: MonthlyReviewStatus;
    members: FinanceMember[];
    currencies: FinanceCurrency[];
    categories: any[];
    paymentMethods: any[];
    defaultCurrency: string;
    activeMemberId?: number | null;
    walletSubscribed: boolean;
    permissions: WalletPermissions;
    limits: {
        accounts: number | null;
        pockets: number | null;
        goals: number | null;
        wishes: number | null;
    };
};

export type WalletFormState = {
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
    member_access: import('../Finance/components/MemberAccessSelector').MemberAccessState[];
};

export type GoalFormState = {
    pocket_id: string;
    name: string;
    target_amount: string;
    target_date: string;
    status: "active" | "completed" | "paused";
    notes: string;
    row_version: number;
};

export type GoalFundFormState = {
    source_pocket_id: string;
    amount: string;
    transaction_date: string;
    description: string;
    notes: string;
};

export type GoalSpendFormState = {
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

export type GoalDetailPayload = {
    goal: FinanceSavingsGoal | null;
    activities: FinanceTransaction[];
};

export type WishFormState = {
    title: string;
    description: string;
    estimated_amount: string;
    priority: "low" | "medium" | "high";
    image_url: string;
    notes: string;
    row_version: number;
};

export type ConvertWishFormState = {
    wallet_id: string;
    target_amount: string;
    target_date: string;
    notes: string;
};

export type WalletMetricsItem = {
    label: string;
    value: string;
    tone?: "success" | "info" | "warning";
};

export type WalletSummary = {
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
        priority: WalletWish["priority"];
        status: WalletWish["status"];
    }>;
};

export type MonthlyReviewMonthStatus = {
    period_month: string;
    status: "open" | "in_review" | "closed";
    closed_at?: string | null;
};

export type MonthlyReviewStatus = {
    current_month: string;
    previous_month: string;
    previous_month_status: "open" | "in_review" | "closed";
    planning_blocked: boolean;
    eligible_months: MonthlyReviewMonthStatus[];
    suggested_period_month?: string | null;
};

export type MonthlyReviewAccountPreview = {
    id: string;
    name: string;
    type: string;
    currency_code: string;
    ending_balance: number;
    allocated_amount: number;
    unallocated_amount: number;
};

export type MonthlyReviewWalletPreview = {
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

export type MonthlyReviewGoalPreview = {
    id: string;
    name: string;
    pocket_id: string;
    pocket_name?: string | null;
};

export type MonthlyReviewSweepDraft = {
    source_pocket_id: string;
    action: "rollover" | "sweep_to_wallet" | "sweep_to_goal";
    amount: number | string;
    target_pocket_id?: string | null;
    goal_id?: string | null;
};

export type MonthlyReviewBudgetDraft = {
    budget_key: string;
    name: string;
    scope: "private" | "shared";
    owner_member_id?: number | null;
    pocket_id?: string | null;
    period_month: string;
    allocated_amount: number | string;
    existing_budget_id?: string | null;
};

export type MonthlyReviewPreview = {
    period_month: string;
    next_period_month: string;
    status: "open" | "in_review" | "closed";
    budget_method: "copy_last_month" | "average_3_months" | "zero_based";
    accounts: MonthlyReviewAccountPreview[];
    wallets: MonthlyReviewWalletPreview[];
    goals: MonthlyReviewGoalPreview[];
    sweep_actions: MonthlyReviewSweepDraft[];
    budget_drafts: MonthlyReviewBudgetDraft[];
};

export type GroupedWalletAccount = {
    account: FinanceAccount;
    wallets: FinancePocket[];
};
