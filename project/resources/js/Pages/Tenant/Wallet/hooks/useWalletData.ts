import axios from "axios";
import { useCallback, useMemo, useRef, useState } from "react";

import { useTenantRoute } from "../../../../common/tenantRoute";
import { FinanceAccount, FinanceBudget, FinancePocket, FinanceSavingsGoal } from "../../Finance/types";
import { MonthlyReviewStatus, WalletSummary, WalletWish } from "../types";

type Props = {
    seededAccounts: FinanceAccount[];
    seededPockets: FinancePocket[];
    seededBudgets: FinanceBudget[];
    seededGoals: FinanceSavingsGoal[];
    seededWishes: WalletWish[];
    seededSummary: WalletSummary;
    seededMonthlyReview: MonthlyReviewStatus;
    search: string;
    periodMonth: string;
    preloaded?: {
        accounts?: boolean;
        pockets?: boolean;
        budgets?: boolean;
        goals?: boolean;
        wishes?: boolean;
        summary?: boolean;
        monthly_review?: boolean;
    };
};

const normalizeSummary = (summary: any, fallbackPeriodMonth?: string): WalletSummary => ({
    totalAssets: Number(summary?.totalAssets ?? summary?.total_assets ?? 0),
    cashBankAssets: Number(summary?.cashBankAssets ?? summary?.cash_bank_assets ?? 0),
    totalLiabilities: Number(summary?.totalLiabilities ?? summary?.total_liabilities ?? 0),
    netWorth: Number(summary?.netWorth ?? summary?.net_worth ?? 0),
    lockedFunds: Number(summary?.lockedFunds ?? summary?.locked_funds ?? 0),
    freeFunds: Number(summary?.freeFunds ?? summary?.free_funds ?? 0),
    liquidityRatio: Number(summary?.liquidityRatio ?? summary?.liquidity_ratio ?? 0),
    monthlyIncome: Number(summary?.monthlyIncome ?? summary?.monthly_income ?? 0),
    monthlySpending: Number(summary?.monthlySpending ?? summary?.monthly_spending ?? 0),
    monthlySaving: Number(summary?.monthlySaving ?? summary?.monthly_saving ?? 0),
    savingRate: Number(summary?.savingRate ?? summary?.saving_rate ?? 0),
    debtRatio: Number(summary?.debtRatio ?? summary?.debt_ratio ?? 0),
    debtStatusTotal: Number(summary?.debtStatusTotal ?? summary?.debt_status_total ?? 0),
    highPriorityWishes: Number(summary?.highPriorityWishes ?? summary?.high_priority_wishes ?? 0),
    goalTargetTotal: Number(summary?.goalTargetTotal ?? summary?.goal_target_total ?? 0),
    goalCurrentTotal: Number(summary?.goalCurrentTotal ?? summary?.goal_current_total ?? 0),
    assetAllocation: summary?.assetAllocation ?? summary?.asset_allocation ?? [],
    wishlistQuickView: summary?.wishlistQuickView ?? summary?.wishlist_quick_view ?? [],
    periodMonth: String(summary?.periodMonth ?? summary?.period_month ?? fallbackPeriodMonth ?? ""),
});

const useWalletData = ({ seededAccounts, seededPockets, seededBudgets, seededGoals, seededWishes, seededSummary, seededMonthlyReview, search, periodMonth, preloaded }: Props) => {
    const tenantRoute = useTenantRoute();
    const [accounts, setAccounts] = useState<FinanceAccount[]>(seededAccounts ?? []);
    const [wallets, setWallets] = useState<FinancePocket[]>(seededPockets ?? []);
    const [budgets, setBudgets] = useState<FinanceBudget[]>(seededBudgets ?? []);
    const [goals, setGoals] = useState<FinanceSavingsGoal[]>(seededGoals ?? []);
    const [wishes, setWishes] = useState<WalletWish[]>(seededWishes ?? []);
    const [summary, setSummary] = useState<WalletSummary>(normalizeSummary(seededSummary, periodMonth));
    const [monthlyReview, setMonthlyReview] = useState<MonthlyReviewStatus>(seededMonthlyReview);
    const [syncing, setSyncing] = useState(false);
    const loadedRef = useRef({
        accounts: Boolean(preloaded?.accounts),
        wallets: Boolean(preloaded?.pockets),
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

    const fetchAccounts = useCallback(async (force = false) => {
        if (!force && loadedRef.current.accounts) {
            return dataRef.current.accounts;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/accounts"));
        const nextAccounts = response.data?.data?.accounts ?? [];
        setAccounts(nextAccounts);
        dataRef.current.accounts = nextAccounts;
        loadedRef.current.accounts = true;

        return nextAccounts;
    }, [tenantRoute]);

    const fetchWallets = useCallback(async (force = false) => {
        if (!force && loadedRef.current.wallets) {
            return dataRef.current.wallets;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/pockets"));
        const nextWallets = response.data?.data?.wallets ?? response.data?.data?.pockets ?? [];
        setWallets(nextWallets);
        dataRef.current.wallets = nextWallets;
        loadedRef.current.wallets = true;

        return nextWallets;
    }, [tenantRoute]);

    const fetchBudgets = useCallback(async (activePeriodMonth: string, force = false) => {
        if (!force && loadedBudgetMonthsRef.current[activePeriodMonth]) {
            const cachedBudgets = budgetCacheRef.current[activePeriodMonth] ?? [];
            setBudgets(cachedBudgets);

            return cachedBudgets;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/budgets"), { params: { period_month: activePeriodMonth } });
        const nextBudgets = response.data?.data?.budgets ?? [];
        budgetCacheRef.current[activePeriodMonth] = nextBudgets;
        loadedBudgetMonthsRef.current[activePeriodMonth] = true;
        setBudgets(nextBudgets);

        return nextBudgets;
    }, [tenantRoute]);

    const fetchGoals = useCallback(async (force = false) => {
        if (!force && loadedRef.current.goals) {
            return dataRef.current.goals;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/goals"));
        const nextGoals = response.data?.data?.goals ?? [];
        setGoals(nextGoals);
        dataRef.current.goals = nextGoals;
        loadedRef.current.goals = true;

        return nextGoals;
    }, [tenantRoute]);

    const fetchWishes = useCallback(async (force = false) => {
        if (!force && loadedRef.current.wishes) {
            return dataRef.current.wishes;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/wishes"));
        const nextWishes = response.data?.data?.wishes ?? [];
        setWishes(nextWishes);
        dataRef.current.wishes = nextWishes;
        loadedRef.current.wishes = true;

        return nextWishes;
    }, [tenantRoute]);

    const fetchSummary = useCallback(async (force = false, activePeriodMonth?: string) => {
        if (!force && loadedRef.current.summary) {
            return dataRef.current.summary;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/wallet-summary"));
        const nextSummary = normalizeSummary(response.data?.data?.summary ?? seededSummary, activePeriodMonth ?? periodMonth);
        setSummary(nextSummary);
        dataRef.current.summary = nextSummary;
        loadedRef.current.summary = true;

        return nextSummary;
    }, [periodMonth, seededSummary, tenantRoute]);

    const fetchMonthlyReview = useCallback(async (force = false) => {
        if (!force && loadedRef.current.monthlyReview) {
            return dataRef.current.monthlyReview;
        }

        const response = await axios.get(tenantRoute.apiTo("/finance/monthly-review/status"));
        const nextMonthlyReview = response.data?.data?.monthly_review ?? seededMonthlyReview;
        setMonthlyReview(nextMonthlyReview);
        dataRef.current.monthlyReview = nextMonthlyReview;
        loadedRef.current.monthlyReview = true;

        return nextMonthlyReview;
    }, [seededMonthlyReview, tenantRoute]);

    // Tab-scoped sync function - only fetches data relevant to current tab
    const syncForTab = useCallback(async (tab: string, options?: { periodMonth?: string; force?: boolean }) => {
        setSyncing(true);
        try {
            const activePeriodMonth = options?.periodMonth ?? periodMonth;
            const force = Boolean(options?.force);

            switch (tab) {
                case 'dashboard':
                    await Promise.all([
                        fetchSummary(force, activePeriodMonth),
                        fetchWallets(force),
                        fetchGoals(force),
                        fetchWishes(force),
                        fetchMonthlyReview(force),
                    ]);
                    break;
                case 'accounts':
                    await Promise.all([
                        fetchAccounts(force),
                        fetchWallets(force),
                    ]);
                    break;
                case 'budgets':
                    await Promise.all([
                        fetchBudgets(activePeriodMonth, force),
                        fetchWallets(force),
                    ]);
                    break;
                case 'goals':
                    await Promise.all([
                        fetchGoals(force),
                        fetchWallets(force),
                    ]);
                    break;
                case 'wishes':
                    await Promise.all([
                        fetchWishes(force),
                        fetchWallets(force),
                    ]);
                    break;
            }
        } finally {
            setSyncing(false);
        }
    }, [periodMonth, fetchAccounts, fetchBudgets, fetchGoals, fetchMonthlyReview, fetchSummary, fetchWallets, fetchWishes]);

    // Legacy syncAll for backward compatibility (used in mutations that affect all data)
    const syncAll = async () => {
        setSyncing(true);
        try {
            await Promise.all([
                fetchAccounts(true),
                fetchWallets(true),
                fetchBudgets(periodMonth, true),
                fetchGoals(true),
                fetchWishes(true),
                fetchSummary(true, periodMonth),
                fetchMonthlyReview(true),
            ]);
        } finally {
            setSyncing(false);
        }
    };

    const filteredAccounts = useMemo(() => accounts.filter((account) => account.name.toLowerCase().includes(search.toLowerCase())), [accounts, search]);
    const filteredWallets = useMemo(() => wallets.filter((wallet) => wallet.name.toLowerCase().includes(search.toLowerCase())), [wallets, search]);
    const filteredGoals = useMemo(() => goals.filter((goal) => goal.name.toLowerCase().includes(search.toLowerCase())), [goals, search]);
    const filteredWishes = useMemo(() => wishes.filter((wish) => wish.title.toLowerCase().includes(search.toLowerCase())), [search, wishes]);

    return {
        tenantRoute,
        accounts,
        setAccounts,
        wallets,
        setWallets,
        budgets,
        setBudgets,
        goals,
        setGoals,
        wishes,
        setWishes,
        summary,
        setSummary,
        monthlyReview,
        setMonthlyReview,
        syncing,
        filteredAccounts,
        filteredWallets,
        filteredGoals,
        filteredWishes,
        syncAll,
        syncForTab, // New scoped sync function
    };
};

export default useWalletData;
