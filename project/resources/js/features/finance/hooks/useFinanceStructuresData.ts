import { useCallback, useRef } from "react";

import { financeCache } from "../data/cache/financeCache";
import {
    FinanceAccount,
    FinanceBudget,
    FinanceMonthlyReviewStatus,
    FinanceWallet,
    FinanceSavingsGoal,
    FinanceWalletSummary,
    FinanceWish,
} from "../types";

import { useFinanceBootstrapAdapter } from "./finance-structures/useFinanceBootstrapAdapter";
import { useFinanceStructureFetchers } from "./finance-structures/useFinanceStructureFetchers";
import { useFinanceStructureFilters } from "./finance-structures/useFinanceStructureFilters";
import { useFinanceStructureState } from "./finance-structures/useFinanceStructureState";
import { useFinanceStructureSync } from "./finance-structures/useFinanceStructureSync";

import { useTenantRoute } from "@/core/config/routes";

type Props = {
    seededAccounts: FinanceAccount[];
    seededPockets: FinanceWallet[];
    seededBudgets: FinanceBudget[];
    seededGoals: FinanceSavingsGoal[];
    seededWishes: FinanceWish[];
    seededSummary: FinanceWalletSummary;
    seededMonthlyReview: FinanceMonthlyReviewStatus | null;
    search: string;
    periodMonth: string;
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

const useFinanceStructuresData = (props: Props) => {
    const { search, periodMonth } = props;
    const tenantRoute = useTenantRoute();
    
    // 1. State layer
    const state = useFinanceStructureState(props);
    
    // 2. Fetcher layer
    const fetchers = useFinanceStructureFetchers({
        setAccounts: state.setAccounts,
        setWallets: state.setWallets,
        setBudgets: state.setBudgets,
        setGoals: state.setGoals,
        setWishes: state.setWishes,
        setSummary: state.setSummary,
        setMonthlyReview: state.setMonthlyReview,
        loadedRef: state.loadedRef,
        dataRef: state.dataRef,
        budgetCacheRef: state.budgetCacheRef,
        loadedBudgetMonthsRef: state.loadedBudgetMonthsRef,
    }, periodMonth);

    // 3. Adapter layer (Bootstrap)
    const { applyBootstrapPayload } = useFinanceBootstrapAdapter({
        ...fetchers,
        setAccounts: state.setAccounts,
        setWallets: state.setWallets,
        setBudgets: state.setBudgets,
        setGoals: state.setGoals,
        setWishes: state.setWishes,
        setSummary: state.setSummary,
        setMonthlyReview: state.setMonthlyReview,
        loadedRef: state.loadedRef,
        dataRef: state.dataRef,
        budgetCacheRef: state.budgetCacheRef,
        loadedBudgetMonthsRef: state.loadedBudgetMonthsRef,
    }, periodMonth);

    // 4. Sync layer
    const { syncForTab, syncAll } = useFinanceStructureSync({
        setSyncing: state.setSyncing,
        tenantRoute,
        applyBootstrapPayload,
        fetchers,
    }, periodMonth);

    // 5. Mapping layer (Filters/Derived state)
    const { filteredAccounts, filteredWallets, filteredGoals, filteredWishes } = useFinanceStructureFilters(
        state.accounts,
        state.wallets,
        state.goals,
        state.wishes,
        search
    );

    const cacheVersionRef = useRef<number | null>(null);

    const invalidateOnVersionChange = useCallback((nextVersion?: number | null) => {
        if (!nextVersion || Number.isNaN(nextVersion)) {
            return;
        }

        if (cacheVersionRef.current !== null && cacheVersionRef.current !== nextVersion) {
            financeCache.invalidatePrefix(fetchers.cachePrefix);
        }

        cacheVersionRef.current = nextVersion;
    }, [fetchers.cachePrefix]);

    return {
        tenantRoute,
        accounts: state.accounts,
        setAccounts: state.setAccounts,
        wallets: state.wallets,
        setWallets: state.setWallets,
        budgets: state.budgets,
        setBudgets: state.setBudgets,
        goals: state.goals,
        setGoals: state.setGoals,
        wishes: state.wishes,
        setWishes: state.setWishes,
        summary: state.summary,
        setSummary: state.setSummary,
        monthlyReview: state.monthlyReview,
        setMonthlyReview: state.setMonthlyReview,
        syncing: state.syncing,
        filteredAccounts,
        filteredWallets,
        filteredGoals,
        filteredWishes,
        syncAll,
        syncForTab,
        fetchBudgets: fetchers.fetchBudgets,
        applyBootstrapPayload, // Export for orchestration
        invalidateOnVersionChange,
    };
};

export default useFinanceStructuresData;
