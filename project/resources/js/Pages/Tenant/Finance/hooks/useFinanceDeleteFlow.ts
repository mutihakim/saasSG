import axios from "axios";
import { useCallback } from "react";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { FinanceAccount, FinanceBudget, FinanceDeleteTarget, FinanceTransaction } from "../types";

type DeleteTargetType = "transaction" | "transaction_group" | "account" | "budget";
type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    deleteTarget: FinanceDeleteTarget | null;
    deleteTargetType: DeleteTargetType;
    tenantRoute: TenantRouteLike;
    refreshFinanceSideData: () => Promise<unknown>;
    selectedTransaction: FinanceTransaction | null;
    removeTransactionFromList: (transactionId: string) => void;
    removeTransactionGroupFromList: (sourceId: string) => void;
    removeAccountFromList: (accountId: string) => void;
    removeBudgetFromList: (budgetId: string) => void;
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>;
    setShowDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setSelectedAccount: React.Dispatch<React.SetStateAction<FinanceAccount | null>>;
    setSelectedBudget: React.Dispatch<React.SetStateAction<FinanceBudget | null>>;
    t: (key: string) => string;
};

export const useFinanceDeleteFlow = ({
    deleteTarget,
    deleteTargetType,
    tenantRoute,
    refreshFinanceSideData,
    selectedTransaction,
    removeTransactionFromList,
    removeTransactionGroupFromList,
    removeAccountFromList,
    removeBudgetFromList,
    setDeleteModal,
    setIsDeleting,
    setShowDetailSheet,
    setSelectedTransaction,
    setSelectedAccount,
    setSelectedBudget,
    t,
}: Args) => useCallback(async () => {
    if (!deleteTarget) {
        return;
    }

    const target = deleteTarget as { id?: string | number; sourceId?: string };

    setIsDeleting(true);
    try {
        if (deleteTargetType === "transaction") {
            await axios.delete(tenantRoute.apiTo(`/finance/transactions/${target.id}`));
        }

        if (deleteTargetType === "transaction_group") {
            await axios.delete(tenantRoute.apiTo(`/finance/transactions/groups/${target.sourceId}`));
        }

        if (deleteTargetType === "account") {
            await axios.delete(tenantRoute.apiTo(`/finance/accounts/${target.id}`));
        }

        if (deleteTargetType === "budget") {
            await axios.delete(tenantRoute.apiTo(`/finance/budgets/${target.id}`));
        }

        notify.success(t("finance.shared.deleted"));
        setDeleteModal(false);

        if (deleteTargetType === "transaction") {
            const deletedId = String(target.id);
            setShowDetailSheet(false);
            setSelectedTransaction(null);
            removeTransactionFromList(deletedId);
            await refreshFinanceSideData();
            return;
        }

        if (deleteTargetType === "transaction_group") {
            setShowDetailSheet(false);
            if (selectedTransaction?.source_type === "finance_bulk" && String(selectedTransaction?.source_id || "") === String(target.sourceId || "")) {
                setSelectedTransaction(null);
            }
            removeTransactionGroupFromList(String(target.sourceId || ""));
            await refreshFinanceSideData();
            return;
        }

        if (deleteTargetType === "account") {
            removeAccountFromList(String(target.id));
            setSelectedAccount(null);
            return;
        }

        if (deleteTargetType === "budget") {
            removeBudgetFromList(String(target.id));
            setSelectedBudget(null);
        }
    } catch (error: unknown) {
        const parsed = parseApiError(error, t("finance.shared.delete_failed"));
        notify.error({ title: parsed.title, detail: parsed.detail });
    } finally {
        setIsDeleting(false);
    }
}, [
    deleteTarget,
    deleteTargetType,
    refreshFinanceSideData,
    removeAccountFromList,
    removeBudgetFromList,
    removeTransactionFromList,
    removeTransactionGroupFromList,
    selectedTransaction,
    setDeleteModal,
    setIsDeleting,
    setSelectedAccount,
    setSelectedBudget,
    setSelectedTransaction,
    setShowDetailSheet,
    t,
    tenantRoute,
]);
