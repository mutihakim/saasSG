import { FinanceAccount, FinanceBudget, FinanceTransaction } from "../../types";

export type FinanceListFilters = {
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

export const isTransactionVisible = (filters: FinanceListFilters, transaction: FinanceTransaction | null) => {
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
};

export const isBudgetVisible = (filters: Pick<FinanceListFilters, "month" | "use_custom_range">, budget?: FinanceBudget | null) => {
    if (!budget) {
        return false;
    }

    if (filters.use_custom_range) {
        return true;
    }

    return String(budget.period_month || "") === filters.month;
};

export const sortTransactionsByNewest = (items: FinanceTransaction[]) => (
    [...items].sort((a, b) => {
        const dateCompare = String(b.transaction_date || "").localeCompare(String(a.transaction_date || ""));
        if (dateCompare !== 0) {
            return dateCompare;
        }

        return String(b.created_at || b.id || "").localeCompare(String(a.created_at || a.id || ""));
    })
);

export const sortAccountsByScopeAndName = (items: FinanceAccount[]) => (
    [...items].sort((a, b) => {
        const scopeCompare = String(a.scope || "").localeCompare(String(b.scope || ""));
        if (scopeCompare !== 0) {
            return scopeCompare;
        }

        return String(a.name || "").localeCompare(String(b.name || ""));
    })
);

export const sortBudgetsByPeriodAndName = (items: FinanceBudget[]) => (
    [...items].sort((a, b) => {
        const periodCompare = String(b.period_month || "").localeCompare(String(a.period_month || ""));
        if (periodCompare !== 0) {
            return periodCompare;
        }

        return String(a.name || "").localeCompare(String(b.name || ""));
    })
);
