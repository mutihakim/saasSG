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
    pocket_id?: string | null;
    pocket?: FinancePocket | null;
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

export type FinancePocketType = string;
export type FinancePocketPurpose = "spending" | "saving" | "income";
export type FinanceGoalStatus = "active" | "completed" | "paused";

export type FinancePocket = {
    id: string;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    member_access?: FinanceMemberAccess[];
    real_account_id: string;
    real_account?: FinanceAccount | null;
    realAccount?: FinanceAccount | null;
    name: string;
    slug?: string | null;
    type: FinancePocketType;
    purpose_type?: FinancePocketPurpose;
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
    pocket_id: string;
    pocket?: FinancePocket | null;
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

export type FinanceTag = {
    id?: number | string;
    name: string;
    color?: string | null;
};

export type FinanceAttachment = {
    id: number | string;
    file_name?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
    preview_url?: string | null;
    status?: "processing" | "ready" | "failed";
    processing_error?: string | null;
    processed_at?: string | null;
};

export type FinanceRecurringRule = {
    frequency?: string | null;
    interval?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    next_run_at?: string | null;
    is_active?: boolean;
};

export type FinanceTransaction = {
    id: string;
    type: FinanceTransactionType;
    transaction_date: string;
    created_at?: string | null;
    amount: number | string;
    amount_base?: number | string;
    currency_code: string;
    exchange_rate?: number | string;
    description: string;
    category_id?: number | null;
    category?: FinanceCategory | null;
    owner_member_id?: number | null;
    owner_member?: FinanceMember | null;
    ownerMember?: FinanceMember | null;
    created_by?: number | null;
    createdBy?: FinanceMember | null;
    bank_account_id?: string | null;
    bank_account?: FinanceAccount | null;
    bankAccount?: FinanceAccount | null;
    pocket_id?: string | null;
    pocket?: FinancePocket | null;
    from_pocket_id?: string | null;
    to_pocket_id?: string | null;
    budget_id?: string | null;
    budget?: FinanceBudget | null;
    payment_method?: string | null;
    notes?: string | null;
    reference_number?: string | null;
    merchant_name?: string | null;
    location?: string | null;
    source_type?: string | null;
    source_id?: string | null;
    budget_status?: string | null;
    budget_delta?: number | string | null;
    is_internal_transfer?: boolean;
    transfer_direction?: "in" | "out" | null;
    transfer_pair_id?: string | null;
    row_version?: number;
    tags: Array<FinanceTag | string>;
    attachments?: FinanceAttachment[];
    recurringRule?: FinanceRecurringRule | null;
    paired_transaction?: Partial<FinanceTransaction> | null;
};

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

export type FinancePermissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
    manageShared: boolean;
    managePrivateStructures: boolean;
};

export type FinanceLimits = {
    accounts: { current: number; limit: number | null };
    budgets: { current: number; limit: number | null };
};

export type FinancePageProps = {
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    defaultCurrency: string;
    paymentMethods: FinancePaymentMethodOption[];
    members: FinanceMember[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    pockets: FinancePocket[];
    transferDestinationPockets: FinancePocket[];
    activeMemberId?: number | null;
    permissions: FinancePermissions;
    walletSubscribed: boolean;
    limits: FinanceLimits;
};

export type FinanceBatchDraft = {
    token: string;
    member_id?: number | null;
    member?: { full_name?: string | null } | null;
    confidence_score?: number | null;
    extracted_payload?: Record<string, unknown> | null;
    items?: Array<{
        sort_order: number;
        description: string;
        amount: number | null;
        currency_code: string | null;
        payload?: Record<string, unknown> | null;
    }>;
    media_preview_url?: string | null;
    media_items?: Array<{
        id: number;
        preview_url: string;
        mime_type?: string | null;
        size_bytes?: number | null;
    }>;
};

export type FinanceDeleteTarget = Partial<FinanceTransaction & FinanceAccount & FinanceBudget> & {
    sourceId?: string;
    summary?: string;
    transactions?: FinanceTransaction[];
};

export type FinanceFilterDraft = {
    search: string;
    owner_member_id: string;
    bank_account_id: string;
    pocket_id: string;
    type: "" | FinanceTransactionType;
    category_id: string;
    transaction_kind: "all" | "external" | "internal_transfer";
    month: string;
    date_from: string;
    date_to: string;
    use_custom_range: boolean;
};
