import { useCallback } from "react";

import { LockedGroupMeta, TransactionDraftMeta, TransactionDraftPayload } from "../components/transactionModalTypes";
import { FinanceBatchDraft, FinanceBudget, FinanceTransaction } from "../types";

type Args = {
    clearWhatsappQuery: () => void;
    showDetailSheet: boolean;
    setTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
    setTransactionDraft: React.Dispatch<React.SetStateAction<TransactionDraftPayload | null>>;
    setTransactionDraftMeta: React.Dispatch<React.SetStateAction<TransactionDraftMeta>>;
    setTransactionGroupLock: React.Dispatch<React.SetStateAction<LockedGroupMeta>>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setBatchModal: React.Dispatch<React.SetStateAction<boolean>>;
    setBatchDraft: React.Dispatch<React.SetStateAction<FinanceBatchDraft | null>>;
    setBudgetModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedBudget: React.Dispatch<React.SetStateAction<FinanceBudget | null>>;
};

export const useFinanceDialogCloseHandlers = ({
    clearWhatsappQuery,
    showDetailSheet,
    setTransactionModal,
    setTransactionDraft,
    setTransactionDraftMeta,
    setTransactionGroupLock,
    setSelectedTransaction,
    setBatchModal,
    setBatchDraft,
    setBudgetModal,
    setSelectedBudget,
}: Args) => {
    const closeTransactionModal = useCallback(() => {
        setTransactionModal(false);
        setTransactionDraft(null);
        setTransactionDraftMeta(null);
        setTransactionGroupLock(null);
        clearWhatsappQuery();
        if (!showDetailSheet) {
            setSelectedTransaction(null);
        }
    }, [
        clearWhatsappQuery,
        setSelectedTransaction,
        setTransactionDraft,
        setTransactionDraftMeta,
        setTransactionGroupLock,
        setTransactionModal,
        showDetailSheet,
    ]);

    const closeBatchReviewModal = useCallback(() => {
        setBatchModal(false);
        setBatchDraft(null);
        clearWhatsappQuery();
    }, [clearWhatsappQuery, setBatchDraft, setBatchModal]);

    const closeBudgetModal = useCallback(() => {
        setBudgetModal(false);
        setSelectedBudget(null);
    }, [setBudgetModal, setSelectedBudget]);

    return {
        closeTransactionModal,
        closeBatchReviewModal,
        closeBudgetModal,
    };
};
