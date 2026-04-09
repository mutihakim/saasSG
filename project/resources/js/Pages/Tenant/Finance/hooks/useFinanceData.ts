import axios from "axios";
import { useCallback, useRef, useState } from "react";

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
    activeSection: "transactions" | "reports";
    filters: FinanceFilters;
    apiParams: Record<string, string>;
    tenantRoute: TenantRouteLike;
    loadErrorMessage: string;
    preloaded?: {
        accounts?: boolean;
        budgets?: boolean;
        pockets?: boolean;
    };
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
    activeSection,
    filters,
    apiParams,
    tenantRoute,
    loadErrorMessage,
    preloaded,
}: UseFinanceDataArgs) => {
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [accounts, setAccounts] = useState<FinanceAccount[]>(seededAccounts ?? []);
    const [budgets, setBudgets] = useState<FinanceBudget[]>(seededBudgets ?? []);
    const [pockets, setPockets] = useState<FinancePocket[]>(seededPockets ?? []);
    const [loading, setLoading] = useState(activeSection !== "reports");
    const [summaryLoading, setSummaryLoading] = useState(activeSection !== "reports");
    const [errorState, setErrorState] = useState<string | null>(null);
    const [transactionsMeta, setTransactionsMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        hasMore: false,
    });
    const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
    const loadedRef = useRef({
        accounts: Boolean(preloaded?.accounts),
        budgets: Boolean(preloaded?.budgets),
        pockets: Boolean(preloaded?.pockets),
    });
    const dataRef = useRef({
        accounts: seededAccounts ?? [],
        budgets: seededBudgets ?? [],
        pockets: seededPockets ?? [],
    });

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

    const fetchAccounts = useCallback(async (force = false) => {
        if (!force && loadedRef.current.accounts) {
            return dataRef.current.accounts;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/accounts"));
        const nextAccounts = response.data.data?.accounts || [];
        setAccounts(nextAccounts);
        dataRef.current.accounts = nextAccounts;
        loadedRef.current.accounts = true;

        return nextAccounts;
    }, [tenantRoute]);

    const fetchBudgets = useCallback(async (force = false) => {
        if (!force && loadedRef.current.budgets) {
            return dataRef.current.budgets;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/budgets"), {
            params: filters.use_custom_range ? undefined : { period_month: filters.month },
        });
        const nextBudgets = response.data.data?.budgets || [];
        setBudgets(nextBudgets);
        dataRef.current.budgets = nextBudgets;
        loadedRef.current.budgets = true;

        return nextBudgets;
    }, [filters.month, filters.use_custom_range, tenantRoute]);

    const fetchPockets = useCallback(async (force = false) => {
        if (!walletSubscribed) {
            setPockets(seededPockets ?? []);
            dataRef.current.pockets = seededPockets ?? [];
            loadedRef.current.pockets = true;
            return seededPockets ?? [];
        }

        if (!force && loadedRef.current.pockets) {
            return dataRef.current.pockets;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/pockets"));
        const nextPockets = response.data.data?.pockets || [];
        setPockets(nextPockets);
        dataRef.current.pockets = nextPockets;
        loadedRef.current.pockets = true;

        return nextPockets;
    }, [seededPockets, tenantRoute, walletSubscribed]);

    // Entity-scoped refresh function - only fetches affected data
    const refreshFinanceEntity = useCallback(async (entityType: 'transaction' | 'account' | 'budget' | 'pocket' | 'all') => {
        const promises: Promise<unknown>[] = [];
        
        // Summary is always needed for most mutations
        promises.push(fetchSummary());
        
        switch (entityType) {
            case 'transaction':
                // Transaction mutations affect summary only
                break;
            case 'account':
                promises.push(fetchAccounts(true));
                break;
            case 'budget':
                promises.push(fetchBudgets(true));
                break;
            case 'pocket':
                promises.push(fetchPockets(true));
                break;
            case 'all':
                // Legacy behavior for complex mutations
                promises.push(fetchAccounts(true), fetchBudgets(true), fetchPockets(true));
                break;
        }
        
        await Promise.all(promises);
    }, [fetchSummary, fetchAccounts, fetchBudgets, fetchPockets]);

    // Legacy refresh function for backward compatibility
    const refreshFinanceSideData = useCallback(async () => {
        await refreshFinanceEntity('all');
    }, [refreshFinanceEntity]);

    const loadFinance = useCallback(async (options?: LoadFinanceOptions) => {
        if (activeSection === "reports") {
            setErrorState(null);
            setLoading(false);
            setSummaryLoading(false);
            return;
        }

        const preserveTransactions = options?.preserveTransactions ?? false;
        const silentSummary = options?.silentSummary ?? false;
        const silentLoading = options?.silentLoading ?? false;
        const forceSideData = preserveTransactions;

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
                fetchPockets(forceSideData),
            ]);

            if (activeSection !== "transactions") {
                await Promise.all([
                    fetchAccounts(forceSideData),
                    fetchBudgets(forceSideData),
                ]);
            }
        } catch (error: any) {
            const parsed = parseApiError(error, loadErrorMessage);
            setErrorState(parsed.detail || parsed.title);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            if (!silentLoading) {
                setLoading(false);
            }
        }
    }, [activeSection, fetchAccounts, fetchBudgets, fetchPockets, fetchSummary, fetchTransactions, loadErrorMessage]);

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
        fetchPockets,
        refreshFinanceSideData,
        refreshFinanceEntity,
        loadFinance,
        loadMoreTransactions,
    };
};
