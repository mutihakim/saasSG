import axios from "axios";
import { useCallback, useState } from "react";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { FinanceFilters } from "../components/pwa/types";
import { FinanceAccount, FinanceBudget, FinancePocket, FinanceSummary, FinanceTransaction } from "../types";

const TRANSACTION_PAGE_SIZE = 10;

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type UseFinanceDataArgs = {
    seededAccounts: FinanceAccount[];
    seededBudgets: FinanceBudget[];
    seededPockets: FinancePocket[];
    walletSubscribed: boolean;
    filters: FinanceFilters;
    apiParams: Record<string, string>;
    tenantRoute: TenantRouteLike;
    loadErrorMessage: string;
};

type LoadFinanceOptions = {
    preserveTransactions?: boolean;
    silentSummary?: boolean;
    silentLoading?: boolean;
};

export const useFinanceData = ({
    seededAccounts,
    seededBudgets,
    seededPockets,
    walletSubscribed,
    filters,
    apiParams,
    tenantRoute,
    loadErrorMessage,
}: UseFinanceDataArgs) => {
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [accounts, setAccounts] = useState<FinanceAccount[]>(seededAccounts ?? []);
    const [budgets, setBudgets] = useState<FinanceBudget[]>(seededBudgets ?? []);
    const [pockets, setPockets] = useState<FinancePocket[]>(seededPockets ?? []);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [errorState, setErrorState] = useState<string | null>(null);
    const [transactionsMeta, setTransactionsMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        hasMore: false,
    });
    const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);

    const mergeTransactionPage = useCallback((pageItems: FinanceTransaction[], replace: boolean) => {
        setTransactions((prev) => {
            const source = replace ? [] : prev;
            const merged = [...source, ...pageItems];
            const deduped = new Map<string, FinanceTransaction>();
            merged.forEach((item) => {
                if (item?.id) {
                    deduped.set(String(item.id), item);
                }
            });
            return Array.from(deduped.values());
        });
    }, []);

    const fetchTransactions = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await axios.get(tenantRoute.apiTo("/finance/transactions"), {
            params: {
                ...apiParams,
                page,
                per_page: TRANSACTION_PAGE_SIZE,
            },
        });

        const payload = response.data.data || {};
        const pageItems = Array.isArray(payload.transactions) ? payload.transactions as FinanceTransaction[] : [];
        const meta = payload.meta || {};

        mergeTransactionPage(pageItems, replace);
        setTransactionsMeta({
            currentPage: Number(meta.current_page || page),
            lastPage: Number(meta.last_page || page),
            total: Number(meta.total || pageItems.length),
            hasMore: Boolean(meta.has_more ?? (Number(meta.current_page || page) < Number(meta.last_page || page))),
        });
    }, [apiParams, mergeTransactionPage, tenantRoute]);

    const fetchSummary = useCallback(async (options?: { silent?: boolean }) => {
        if (!options?.silent) {
            setSummaryLoading(true);
        }
        try {
            const response = await axios.get(tenantRoute.apiTo("/finance/summary"), { params: apiParams });
            setSummary((response.data.data || null) as FinanceSummary | null);
        } finally {
            setSummaryLoading(false);
        }
    }, [apiParams, tenantRoute]);

    const fetchAccounts = useCallback(async () => {
        const response = await axios.get(tenantRoute.apiTo("/finance/accounts"));
        setAccounts(response.data.data?.accounts || []);
    }, [tenantRoute]);

    const fetchBudgets = useCallback(async () => {
        const response = await axios.get(tenantRoute.apiTo("/finance/budgets"), {
            params: filters.use_custom_range ? undefined : { period_month: filters.month },
        });
        setBudgets(response.data.data?.budgets || []);
    }, [filters.month, filters.use_custom_range, tenantRoute]);

    const fetchPockets = useCallback(async () => {
        if (!walletSubscribed) {
            setPockets(seededPockets ?? []);
            return;
        }

        const response = await axios.get(tenantRoute.apiTo("/wallet/pockets"));
        setPockets(response.data.data?.pockets || []);
    }, [seededPockets, tenantRoute, walletSubscribed]);

    const refreshFinanceSideData = useCallback(async () => {
        await Promise.all([fetchSummary(), fetchAccounts(), fetchBudgets(), fetchPockets()]);
    }, [fetchAccounts, fetchBudgets, fetchPockets, fetchSummary]);

    const loadFinance = useCallback(async (options?: LoadFinanceOptions) => {
        const preserveTransactions = options?.preserveTransactions ?? false;
        const silentSummary = options?.silentSummary ?? false;
        const silentLoading = options?.silentLoading ?? false;

        if (!silentLoading) {
            setLoading(true);
        }
        setErrorState(null);
        try {
            if (!preserveTransactions) {
                setTransactions([]);
                setTransactionsMeta({
                    currentPage: 1,
                    lastPage: 1,
                    total: 0,
                    hasMore: false,
                });
            }
            await Promise.all([
                fetchTransactions(1, { replace: true }),
                fetchSummary({ silent: silentSummary }),
                fetchAccounts(),
                fetchBudgets(),
                fetchPockets(),
            ]);
        } catch (error: any) {
            const parsed = parseApiError(error, loadErrorMessage);
            setErrorState(parsed.detail || parsed.title);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            if (!silentLoading) {
                setLoading(false);
            }
        }
    }, [fetchAccounts, fetchBudgets, fetchPockets, fetchSummary, fetchTransactions, loadErrorMessage]);

    const loadMoreTransactions = useCallback(async () => {
        if (loading || loadingMoreTransactions || !transactionsMeta.hasMore) {
            return;
        }

        setLoadingMoreTransactions(true);
        try {
            await fetchTransactions(transactionsMeta.currentPage + 1, { replace: false });
        } catch (error: any) {
            const parsed = parseApiError(error, loadErrorMessage);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoadingMoreTransactions(false);
        }
    }, [fetchTransactions, loadErrorMessage, loading, loadingMoreTransactions, transactionsMeta.currentPage, transactionsMeta.hasMore]);

    return {
        transactions,
        setTransactions,
        summary,
        accounts,
        setAccounts,
        budgets,
        setBudgets,
        pockets,
        setPockets,
        loading,
        summaryLoading,
        errorState,
        transactionsMeta,
        loadingMoreTransactions,
        fetchTransactions,
        fetchSummary,
        fetchAccounts,
        fetchBudgets,
        refreshFinanceSideData,
        loadFinance,
        loadMoreTransactions,
    };
};
