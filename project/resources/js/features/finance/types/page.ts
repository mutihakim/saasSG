import { MainTab } from "../components/pwa/types";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceMember, FinancePaymentMethodOption, FinanceWallet } from "./wallet";

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

export type FinanceRouteMeta = {
    section: "transactions" | "reports";
    initial_tab: MainTab;
    title: string;
    back_href?: string | null;
    preloaded?: {
        accounts?: boolean;
        budgets?: boolean;
        wallets?: boolean;
        pockets?: boolean;
    };
};

export type FinancePageProps = {
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    defaultCurrency: string;
    paymentMethods: FinancePaymentMethodOption[];
    members: FinanceMember[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    wallets: FinanceWallet[];
    pockets?: FinanceWallet[];
    transferDestinationPockets: FinanceWallet[];
    activeMemberId?: number | null;
    permissions: FinancePermissions;
    walletSubscribed: boolean;
    limits: FinanceLimits;
    financeRoute?: FinanceRouteMeta;
};

export type FinancePlanningRouteMeta = {
    section: "home" | "accounts" | "planning" | "review";
    initial_tab: "dashboard" | "accounts" | "budgets" | "wishes" | "goals";
    title: string;
    entity_label: string;
    payload_strategy?: "eager" | "deferred";
    back_href?: string | null;
    open_monthly_review?: boolean;
    period_month?: string | null;
    preloaded?: {
        accounts?: boolean;
        wallets?: boolean;
        pockets?: boolean;
        budgets?: boolean;
        goals?: boolean;
        wishes?: boolean;
        summary?: boolean;
        monthly_review?: boolean;
    };
};
