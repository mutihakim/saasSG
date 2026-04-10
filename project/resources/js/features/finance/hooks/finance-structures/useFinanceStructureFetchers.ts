import { useCallback, useRef } from "react";

import {
    fetchFinanceAccounts,
    fetchFinanceWallets,
    fetchFinanceBudgets,
    fetchFinanceGoals,
    fetchFinanceWishes,
    fetchFinanceWalletSummary,
    fetchFinanceMonthlyReviewStatus,
} from "../../data/api/financeApi";
import { financeCache, financeCacheTtl } from "../../data/cache/financeCache";
import {
    FinanceAccount,
    FinanceBudget,
    FinanceWallet,
    FinanceSavingsGoal,
    FinanceWalletSummary,
    FinanceMonthlyReviewStatus,
    FinanceWish,
} from "../../types";

import { normalizeSummary } from "./normalizeSummary";

import { useTenantRoute } from "@/core/config/routes";

type FetcherState = {
    setAccounts: (accounts: FinanceAccount[]) => void;
    setWallets: (wallets: FinanceWallet[]) => void;
    setBudgets: (budgets: FinanceBudget[]) => void;
    setGoals: (goals: FinanceSavingsGoal[]) => void;
    setWishes: (wishes: FinanceWish[]) => void;
    setSummary: (summary: FinanceWalletSummary) => void;
    setMonthlyReview: (review: FinanceMonthlyReviewStatus | null) => void;
    loadedRef: React.MutableRefObject<{
        accounts: boolean;
        wallets: boolean;
        goals: boolean;
        wishes: boolean;
        summary: boolean;
        monthlyReview: boolean;
    }>;
    dataRef: React.MutableRefObject<{
        accounts: FinanceAccount[];
        wallets: FinanceWallet[];
        goals: FinanceSavingsGoal[];
        wishes: FinanceWish[];
        summary: FinanceWalletSummary;
        monthlyReview: FinanceMonthlyReviewStatus | null;
    }>;
    budgetCacheRef: React.MutableRefObject<Record<string, FinanceBudget[]>>;
    loadedBudgetMonthsRef: React.MutableRefObject<Record<string, boolean>>;
};

export const useFinanceStructureFetchers = (state: FetcherState, periodMonth: string) => {
    const tenantRoute = useTenantRoute();
    const cachePrefix = `${tenantRoute.apiTo("/finance")}:`;
    const accountsCacheKey = `${cachePrefix}accounts`;
    const walletsCacheKey = `${cachePrefix}wallets`;
    const goalsCacheKey = `${cachePrefix}goals`;
    const wishesCacheKey = `${cachePrefix}wishes`;
    const summaryCacheKey = `${cachePrefix}wallet-summary`;
    const monthlyReviewCacheKey = `${cachePrefix}monthly-review`;

    // Lock refs to prevent concurrent duplicate requests
    const promisesRef = useRef<{
        accounts: Promise<FinanceAccount[]> | null;
        wallets: Promise<FinanceWallet[]> | null;
        goals: Promise<FinanceSavingsGoal[]> | null;
        wishes: Promise<FinanceWish[]> | null;
        summary: Promise<FinanceWalletSummary> | null;
        monthlyReview: Promise<FinanceMonthlyReviewStatus | null> | null;
        budgets: Record<string, Promise<FinanceBudget[]>> | null;
    }>({
        accounts: null,
        wallets: null,
        goals: null,
        wishes: null,
        summary: null,
        monthlyReview: null,
        budgets: {},
    });

    const fetchAccounts = useCallback(async (force = false) => {
        if (!force && state.loadedRef.current.accounts) {
            return state.dataRef.current.accounts;
        }

        if (!force) {
            const cached = financeCache.get<FinanceAccount[]>(accountsCacheKey);
            if (cached) {
                state.setAccounts(cached);
                state.dataRef.current.accounts = cached;
                state.loadedRef.current.accounts = true;
                return cached;
            }
        }

        if (promisesRef.current.accounts) {
            return promisesRef.current.accounts;
        }

        const promise = (async () => {
            try {
                const nextAccounts = await fetchFinanceAccounts(tenantRoute);
                state.setAccounts(nextAccounts);
                state.dataRef.current.accounts = nextAccounts;
                state.loadedRef.current.accounts = true;
                financeCache.set(accountsCacheKey, nextAccounts, financeCacheTtl.structures);
                return nextAccounts;
            } finally {
                promisesRef.current.accounts = null;
            }
        })();

        promisesRef.current.accounts = promise;
        return promise;
    }, [accountsCacheKey, state, tenantRoute]);

    const fetchWallets = useCallback(async (force = false) => {
        if (!force && state.loadedRef.current.wallets) {
            return state.dataRef.current.wallets;
        }

        if (!force) {
            const cached = financeCache.get<FinanceWallet[]>(walletsCacheKey);
            if (cached) {
                state.setWallets(cached);
                state.dataRef.current.wallets = cached;
                state.loadedRef.current.wallets = true;
                return cached;
            }
        }

        if (promisesRef.current.wallets) {
            return promisesRef.current.wallets;
        }

        const promise = (async () => {
            try {
                const nextWallets = await fetchFinanceWallets(tenantRoute);
                state.setWallets(nextWallets);
                state.dataRef.current.wallets = nextWallets;
                state.loadedRef.current.wallets = true;
                financeCache.set(walletsCacheKey, nextWallets, financeCacheTtl.structures);
                return nextWallets;
            } finally {
                promisesRef.current.wallets = null;
            }
        })();

        promisesRef.current.wallets = promise;
        return promise;
    }, [state, tenantRoute, walletsCacheKey]);

    const fetchBudgets = useCallback(async (activePeriodMonth: string, force = false) => {
        if (!force && state.loadedBudgetMonthsRef.current[activePeriodMonth]) {
            const cachedBudgets = state.budgetCacheRef.current[activePeriodMonth] ?? [];
            state.setBudgets(cachedBudgets);
            return cachedBudgets;
        }

        const budgetCacheKey = `${cachePrefix}budgets:${activePeriodMonth}`;
        if (!force) {
            const cached = financeCache.get<FinanceBudget[]>(budgetCacheKey);
            if (cached) {
                state.budgetCacheRef.current[activePeriodMonth] = cached;
                state.loadedBudgetMonthsRef.current[activePeriodMonth] = true;
                state.setBudgets(cached);
                return cached;
            }
        }

        if (promisesRef.current.budgets?.[activePeriodMonth]) {
            return promisesRef.current.budgets[activePeriodMonth];
        }

        const promise = (async () => {
            try {
                const nextBudgets = await fetchFinanceBudgets(tenantRoute, activePeriodMonth);
                state.budgetCacheRef.current[activePeriodMonth] = nextBudgets;
                state.loadedBudgetMonthsRef.current[activePeriodMonth] = true;
                state.setBudgets(nextBudgets);
                financeCache.set(budgetCacheKey, nextBudgets, financeCacheTtl.structures);
                return nextBudgets;
            } finally {
                if (promisesRef.current.budgets) {
                    delete promisesRef.current.budgets[activePeriodMonth];
                }
            }
        })();

        if (promisesRef.current.budgets) {
            promisesRef.current.budgets[activePeriodMonth] = promise;
        }
        return promise;
    }, [cachePrefix, state, tenantRoute]);

    const fetchGoals = useCallback(async (force = false) => {
        if (!force && state.loadedRef.current.goals) {
            return state.dataRef.current.goals;
        }

        if (!force) {
            const cached = financeCache.get<FinanceSavingsGoal[]>(goalsCacheKey);
            if (cached) {
                state.setGoals(cached);
                state.dataRef.current.goals = cached;
                state.loadedRef.current.goals = true;
                return cached;
            }
        }

        if (promisesRef.current.goals) {
            return promisesRef.current.goals;
        }

        const promise = (async () => {
            try {
                const nextGoals = await fetchFinanceGoals(tenantRoute);
                state.setGoals(nextGoals);
                state.dataRef.current.goals = nextGoals;
                state.loadedRef.current.goals = true;
                financeCache.set(goalsCacheKey, nextGoals, financeCacheTtl.structures);
                return nextGoals;
            } finally {
                promisesRef.current.goals = null;
            }
        })();

        promisesRef.current.goals = promise;
        return promise;
    }, [goalsCacheKey, state, tenantRoute]);

    const fetchWishes = useCallback(async (force = false) => {
        if (!force && state.loadedRef.current.wishes) {
            return state.dataRef.current.wishes;
        }

        if (!force) {
            const cached = financeCache.get<FinanceWish[]>(wishesCacheKey);
            if (cached) {
                state.setWishes(cached);
                state.dataRef.current.wishes = cached;
                state.loadedRef.current.wishes = true;
                return cached;
            }
        }

        if (promisesRef.current.wishes) {
            return promisesRef.current.wishes;
        }

        const promise = (async () => {
            try {
                const nextWishes = await fetchFinanceWishes(tenantRoute);
                state.setWishes(nextWishes);
                state.dataRef.current.wishes = nextWishes;
                state.loadedRef.current.wishes = true;
                financeCache.set(wishesCacheKey, nextWishes, financeCacheTtl.structures);
                return nextWishes;
            } finally {
                promisesRef.current.wishes = null;
            }
        })();

        promisesRef.current.wishes = promise;
        return promise;
    }, [state, tenantRoute, wishesCacheKey]);

    const fetchSummary = useCallback(async (force = false, activePeriodMonth?: string) => {
        if (!force && state.loadedRef.current.summary) {
            return state.dataRef.current.summary;
        }

        if (!force) {
            const cached = financeCache.get<FinanceWalletSummary>(summaryCacheKey);
            if (cached) {
                state.setSummary(cached);
                state.dataRef.current.summary = cached;
                state.loadedRef.current.summary = true;
                return cached;
            }
        }

        if (promisesRef.current.summary) {
            return promisesRef.current.summary;
        }

        const promise = (async () => {
            try {
                const rawSummary = await fetchFinanceWalletSummary(tenantRoute);
                const nextSummary = normalizeSummary(rawSummary, activePeriodMonth ?? periodMonth);
                state.setSummary(nextSummary);
                state.dataRef.current.summary = nextSummary;
                state.loadedRef.current.summary = true;
                financeCache.set(summaryCacheKey, nextSummary, financeCacheTtl.summary);
                return nextSummary;
            } finally {
                promisesRef.current.summary = null;
            }
        })();

        promisesRef.current.summary = promise;
        return promise;
    }, [periodMonth, state, summaryCacheKey, tenantRoute]);

    const fetchMonthlyReview = useCallback(async (force = false) => {
        if (!force && state.loadedRef.current.monthlyReview) {
            return state.dataRef.current.monthlyReview;
        }

        if (!force) {
            const cached = financeCache.get<FinanceMonthlyReviewStatus>(monthlyReviewCacheKey);
            if (cached) {
                state.setMonthlyReview(cached);
                state.dataRef.current.monthlyReview = cached;
                state.loadedRef.current.monthlyReview = true;
                return cached;
            }
        }

        if (promisesRef.current.monthlyReview) {
            return promisesRef.current.monthlyReview;
        }

        const promise = (async () => {
            try {
                const nextMonthlyReview = await fetchFinanceMonthlyReviewStatus(tenantRoute);
                state.setMonthlyReview(nextMonthlyReview ?? null);
                state.dataRef.current.monthlyReview = nextMonthlyReview ?? null;
                state.loadedRef.current.monthlyReview = true;
                if (nextMonthlyReview) {
                    financeCache.set(monthlyReviewCacheKey, nextMonthlyReview, financeCacheTtl.summary);
                }
                return nextMonthlyReview;
            } finally {
                promisesRef.current.monthlyReview = null;
            }
        })();

        promisesRef.current.monthlyReview = promise;
        return promise;
    }, [monthlyReviewCacheKey, state, tenantRoute]);

    return {
        fetchAccounts,
        fetchWallets,
        fetchBudgets,
        fetchGoals,
        fetchWishes,
        fetchSummary,
        fetchMonthlyReview,
        cachePrefix,
        accountsCacheKey,
        walletsCacheKey,
        goalsCacheKey,
        wishesCacheKey,
        summaryCacheKey,
        monthlyReviewCacheKey,
    };
};
