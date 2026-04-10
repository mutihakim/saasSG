import { useMemo } from "react";

import { FinanceAccount, FinanceWallet, FinanceSavingsGoal, FinanceWish } from "../../types";

export const useFinanceStructureFilters = (
    accounts: FinanceAccount[],
    wallets: FinanceWallet[],
    goals: FinanceSavingsGoal[],
    wishes: FinanceWish[],
    search: string
) => {
    const filteredAccounts = useMemo(() => 
        accounts.filter((account) => account.name.toLowerCase().includes(search.toLowerCase())), 
    [accounts, search]);

    const filteredWallets = useMemo(() => 
        wallets.filter((wallet) => wallet.name.toLowerCase().includes(search.toLowerCase())), 
    [wallets, search]);

    const filteredGoals = useMemo(() => 
        goals.filter((goal) => goal.name.toLowerCase().includes(search.toLowerCase())), 
    [goals, search]);

    const filteredWishes = useMemo(() => 
        wishes.filter((wish) => wish.title.toLowerCase().includes(search.toLowerCase())), 
    [wishes, search]);

    return {
        filteredAccounts,
        filteredWallets,
        filteredGoals,
        filteredWishes,
    };
};
