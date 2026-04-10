import { useState, useRef } from "react";

import {
    FinanceAccount,
    FinanceBudget,
    FinanceMonthlyReviewStatus,
    FinanceWallet,
    FinanceSavingsGoal,
    FinanceWalletSummary,
    FinanceWish,
} from "../../types";

import { normalizeSummary } from "./normalizeSummary";

export type FinanceStructureStateProps = {
    seededAccounts: FinanceAccount[];
    seededPockets: FinanceWallet[];
    seededBudgets: FinanceBudget[];
    seededGoals: FinanceSavingsGoal[];
    seededWishes: FinanceWish[];
    seededSummary: FinanceWalletSummary;
    seededMonthlyReview: FinanceMonthlyReviewStatus | null;
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

export const useFinanceStructureState = ({
    seededAccounts,
    seededPockets,
    seededBudgets,
    seededGoals,
    seededWishes,
    seededSummary,
    seededMonthlyReview,
    periodMonth,
    preloaded,
}: FinanceStructureStateProps) => {
    const [accounts, setAccounts] = useState<FinanceAccount[]>(seededAccounts ?? []);
    const [wallets, setWallets] = useState<FinanceWallet[]>(seededPockets ?? []);
    const [budgets, setBudgets] = useState<FinanceBudget[]>(seededBudgets ?? []);
    const [goals, setGoals] = useState<FinanceSavingsGoal[]>(seededGoals ?? []);
    const [wishes, setWishes] = useState<FinanceWish[]>(seededWishes ?? []);
    const [summary, setSummary] = useState<FinanceWalletSummary>(normalizeSummary(seededSummary, periodMonth));
    const [monthlyReview, setMonthlyReview] = useState<FinanceMonthlyReviewStatus | null>(seededMonthlyReview);
    const [syncing, setSyncing] = useState(false);

    const loadedRef = useRef({
        accounts: Boolean(preloaded?.accounts),
        wallets: Boolean(preloaded?.wallets ?? preloaded?.pockets),
        goals: Boolean(preloaded?.goals),
        wishes: Boolean(preloaded?.wishes),
        summary: Boolean(preloaded?.summary),
        monthlyReview: Boolean(preloaded?.monthly_review),
    });

    const dataRef = useRef({
        accounts: seededAccounts ?? [],
        wallets: seededPockets ?? [],
        goals: seededGoals ?? [],
        wishes: seededWishes ?? [],
        summary: normalizeSummary(seededSummary, periodMonth),
        monthlyReview: seededMonthlyReview,
    });

    const budgetCacheRef = useRef<Record<string, FinanceBudget[]>>(
        preloaded?.budgets ? { [periodMonth]: seededBudgets ?? [] } : {},
    );
    const loadedBudgetMonthsRef = useRef<Record<string, boolean>>(
        preloaded?.budgets ? { [periodMonth]: true } : {},
    );

    return {
        accounts, setAccounts,
        wallets, setWallets,
        budgets, setBudgets,
        goals, setGoals,
        wishes, setWishes,
        summary, setSummary,
        monthlyReview, setMonthlyReview,
        syncing, setSyncing,
        loadedRef,
        dataRef,
        budgetCacheRef,
        loadedBudgetMonthsRef,
    };
};
