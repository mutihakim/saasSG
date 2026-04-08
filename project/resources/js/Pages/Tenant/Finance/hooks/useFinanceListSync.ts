import React, { useCallback } from "react";

import { FinanceAccount, FinanceBudget, FinanceTransaction } from "../types";

type FilterState = {
    search: string;
    owner_member_id: string;
    bank_account_id: string;
    category_id: string;
    use_custom_range: boolean;
    date_from: string;
    date_to: string;
    month: string;
    transaction_kind: "all" | "external" | "internal_transfer";
};

type Args = {
    filters: FilterState;
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
        if (!transaction) {
            return false;
        }

        const transactionDate = String(transaction.transaction_date || "").slice(0, 10);
        const transactionMonth = transactionDate.slice(0, 7);
        const ownerMemberId = String(transaction.owner_member_id || transaction.owner_member?.id || "");
        const bankAccountId = String(transaction.bank_account_id || transaction.bank_account?.id || "");
        const categoryId = String(transaction.category_id || transaction.category?.id || "");
        const searchHaystack = [
            transaction.description,
            transaction.category?.name,
            transaction.owner_member?.full_name,
            transaction.bank_account?.name,
            transaction.notes,
            transaction.reference_number,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (filters.search && !searchHaystack.includes(filters.search.toLowerCase())) {
            return false;
        }

        if (filters.owner_member_id && ownerMemberId !== filters.owner_member_id) {
            return false;
        }

        if (filters.bank_account_id && bankAccountId !== filters.bank_account_id) {
            return false;
        }

        if (filters.category_id && categoryId !== filters.category_id) {
            return false;
        }

        const isInternalTransfer = transaction.type === "transfer" || Boolean(transaction.is_internal_transfer);
        if (filters.transaction_kind === "external" && isInternalTransfer) {
            return false;
        }
        if (filters.transaction_kind === "internal_transfer" && !isInternalTransfer) {
            return false;
        }

        if (filters.use_custom_range) {
            if (filters.date_from && transactionDate < filters.date_from) {
                return false;
            }
            if (filters.date_to && transactionDate > filters.date_to) {
                return false;
            }
        } else if (filters.month && transactionMonth !== filters.month) {
            return false;
        }

        return true;
    }, [filters]);

    const sortTransactions = useCallback((items: FinanceTransaction[]) => {
        return [...items].sort((a, b) => {
            const dateCompare = String(b.transaction_date || "").localeCompare(String(a.transaction_date || ""));
            if (dateCompare !== 0) {
                return dateCompare;
            }

            return String(b.created_at || b.id || "").localeCompare(String(a.created_at || a.id || ""));
        });
    }, []);

    const upsertTransactionInList = useCallback((transaction?: FinanceTransaction | null) => {
        if (!transaction) {
            return;
        }

        setTransactions((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(transaction.id));
            if (!isTransactionVisibleInCurrentList(transaction)) {
                return withoutCurrent;
            }

            return sortTransactions([transaction, ...withoutCurrent]);
        });

        setSelectedTransaction(transaction);
        setFocusedTransactionId(String(transaction.id));
        focusTransactionRow(String(transaction.id));
    }, [focusTransactionRow, isTransactionVisibleInCurrentList, setFocusedTransactionId, setSelectedTransaction, setTransactions, sortTransactions]);

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
            return [...withoutCurrent, account].sort((a, b) => {
                const scopeCompare = String(a.scope || "").localeCompare(String(b.scope || ""));
                if (scopeCompare !== 0) {
                    return scopeCompare;
                }

                return String(a.name || "").localeCompare(String(b.name || ""));
            });
        });
    }, [setAccounts]);

    const removeAccountFromList = useCallback((accountId: string) => {
        setAccounts((prev) => prev.filter((item) => String(item.id) !== accountId));
    }, [setAccounts]);

    const isBudgetVisibleInCurrentList = useCallback((budget?: FinanceBudget | null) => {
        if (!budget) {
            return false;
        }

        if (filters.use_custom_range) {
            return true;
        }

        return String(budget.period_month || "") === filters.month;
    }, [filters.month, filters.use_custom_range]);

    const upsertBudgetInList = useCallback((budget?: FinanceBudget | null) => {
        if (!budget) {
            return;
        }

        setBudgets((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(budget.id));
            if (!isBudgetVisibleInCurrentList(budget)) {
                return withoutCurrent;
            }

            return [...withoutCurrent, budget].sort((a, b) => {
                const periodCompare = String(b.period_month || "").localeCompare(String(a.period_month || ""));
                if (periodCompare !== 0) {
                    return periodCompare;
                }

                return String(a.name || "").localeCompare(String(b.name || ""));
            });
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
