import React, { useCallback } from "react";

import { FinanceAccount, FinanceBudget, FinanceTransaction } from "../types";

import {
    FinanceListFilters,
    isBudgetVisible,
    isTransactionVisible,
    sortAccountsByScopeAndName,
    sortBudgetsByPeriodAndName,
    sortTransactionsByNewest,
} from "./finance-list/visibility";

type Args = {
    filters: FinanceListFilters;
    setTransactions: React.Dispatch<React.SetStateAction<FinanceTransaction[]>>;
    setAccounts: React.Dispatch<React.SetStateAction<FinanceAccount[]>>;
    setBudgets: React.Dispatch<React.SetStateAction<FinanceBudget[]>>;
    focusTransactionRow: (transactionId?: string | null) => void;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setFocusedTransactionId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const useFinanceListSync = ({
    filters,
    setTransactions,
    setAccounts,
    setBudgets,
    focusTransactionRow,
    setSelectedTransaction,
    setFocusedTransactionId,
}: Args) => {
    const isTransactionVisibleInCurrentList = useCallback((transaction: FinanceTransaction | null) => {
        return isTransactionVisible(filters, transaction);
    }, [filters]);

    const upsertTransactionInList = useCallback((transaction?: FinanceTransaction | null) => {
        if (!transaction) {
            return;
        }

        setTransactions((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(transaction.id));
            if (!isTransactionVisibleInCurrentList(transaction)) {
                return withoutCurrent;
            }

            return sortTransactionsByNewest([transaction, ...withoutCurrent]);
        });

        setSelectedTransaction(transaction);
        setFocusedTransactionId(String(transaction.id));
        focusTransactionRow(String(transaction.id));
    }, [focusTransactionRow, isTransactionVisibleInCurrentList, setFocusedTransactionId, setSelectedTransaction, setTransactions]);

    const removeTransactionFromList = useCallback((transactionId: string) => {
        let fallbackId: string | null = null;

        setTransactions((prev) => {
            const index = prev.findIndex((item) => String(item.id) === transactionId);
            if (index !== -1) {
                fallbackId = String(prev[index + 1]?.id || prev[index - 1]?.id || "");
            }

            return prev.filter((item) => String(item.id) !== transactionId);
        });

        setFocusedTransactionId(fallbackId || null);
        if (fallbackId) {
            focusTransactionRow(fallbackId);
        }
    }, [focusTransactionRow, setFocusedTransactionId, setTransactions]);

    const removeTransactionGroupFromList = useCallback((sourceId: string) => {
        setTransactions((prev) => prev.filter((item) => !(item.source_type === "finance_bulk" && String(item.source_id || "") === sourceId)));
        setFocusedTransactionId(null);
    }, [setFocusedTransactionId, setTransactions]);

    const upsertAccountInList = useCallback((account?: FinanceAccount | null) => {
        if (!account) {
            return;
        }

        setAccounts((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(account.id));
            return sortAccountsByScopeAndName([...withoutCurrent, account]);
        });
    }, [setAccounts]);

    const removeAccountFromList = useCallback((accountId: string) => {
        setAccounts((prev) => prev.filter((item) => String(item.id) !== accountId));
    }, [setAccounts]);

    const isBudgetVisibleInCurrentList = useCallback((budget?: FinanceBudget | null) => {
        return isBudgetVisible(filters, budget);
    }, [filters]);

    const upsertBudgetInList = useCallback((budget?: FinanceBudget | null) => {
        if (!budget) {
            return;
        }

        setBudgets((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(budget.id));
            if (!isBudgetVisibleInCurrentList(budget)) {
                return withoutCurrent;
            }

            return sortBudgetsByPeriodAndName([...withoutCurrent, budget]);
        });
    }, [isBudgetVisibleInCurrentList, setBudgets]);

    const removeBudgetFromList = useCallback((budgetId: string) => {
        setBudgets((prev) => prev.filter((item) => String(item.id) !== budgetId));
    }, [setBudgets]);

    return {
        isTransactionVisibleInCurrentList,
        upsertTransactionInList,
        removeTransactionFromList,
        removeTransactionGroupFromList,
        upsertAccountInList,
        removeAccountFromList,
        isBudgetVisibleInCurrentList,
        upsertBudgetInList,
        removeBudgetFromList,
    };
};
