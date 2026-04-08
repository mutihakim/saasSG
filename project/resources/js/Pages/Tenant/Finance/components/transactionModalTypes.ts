import { FinanceAccount, FinanceAttachment, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceMember, FinancePaymentMethodOption, FinancePocket, FinanceTransaction } from "../types";

export type TransactionSelectOption = {
    value: string;
    label: string;
};

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
    pocket_id: string;
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

export type TransactionAttachment = FinanceAttachment;

export type TransactionDraftPayload = Partial<TransactionFormData> & {
    merchant?: string;
};

export type TransactionModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: (transaction?: FinanceTransaction) => void;
    transaction?: FinanceTransaction;
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    defaultCurrency: string;
    paymentMethods: FinancePaymentMethodOption[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    pockets: FinancePocket[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    walletSubscribed?: boolean;
    canManageShared?: boolean;
    initialType?: "pemasukan" | "pengeluaran";
    initialDraft?: TransactionDraftPayload | null;
    draftMeta?: TransactionDraftMeta;
    lockedGroupMeta?: LockedGroupMeta;
};
