import axios from "axios";
import { useCallback, useRef, useState } from "react";

import { financeCache, financeCacheTtl } from "../../data/cache/financeCache";
import { FinanceSummary } from "../../types";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    tenantRoute: TenantRouteLike;
    apiParams: Record<string, string>;
    summaryCacheKey: string;
    initialLoading: boolean;
};

export const useFinanceSummaryData = ({
    tenantRoute,
    apiParams,
    summaryCacheKey,
    initialLoading,
}: Args) => {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(initialLoading);
    const summaryPromiseRef = useRef<Promise<void> | null>(null);

    const fetchSummary = useCallback(async (options?: { silent?: boolean }) => {
        if (summaryPromiseRef.current) {
            return summaryPromiseRef.current;
        }

        const shouldUseCache = !options?.silent;
        if (shouldUseCache) {
            const cached = financeCache.get<FinanceSummary>(summaryCacheKey);
            if (cached) {
                setSummary(cached);
                setSummaryLoading(false);
                return Promise.resolve();
            }
        }

        if (!options?.silent) {
            setSummaryLoading(true);
        }

        const promise = (async () => {
            try {
                const response = await axios.get(tenantRoute.apiTo("/finance/summary"), { params: apiParams });
                const nextSummary = (response.data.data || null) as FinanceSummary | null;
                setSummary(nextSummary);
                if (nextSummary) {
                    financeCache.set(summaryCacheKey, nextSummary, financeCacheTtl.summary);
                }
            } finally {
                setSummaryLoading(false);
                summaryPromiseRef.current = null;
            }
        })();

        summaryPromiseRef.current = promise;
        return promise;
    }, [apiParams, summaryCacheKey, tenantRoute]);

    return {
        summary,
        setSummary,
        summaryLoading,
        setSummaryLoading,
        fetchSummary,
    };
};
