import { useCallback } from "react";

import { financeCache, financeCacheTtl } from "../../data/cache/financeCache";
import { FinanceBootstrapPayload, FinanceAccount, FinanceWallet, FinanceBudget, FinanceSavingsGoal, FinanceWish, FinanceWalletSummary, FinanceMonthlyReviewStatus } from "../../types";

import { normalizeSummary } from "./normalizeSummary";

type AdapterState = {
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
    cachePrefix: string;
    accountsCacheKey: string;
    walletsCacheKey: string;
    goalsCacheKey: string;
    wishesCacheKey: string;
    summaryCacheKey: string;
    monthlyReviewCacheKey: string;
};

export const useFinanceBootstrapAdapter = (
    {
        setAccounts,
        setWallets,
        setBudgets,
        setGoals,
        setWishes,
        setSummary,
        setMonthlyReview,
        loadedRef,
        dataRef,
        budgetCacheRef,
        loadedBudgetMonthsRef,
        cachePrefix,
        accountsCacheKey,
        walletsCacheKey,
        goalsCacheKey,
        wishesCacheKey,
        summaryCacheKey,
        monthlyReviewCacheKey,
    }: AdapterState,
    periodMonth: string,
) => {
    const applyBootstrapPayload = useCallback(
        (payload: FinanceBootstrapPayload | any) => {
            if (!payload) return;

            if (payload.cache_version) {
                // Invalidation logic usually handled by orchestration, but we can store it
            }

            if (Array.isArray(payload.accounts)) {
                setAccounts(payload.accounts);
                dataRef.current.accounts = payload.accounts;

                loadedRef.current.accounts = true;
                financeCache.set(accountsCacheKey, payload.accounts, financeCacheTtl.structures);
            }

            const bootstrapWallets = payload.wallets ?? payload.pockets;
            if (Array.isArray(bootstrapWallets)) {
                setWallets(bootstrapWallets);

                dataRef.current.wallets = bootstrapWallets;

                loadedRef.current.wallets = true;
                financeCache.set(walletsCacheKey, bootstrapWallets, financeCacheTtl.structures);
            }

            if (Array.isArray(payload.budgets)) {
                const month = String(payload.period_month || periodMonth);

                budgetCacheRef.current[month] = payload.budgets;

                loadedBudgetMonthsRef.current[month] = true;
                setBudgets(payload.budgets);
                financeCache.set(`${cachePrefix}budgets:${month}`, payload.budgets, financeCacheTtl.structures);
            }

            if (Array.isArray(payload.goals)) {
                setGoals(payload.goals);

                dataRef.current.goals = payload.goals;

                loadedRef.current.goals = true;
                financeCache.set(goalsCacheKey, payload.goals, financeCacheTtl.structures);
            }

            if (Array.isArray(payload.wishes)) {
                setWishes(payload.wishes);

                dataRef.current.wishes = payload.wishes;

                loadedRef.current.wishes = true;
                financeCache.set(wishesCacheKey, payload.wishes, financeCacheTtl.structures);
            }

            if (payload.wallet_summary) {
                const nextSummary = normalizeSummary(payload.wallet_summary, payload.period_month || periodMonth);
                setSummary(nextSummary);

                dataRef.current.summary = nextSummary;

                loadedRef.current.summary = true;
                financeCache.set(summaryCacheKey, nextSummary, financeCacheTtl.summary);
            }

            if (payload.monthly_review) {
                setMonthlyReview(payload.monthly_review);

                dataRef.current.monthlyReview = payload.monthly_review;

                loadedRef.current.monthlyReview = true;
                financeCache.set(monthlyReviewCacheKey, payload.monthly_review, financeCacheTtl.summary);
            }
        },
        [
            periodMonth,
            setAccounts,
            setWallets,
            setBudgets,
            setGoals,
            setWishes,
            setSummary,
            setMonthlyReview,
            loadedRef,
            dataRef,
            budgetCacheRef,
            loadedBudgetMonthsRef,
            cachePrefix,
            accountsCacheKey,
            walletsCacheKey,
            goalsCacheKey,
            wishesCacheKey,
            summaryCacheKey,
            monthlyReviewCacheKey,
        ],
    );

    return { applyBootstrapPayload };
};
