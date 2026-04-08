import axios from "axios";
import { useCallback, useMemo, useState } from "react";

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
};

const normalizeSummary = (summary: any): WalletSummary => ({
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
    periodMonth: String(summary?.periodMonth ?? summary?.period_month ?? ""),
});

const useWalletData = ({ seededAccounts, seededPockets, seededBudgets, seededGoals, seededWishes, seededSummary, seededMonthlyReview, search }: Props) => {
    const tenantRoute = useTenantRoute();
    const [accounts, setAccounts] = useState<FinanceAccount[]>(seededAccounts ?? []);
    const [wallets, setWallets] = useState<FinancePocket[]>(seededPockets ?? []);
    const [budgets, setBudgets] = useState<FinanceBudget[]>(seededBudgets ?? []);
    const [goals, setGoals] = useState<FinanceSavingsGoal[]>(seededGoals ?? []);
    const [wishes, setWishes] = useState<WalletWish[]>(seededWishes ?? []);
    const [summary, setSummary] = useState<WalletSummary>(normalizeSummary(seededSummary));
    const [monthlyReview, setMonthlyReview] = useState<MonthlyReviewStatus>(seededMonthlyReview);
    const [syncing, setSyncing] = useState(false);

    // Tab-scoped sync function - only fetches data relevant to current tab
    const syncForTab = useCallback(async (tab: string) => {
        setSyncing(true);
        try {
            // Summary is always needed
            const summaryPromise = axios.get(tenantRoute.apiTo("/wallet/summary"));
            
            let promises: Promise<any>[] = [summaryPromise];

            switch (tab) {
                case 'dashboard':
                    // Dashboard needs accounts, wallets, goals, wishes, and monthly review
                    promises.push(
                        axios.get(tenantRoute.apiTo("/wallet/accounts")),
                        axios.get(tenantRoute.apiTo("/wallet/wallets")),
                        axios.get(tenantRoute.apiTo("/wallet/goals")),
                        axios.get(tenantRoute.apiTo("/wallet/wishes")),
                        axios.get(tenantRoute.apiTo("/wallet/monthly-review/status")),
                    );
                    break;
                case 'accounts':
                    // Accounts tab needs accounts, wallets, and budgets
                    promises.push(
                        axios.get(tenantRoute.apiTo("/wallet/accounts")),
                        axios.get(tenantRoute.apiTo("/wallet/wallets")),
                        axios.get(tenantRoute.apiTo("/finance/budgets"), { params: { period_month: new Date().toISOString().slice(0, 7) } }),
                    );
                    break;
                case 'goals':
                    // Goals tab only needs goals
                    promises.push(
                        axios.get(tenantRoute.apiTo("/wallet/goals")),
                        axios.get(tenantRoute.apiTo("/wallet/wallets")), // For wallet dropdown
                    );
                    break;
                case 'wishes':
                    // Wishes tab only needs wishes
                    promises.push(
                        axios.get(tenantRoute.apiTo("/wallet/wishes")),
                        axios.get(tenantRoute.apiTo("/wallet/wallets")), // For wallet dropdown
                    );
                    break;
                default:
                    // Fallback to minimal
                    break;
            }

            const responses = await Promise.all(promises);
            
            // Always update summary
            const summaryResponse = responses[0];
            setSummary(normalizeSummary(summaryResponse.data?.data?.summary ?? seededSummary));

            // Update tab-specific data
            if (tab === 'dashboard') {
                setAccounts(responses[1]?.data?.data?.accounts ?? []);
                setWallets(responses[2]?.data?.data?.wallets ?? responses[2]?.data?.data?.pockets ?? []);
                setGoals(responses[3]?.data?.data?.goals ?? []);
                setWishes(responses[4]?.data?.data?.wishes ?? []);
                setMonthlyReview(responses[5]?.data?.data?.monthly_review ?? seededMonthlyReview);
            } else if (tab === 'accounts') {
                setAccounts(responses[1]?.data?.data?.accounts ?? []);
                setWallets(responses[2]?.data?.data?.wallets ?? responses[2]?.data?.data?.pockets ?? []);
                setBudgets(responses[3]?.data?.data?.budgets ?? []);
            } else if (tab === 'goals') {
                setGoals(responses[1]?.data?.data?.goals ?? []);
                setWallets(responses[2]?.data?.data?.wallets ?? responses[2]?.data?.data?.pockets ?? []);
            } else if (tab === 'wishes') {
                setWishes(responses[1]?.data?.data?.wishes ?? []);
                setWallets(responses[2]?.data?.data?.wallets ?? responses[2]?.data?.data?.pockets ?? []);
            }
        } finally {
            setSyncing(false);
        }
    }, [tenantRoute, seededSummary, seededMonthlyReview]);

    // Legacy syncAll for backward compatibility (used in mutations that affect all data)
    const syncAll = async () => {
        setSyncing(true);
        try {
            const [accountResponse, walletResponse, budgetResponse, goalResponse, wishResponse, summaryResponse, monthlyReviewResponse] = await Promise.all([
                axios.get(tenantRoute.apiTo("/wallet/accounts")),
                axios.get(tenantRoute.apiTo("/wallet/wallets")),
                axios.get(tenantRoute.apiTo("/finance/budgets"), { params: { period_month: new Date().toISOString().slice(0, 7) } }),
                axios.get(tenantRoute.apiTo("/wallet/goals")),
                axios.get(tenantRoute.apiTo("/wallet/wishes")),
                axios.get(tenantRoute.apiTo("/wallet/summary")),
                axios.get(tenantRoute.apiTo("/wallet/monthly-review/status")),
            ]);

            setAccounts(accountResponse.data?.data?.accounts ?? []);
            setWallets(walletResponse.data?.data?.wallets ?? walletResponse.data?.data?.pockets ?? []);
            setBudgets(budgetResponse.data?.data?.budgets ?? []);
            setGoals(goalResponse.data?.data?.goals ?? []);
            setWishes(wishResponse.data?.data?.wishes ?? []);
            setSummary(normalizeSummary(summaryResponse.data?.data?.summary ?? seededSummary));
            setMonthlyReview(monthlyReviewResponse.data?.data?.monthly_review ?? seededMonthlyReview);
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
