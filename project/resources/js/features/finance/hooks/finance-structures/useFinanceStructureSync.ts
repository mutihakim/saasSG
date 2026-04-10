import { useCallback } from "react";

import { fetchFinanceBootstrap } from "../../data/api/financeApi";

import { resolveBootstrapSection, resolveBootstrapView, runEndpointSyncForTab } from "./tabSync";

type SyncState = {
    setSyncing: (syncing: boolean) => void;
    tenantRoute: { apiTo: (path?: string) => string };
    applyBootstrapPayload: (payload: any) => void;
    fetchers: {
        fetchAccounts: (force?: boolean) => Promise<unknown>;
        fetchWallets: (force?: boolean) => Promise<unknown>;
        fetchBudgets: (activePeriodMonth: string, force?: boolean) => Promise<unknown>;
        fetchGoals: (force?: boolean) => Promise<unknown>;
        fetchWishes: (force?: boolean) => Promise<unknown>;
        fetchSummary: (force?: boolean, activePeriodMonth?: string) => Promise<unknown>;
        fetchMonthlyReview: (force?: boolean) => Promise<unknown>;
    };
};

export const useFinanceStructureSync = (state: SyncState, periodMonth: string) => {
    const syncTabFromEndpoints = useCallback(async (tab: string, activePeriodMonth: string, force: boolean) => {
        await runEndpointSyncForTab({
            tab,
            activePeriodMonth,
            force,
            fetchers: state.fetchers,
        });
    }, [state.fetchers]);

    const syncForTab = useCallback(async (tab: string, options?: { periodMonth?: string; force?: boolean }) => {
        state.setSyncing(true);
        try {
            const activePeriodMonth = options?.periodMonth ?? periodMonth;
            const force = Boolean(options?.force);

            if (!force) {
                try {
                    const bootstrap = await fetchFinanceBootstrap(state.tenantRoute, {
                        section: resolveBootstrapSection(tab),
                        view: resolveBootstrapView(tab),
                        month: activePeriodMonth,
                    });
                    state.applyBootstrapPayload(bootstrap);
                    return;
                } catch {
                    // Fall through to endpoints
                }
            }

            await syncTabFromEndpoints(tab, activePeriodMonth, force);
        } finally {
            state.setSyncing(false);
        }
    }, [periodMonth, state, syncTabFromEndpoints]);

    const syncAll = useCallback(async () => {
        state.setSyncing(true);
        try {
            await Promise.all([
                state.fetchers.fetchAccounts(true),
                state.fetchers.fetchWallets(true),
                state.fetchers.fetchBudgets(periodMonth, true),
                state.fetchers.fetchGoals(true),
                state.fetchers.fetchWishes(true),
                state.fetchers.fetchSummary(true, periodMonth),
                state.fetchers.fetchMonthlyReview(true),
            ]);
        } finally {
            state.setSyncing(false);
        }
    }, [periodMonth, state]);

    return {
        syncForTab,
        syncAll,
    };
};
