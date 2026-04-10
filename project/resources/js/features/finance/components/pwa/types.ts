export type MainTab = "transactions" | "budget" | "stats" | "report";
export type MoreView = "menu" | "budgets" | "reports";
export type TransactionType = "pemasukan" | "pengeluaran" | "transfer";
export type TransactionKind = "all" | "external" | "internal_transfer";
export type FinancePlanningTab = "dashboard" | "accounts" | "budgets" | "wishes" | "goals";

export type FinanceFilters = {
    search: string;
    owner_member_id: string;
    bank_account_id: string;
    wallet_id: string;
    budget_id: string;
    type: "" | TransactionType;
    category_id: string;
    transaction_kind: TransactionKind;
    month: string;
    date_from: string;
    date_to: string;
    use_custom_range: boolean;
};

export const SURFACE_BG = "#F8F9FA";
export const CARD_RADIUS = 16;
export const NAV_BOTTOM_SPACE = 128;
export const FINANCE_TOPBAR_HEIGHT = 52;
export const FINANCE_TOPBAR_STICKY_OFFSET = 118;
export const FINANCE_TOPBAR_CONTENT_OFFSET = 140;
export const WALLET_SURFACE_BG = "#F6F8FB";

export function formatAmount(value: number, currencyCode: string) {
    return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
}

export function formatCurrency(value: number | string | null | undefined, currency = "IDR") {
    return `${currency} ${Number(value || 0).toLocaleString("id-ID")}`;
}

export function toMonthLabel(value: string) {
    const [year, month] = value.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
    });
}

export function formatDateLabel(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function monthLabel(value: Date) {
    return value.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
