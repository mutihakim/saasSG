type SyncTab = "dashboard" | "accounts" | "budgets" | "goals" | "wishes" | string;

type EndpointFetchers = {
    fetchAccounts: (force?: boolean) => Promise<unknown>;
    fetchWallets: (force?: boolean) => Promise<unknown>;
    fetchBudgets: (activePeriodMonth: string, force?: boolean) => Promise<unknown>;
    fetchGoals: (force?: boolean) => Promise<unknown>;
    fetchWishes: (force?: boolean) => Promise<unknown>;
    fetchSummary: (force?: boolean, activePeriodMonth?: string) => Promise<unknown>;
    fetchMonthlyReview: (force?: boolean) => Promise<unknown>;
};

export const resolveBootstrapSection = (tab: SyncTab) => (
    tab === "dashboard"
        ? "home"
        : tab === "accounts"
            ? "accounts"
            : "planning"
);

export const resolveBootstrapView = (tab: SyncTab) => (
    tab === "budgets" || tab === "goals" || tab === "wishes"
        ? tab
        : undefined
);

export const runEndpointSyncForTab = async ({
    tab,
    activePeriodMonth,
    force,
    fetchers,
}: {
    tab: SyncTab;
    activePeriodMonth: string;
    force: boolean;
    fetchers: EndpointFetchers;
}) => {
    switch (tab) {
        case "dashboard":
            await Promise.all([
                fetchers.fetchSummary(force, activePeriodMonth),
                fetchers.fetchWallets(force),
                fetchers.fetchGoals(force),
                fetchers.fetchWishes(force),
                fetchers.fetchMonthlyReview(force),
            ]);
            break;
        case "accounts":
            await Promise.all([
                fetchers.fetchAccounts(force),
                fetchers.fetchWallets(force),
            ]);
            break;
        case "budgets":
            await Promise.all([
                fetchers.fetchBudgets(activePeriodMonth, force),
                fetchers.fetchWallets(force),
            ]);
            break;
        case "goals":
            await Promise.all([
                fetchers.fetchGoals(force),
                fetchers.fetchWallets(force),
            ]);
            break;
        case "wishes":
            await Promise.all([
                fetchers.fetchWishes(force),
                fetchers.fetchWallets(force),
            ]);
            break;
        default:
            break;
    }
};
