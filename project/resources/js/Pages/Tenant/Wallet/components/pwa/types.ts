export type WalletTab = "dashboard" | "accounts" | "budgets" | "wishes" | "goals";

export const WALLET_SURFACE_BG = "#F6F8FB";

export function formatCurrency(value: number | string | null | undefined, currency = "IDR") {
    return `${currency} ${Number(value || 0).toLocaleString("id-ID")}`;
}

export function monthLabel(value: Date) {
    return value.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
