import { TransactionType } from "../components/pwa/types";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceMember, FinanceTransactionType, FinanceWallet } from "./wallet";

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
    wallet_id?: string | null;
    wallet?: FinanceWallet | null;
    pocket?: FinanceWallet | null;
    from_wallet_id?: string | null;
    to_wallet_id?: string | null;
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
    attachments_count?: number;
    tags: Array<FinanceTag | string>;
    attachments?: FinanceAttachment[];
    recurringRule?: FinanceRecurringRule | null;
    paired_transaction?: Partial<FinanceTransaction> | null;
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
    wallet_id: string;
    budget_id: string;
    type: "" | TransactionType;

    category_id: string;
    transaction_kind: "all" | "external" | "internal_transfer";
    month: string;
    date_from: string;
    date_to: string;
    use_custom_range: boolean;
};
