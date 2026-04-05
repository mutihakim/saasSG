export type TransactionDraftMeta = {
    source?: string | null;
    confidenceScore?: number | null;
    mediaPreviewUrl?: string | null;
    mediaItems?: Array<{
        id: number;
        preview_url: string;
        mime_type?: string | null;
        size_bytes?: number | null;
    }>;
} | null;

export type LockedGroupMeta = {
    sourceType: string;
    sourceId: string;
    merchantName?: string | null;
    label?: string | null;
} | null;

export type TransactionFormData = {
    type: "pemasukan" | "pengeluaran";
    owner_member_id: string;
    transaction_date: string;
    amount: string;
    currency_code: string;
    category_id: string;
    bank_account_id: string;
    budget_id: string;
    payment_method: string;
    description: string;
    tags: string[];
    exchange_rate: string;
    merchant_name: string;
    location: string;
    notes: string;
    reference_number: string;
    source_type: string;
    source_id: string;
    row_version: number;
};

export type TransactionAttachment = {
    id: number | string;
    file_name?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
    preview_url?: string | null;
};
