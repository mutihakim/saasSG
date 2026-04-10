export type FinanceScope = "private" | "shared";
export type FinanceAccountType = "cash" | "bank" | "ewallet" | "credit_card" | "paylater";
export type FinanceTransactionType = "pemasukan" | "pengeluaran" | "transfer";

export type FinanceCategory = {
    id: number;
    name: string;
    sub_type?: FinanceTransactionType | "all" | null;
    icon?: string | null;
    color?: string | null;
    is_default?: boolean;
};

export type FinanceCurrency = {
    id?: number;
    code: string;
    name: string;
    symbol?: string | null;
    symbol_position?: string | null;
    decimal_places?: number | null;
};

export type FinancePaymentMethodOption = {
    value: string;
    label: string;
    icon?: string | null;
};

export type FinanceMember = {
    id: number;
    full_name: string;
    role_code?: string | null;
};

export type FinanceMemberAccess = FinanceMember & {
    pivot?: {
        can_view?: boolean;
        can_use?: boolean;
        can_manage?: boolean;
    };
};

export type FinanceAccount = {
    id: string;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    member_access?: FinanceMemberAccess[];
    name: string;
    scope: FinanceScope;
    type: FinanceAccountType;
    currency_code: string;
    opening_balance?: number | string | null;
    current_balance?: number | string | null;
    available_balance?: number | string | null;
    goal_reserved_total?: number | string | null;
    allocated_amount?: number | string | null;
    unallocated_amount?: number | string | null;
    wallet_mismatch_amount?: number | string | null;
    period_inflow?: number | string | null;
    period_outflow?: number | string | null;
    total_inflow?: number | string | null;
    total_outflow?: number | string | null;
    notes?: string | null;
    is_active?: boolean;
    row_version?: number;
};

export type FinanceBudget = {
    id: string;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    member_access?: FinanceMemberAccess[];
    wallet_id?: string | null;
    wallet?: FinanceWallet | null;
    pocket?: FinanceWallet | null;
    name: string;
    code?: string | null;
    budget_key?: string | null;
    scope: FinanceScope;
    period_month: string;
    allocated_amount?: number | string | null;
    spent_amount?: number | string | null;
    remaining_amount?: number | string | null;
    notes?: string | null;
    is_active?: boolean;
    row_version?: number;
};

export type FinanceWalletType = string;
export type FinanceWalletPurpose = "spending" | "saving" | "income";
export type FinanceGoalStatus = "active" | "completed" | "paused";

export type FinanceWallet = {
    id: string;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    member_access?: FinanceMemberAccess[];
    real_account_id: string;
    real_account?: FinanceAccount | null;
    realAccount?: FinanceAccount | null;
    name: string;
    slug?: string | null;
    type: FinanceWalletType;
    purpose_type?: FinanceWalletPurpose;
    is_system?: boolean;
    scope: FinanceScope;
    currency_code: string;
    reference_code: string;
    icon_key?: string | null;
    default_budget_id?: string | null;
    default_budget_key?: string | null;
    default_budget?: FinanceBudget | null;
    budget_lock_enabled?: boolean;
    background_color?: string | null;
    target_amount?: number | string | null;
    current_balance?: number | string | null;
    available_balance?: number | string | null;
    goal_reserved_total?: number | string | null;
    goal_count?: number | null;
    period_inflow?: number | string | null;
    period_outflow?: number | string | null;
    total_inflow?: number | string | null;
    total_outflow?: number | string | null;
    notes?: string | null;
    is_active?: boolean;
    row_version?: number;
};

export type FinanceSavingsGoal = {
    id: string;
    wallet_id: string;
    wallet?: FinanceWallet | null;
    pocket?: FinanceWallet | null;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    ownerMember?: FinanceMember | null;
    name: string;
    target_amount: number | string;
    current_amount?: number | string | null;
    target_date?: string | null;
    status: FinanceGoalStatus;
    notes?: string | null;
    activities_count?: number;
    row_version?: number;
};

export type FinanceWish = {
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
