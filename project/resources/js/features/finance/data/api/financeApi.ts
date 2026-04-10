import axios from "axios";

import { FinanceBootstrapPayload, FinanceBootstrapPlanningView, FinanceBootstrapSection } from "../../types";
import { financeCache, financeCacheTtl } from "../cache/financeCache";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type FinanceBootstrapParams = {
    section: FinanceBootstrapSection;
    view?: FinanceBootstrapPlanningView;
    month?: string;
    per_page?: number;
    page?: number;
    search?: string;
    type?: string;
    category_id?: string;
    currency_code?: string;
    payment_method?: string;
    bank_account_id?: string;
    wallet_id?: string;
    budget_id?: string;
    owner_member_id?: string;
    date_from?: string;
    date_to?: string;
    transaction_kind?: "all" | "external" | "internal_transfer";
    group_by?: "day" | "week" | "month";
};

const pendingBootstrapRequests = new Map<string, Promise<FinanceBootstrapPayload>>();

const normalizeParams = (params: FinanceBootstrapParams): Array<[string, string]> => (
    Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]): [string, string] => [key, String(value)])
        .sort(([left], [right]) => left.localeCompare(right))
);

const buildBootstrapCacheKey = (tenantRoute: TenantRouteLike, params: FinanceBootstrapParams): string => {
    const normalized = normalizeParams(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");

    return `${tenantRoute.apiTo("/finance")}:bootstrap:${normalized}`;
};

export const fetchFinanceBootstrap = async (
    tenantRoute: TenantRouteLike,
    params: FinanceBootstrapParams,
): Promise<FinanceBootstrapPayload> => {
    const cacheKey = buildBootstrapCacheKey(tenantRoute, params);
    const cached = financeCache.get<FinanceBootstrapPayload>(cacheKey);
    if (cached) {
        return cached;
    }

    const inFlight = pendingBootstrapRequests.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const request = axios.get(tenantRoute.apiTo("/finance/bootstrap"), { params })
        .then((response) => {
            const payload = (response.data?.data ?? {}) as FinanceBootstrapPayload;
            financeCache.set(cacheKey, payload, financeCacheTtl.short);
            return payload;
        })
        .finally(() => {
            pendingBootstrapRequests.delete(cacheKey);
        });

    pendingBootstrapRequests.set(cacheKey, request);

    return request;
};

export const fetchFinanceAccounts = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/accounts"));
    return response.data?.data?.accounts ?? [];
};

export const fetchFinanceWallets = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/wallets"));
    return response.data?.data?.wallets ?? [];
};

export const fetchFinanceBudgets = async (tenantRoute: TenantRouteLike, periodMonth: string) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/budgets"), { params: { period_month: periodMonth } });
    return response.data?.data?.budgets ?? [];
};

export const fetchFinanceGoals = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/goals"));
    return response.data?.data?.goals ?? [];
};

export const fetchFinanceWishes = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/wishes"));
    return response.data?.data?.wishes ?? [];
};

export const fetchFinanceWalletSummary = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/wallet-summary"));
    return response.data?.data?.summary ?? null;
};

export const fetchFinanceMonthlyReviewStatus = async (tenantRoute: TenantRouteLike) => {
    const response = await axios.get(tenantRoute.apiTo("/finance/monthly-review/status"));
    return response.data?.data?.monthly_review ?? null;
};
