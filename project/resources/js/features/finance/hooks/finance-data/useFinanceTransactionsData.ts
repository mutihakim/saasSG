import axios from "axios";
import { useCallback, useState } from "react";

import { FinanceTransaction } from "../../types";

import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

const TRANSACTION_PAGE_SIZE = 10;

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    tenantRoute: TenantRouteLike;
    apiParams: Record<string, string>;
    loadErrorMessage: string;
};

export const useFinanceTransactionsData = ({ tenantRoute, apiParams, loadErrorMessage }: Args) => {
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [transactionsMeta, setTransactionsMeta] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        hasMore: false,
    });
    const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);

    const mergeTransactionPage = useCallback((pageItems: FinanceTransaction[], replace: boolean) => {
        setTransactions((prev) => {
            const source = replace ? [] : prev;
            const merged = [...source, ...pageItems];
            const deduped = new Map<string, FinanceTransaction>();
            merged.forEach((item) => {
                if (item?.id) {
                    deduped.set(String(item.id), item);
                }
            });
            return Array.from(deduped.values());
        });
    }, []);

    const fetchTransactions = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await axios.get(tenantRoute.apiTo("/finance/transactions"), {
            params: {
                ...apiParams,
                page,
                per_page: TRANSACTION_PAGE_SIZE,
            },
        });

        const payload = response.data.data || {};
        const pageItems = Array.isArray(payload.transactions) ? (payload.transactions as FinanceTransaction[]) : [];
        const meta = payload.meta || {};

        mergeTransactionPage(pageItems, replace);
        setTransactionsMeta({
            currentPage: Number(meta.current_page || page),
            lastPage: Number(meta.last_page || page),
            total: Number(meta.total || pageItems.length),
            hasMore: Boolean(meta.has_more ?? (Number(meta.current_page || page) < Number(meta.last_page || page))),
        });
    }, [apiParams, mergeTransactionPage, tenantRoute]);

    const loadMoreTransactions = useCallback(async (isPageLoading: boolean) => {
        if (isPageLoading || loadingMoreTransactions || !transactionsMeta.hasMore) {
            return;
        }

        setLoadingMoreTransactions(true);
        try {
            await fetchTransactions(transactionsMeta.currentPage + 1, { replace: false });
        } catch (error: any) {
            const parsed = parseApiError(error, loadErrorMessage);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoadingMoreTransactions(false);
        }
    }, [fetchTransactions, loadErrorMessage, loadingMoreTransactions, transactionsMeta.currentPage, transactionsMeta.hasMore]);

    return {
        transactions,
        setTransactions,
        transactionsMeta,
        setTransactionsMeta,
        loadingMoreTransactions,
        fetchTransactions,
        loadMoreTransactions,
    };
};
