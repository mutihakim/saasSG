import { useCallback, useRef, useState } from "react";

import { FinanceFilters } from "../components/pwa/types";
import { fetchFinanceBootstrap } from "../data/api/financeApi";
import { financeCache } from "../data/cache/financeCache";
import { FinanceAccount, FinanceBudget, FinanceWallet, FinanceTransaction } from "../types";

import { useFinanceSummaryData } from "./finance-data/useFinanceSummaryData";
import { useFinanceTransactionsData } from "./finance-data/useFinanceTransactionsData";
import { useFinanceBootstrapAdapter } from "./finance-structures/useFinanceBootstrapAdapter";
import { useFinanceStructureFetchers } from "./finance-structures/useFinanceStructureFetchers";
import { useFinanceStructureState } from "./finance-structures/useFinanceStructureState";

import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

const TRANSACTION_PAGE_SIZE = 10;

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type UseFinanceDataArgs = {
    seededAccounts: FinanceAccount[];
    seededBudgets: FinanceBudget[];
    seededPockets: FinanceWallet[];
    _walletSubscribed: boolean;
    activeSection: "transactions" | "reports";
    filters: FinanceFilters;
    apiParams: Record<string, string>;
    tenantRoute: TenantRouteLike;
    loadErrorMessage: string;
    preloaded?: {
        accounts?: boolean;
        budgets?: boolean;
        wallets?: boolean;
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
    _walletSubscribed,
    activeSection,
    filters,
    apiParams,
    tenantRoute,
    loadErrorMessage,
    preloaded,
}: UseFinanceDataArgs) => {
    const cachePrefix = `${tenantRoute.apiTo("/finance")}:`;
    const summaryCacheKey = `${cachePrefix}summary:${JSON.stringify(apiParams)}`;

    // 1. Transactions & Summary Hooks
    const {
        transactions,
        setTransactions,
        transactionsMeta,
        setTransactionsMeta,
        loadingMoreTransactions,
        fetchTransactions,
        loadMoreTransactions: loadMoreTransactionsWithGuard,
    } = useFinanceTransactionsData({
        tenantRoute,
        apiParams,
        loadErrorMessage,
    });

    const {
        summary,
        setSummary,
        summaryLoading,
        setSummaryLoading,
        fetchSummary,
    } = useFinanceSummaryData({
        tenantRoute,
        apiParams,
        summaryCacheKey,
        initialLoading: activeSection !== "reports",
    });

    // 2. Structures state & fetchers (Shared with StructuresData hook)
    const structureState = useFinanceStructureState({
        seededAccounts,
        seededPockets,
        seededBudgets,
        seededGoals: [], // Not needed in main finance data
        seededWishes: [],  // Not needed in main finance data
        seededSummary: {} as any, // Handled by useFinanceSummaryData
        seededMonthlyReview: {} as any,
        periodMonth: filters.month,
        preloaded,
    });

    const structureFetchers = useFinanceStructureFetchers({
        setAccounts: structureState.setAccounts,
        setWallets: structureState.setWallets,
        setBudgets: structureState.setBudgets,
        setGoals: structureState.setGoals,
        setWishes: structureState.setWishes,
        setSummary: structureState.setSummary,
        setMonthlyReview: structureState.setMonthlyReview,
        loadedRef: structureState.loadedRef,
        dataRef: structureState.dataRef,
        budgetCacheRef: structureState.budgetCacheRef,
        loadedBudgetMonthsRef: structureState.loadedBudgetMonthsRef,
    }, filters.month);

    const { applyBootstrapPayload: applyStructuresBootstrap } = useFinanceBootstrapAdapter({
        ...structureFetchers,
        setAccounts: structureState.setAccounts,
        setWallets: structureState.setWallets,
        setBudgets: structureState.setBudgets,
        setGoals: structureState.setGoals,
        setWishes: structureState.setWishes,
        setSummary: structureState.setSummary,
        setMonthlyReview: structureState.setMonthlyReview,
        loadedRef: structureState.loadedRef,
        dataRef: structureState.dataRef,
        budgetCacheRef: structureState.budgetCacheRef,
        loadedBudgetMonthsRef: structureState.loadedBudgetMonthsRef,
    }, filters.month);

    // 3. Main orchestration state
    const [loading, setLoading] = useState(activeSection !== "reports");
    const [errorState, setErrorState] = useState<string | null>(null);
    const cacheVersionRef = useRef<number | null>(null);

    const invalidateOnVersionChange = useCallback((nextVersion?: number | null) => {
        if (!nextVersion || Number.isNaN(nextVersion)) {
            return;
        }

        if (cacheVersionRef.current !== null && cacheVersionRef.current !== nextVersion) {
            financeCache.invalidatePrefix(cachePrefix);
        }

        cacheVersionRef.current = nextVersion;
    }, [cachePrefix]);

    const applyBootstrapPayload = useCallback((payload: any) => {
        invalidateOnVersionChange(Number(payload?.cache_version || 0));

        if (Array.isArray(payload?.transactions)) {
            const pageItems = payload.transactions as FinanceTransaction[];
            setTransactions(pageItems);
            setTransactionsMeta({
                currentPage: Number(payload?.transactions_meta?.current_page || 1),
                lastPage: Number(payload?.transactions_meta?.last_page || 1),
                total: Number(payload?.transactions_meta?.total || pageItems.length),
                hasMore: Boolean(payload?.transactions_meta?.has_more ?? false),
            });
        }

        if (payload?.finance_summary) {
            setSummary(payload.finance_summary);
            setSummaryLoading(false);
            // Cache is handled inside summary fetcher/adapter usually, but we keep compatibility
        }

        applyStructuresBootstrap(payload);
    }, [applyStructuresBootstrap, invalidateOnVersionChange, setSummary, setSummaryLoading, setTransactions, setTransactionsMeta]);

    const refreshFinanceEntity = useCallback(async (entityType: 'transaction' | 'account' | 'budget' | 'wallet' | 'pocket' | 'all') => {
        const promises: Promise<unknown>[] = [];
        promises.push(fetchSummary());
        
        switch (entityType) {
            case 'account':
                promises.push(structureFetchers.fetchAccounts(true));
                break;
            case 'budget':
                promises.push(structureFetchers.fetchBudgets(filters.month, true));
                break;
            case 'wallet':
            case 'pocket':
                promises.push(structureFetchers.fetchWallets(true));
                break;
            case 'all':
                promises.push(
                    structureFetchers.fetchAccounts(true), 
                    structureFetchers.fetchBudgets(filters.month, true), 
                    structureFetchers.fetchWallets(true)
                );
                break;
        }
        await Promise.all(promises);
    }, [fetchSummary, filters.month, structureFetchers]);

    const loadFinance = useCallback(async (options?: LoadFinanceOptions) => {
        if (activeSection === "reports") {
            setErrorState(null);
            setLoading(false);
            setSummaryLoading(false);
            return;
        }

        const silentLoading = options?.silentLoading ?? false;
        if (!silentLoading) setLoading(true);
        setErrorState(null);

        try {
            let bootstrapPayload: any = null;
            try {
                bootstrapPayload = await fetchFinanceBootstrap(tenantRoute, {
                    section: activeSection,
                    month: filters.month,
                    ...apiParams,
                    per_page: TRANSACTION_PAGE_SIZE,
                    page: 1,
                });
                applyBootstrapPayload(bootstrapPayload);
            } catch { /* Optional bootstrap */ }

            if (!Array.isArray(bootstrapPayload?.transactions)) {
                await fetchTransactions(1, { replace: true });
            }

            if (!bootstrapPayload?.finance_summary) {
                await fetchSummary({ silent: options?.silentSummary });
            }

            if (activeSection !== "transactions") {
                if (!Array.isArray(bootstrapPayload?.accounts)) await structureFetchers.fetchAccounts();
                if (!Array.isArray(bootstrapPayload?.budgets)) await structureFetchers.fetchBudgets(filters.month);
                if (!Array.isArray(bootstrapPayload?.wallets)) await structureFetchers.fetchWallets();
            }
        } catch (error: any) {
            const parsed = parseApiError(error, loadErrorMessage);
            setErrorState(parsed.detail || parsed.title);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            if (!silentLoading) setLoading(false);
        }
    }, [activeSection, apiParams, applyBootstrapPayload, fetchSummary, fetchTransactions, filters.month, loadErrorMessage, setSummaryLoading, structureFetchers, tenantRoute]);

    const loadMoreTransactions = useCallback(async () => {
        await loadMoreTransactionsWithGuard(loading);
    }, [loadMoreTransactionsWithGuard, loading]);

    return {
        transactions,
        setTransactions,
        summary,
        accounts: structureState.accounts,
        setAccounts: structureState.setAccounts,
        budgets: structureState.budgets,
        setBudgets: structureState.setBudgets,
        pockets: structureState.wallets,
        setPockets: structureState.setWallets,
        loading,
        summaryLoading,
        errorState,
        transactionsMeta,
        loadingMoreTransactions,
        fetchTransactions,
        fetchSummary,
        fetchAccounts: structureFetchers.fetchAccounts,
        fetchBudgets: structureFetchers.fetchBudgets,
        fetchPockets: structureFetchers.fetchWallets,
        refreshFinanceSideData: () => refreshFinanceEntity('all'),
        refreshFinanceEntity,
        loadFinance,
        loadMoreTransactions,
    };
};
