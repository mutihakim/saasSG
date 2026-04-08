import { useCallback } from "react";

import { LockedGroupMeta, TransactionDraftMeta, TransactionDraftPayload } from "../components/transactionModalTypes";
import { TransactionType } from "../components/pwa/types";
import { FinanceTransaction } from "../types";

type Args = {
    activeMemberId?: number | null;
    defaultCurrency: string;
    selectedTransaction: FinanceTransaction | null;
    setFocusedTransactionId: React.Dispatch<React.SetStateAction<string | null>>;
    setShowDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    setTransactionPresetType: React.Dispatch<React.SetStateAction<"pemasukan" | "pengeluaran">>;
    setTransactionGroupLock: React.Dispatch<React.SetStateAction<LockedGroupMeta>>;
    setTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setTransactionDraft: React.Dispatch<React.SetStateAction<TransactionDraftPayload | null>>;
    setTransactionDraftMeta: React.Dispatch<React.SetStateAction<TransactionDraftMeta>>;
    setShowComposer: React.Dispatch<React.SetStateAction<boolean>>;
    setBatchEntryModal: React.Dispatch<React.SetStateAction<boolean>>;
    setTransferModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useFinanceTransactionEntry = ({
    activeMemberId,
    defaultCurrency,
    selectedTransaction,
    setFocusedTransactionId,
    setShowDetailSheet,
    setTransactionPresetType,
    setTransactionGroupLock,
    setTransactionModal,
    setSelectedTransaction,
    setTransactionDraft,
    setTransactionDraftMeta,
    setShowComposer,
    setBatchEntryModal,
    setTransferModal,
}: Args) => {
    const focusTransactionRow = useCallback((transactionId?: string | null) => {
        if (!transactionId || typeof window === "undefined") {
            return;
        }

        window.setTimeout(() => {
            const element = document.getElementById(`finance-transaction-${transactionId}`);
            if (!element) {
                return;
            }

            element.scrollIntoView({ block: "center", behavior: "smooth" });
            element.classList.add("shadow-sm");
            window.setTimeout(() => element.classList.remove("shadow-sm"), 1200);
        }, 60);
    }, []);

    const closeDetailSheet = useCallback(() => {
        const currentId = String(selectedTransaction?.id || "");
        setShowDetailSheet(false);

        if (currentId) {
            setFocusedTransactionId(currentId);
            focusTransactionRow(currentId);
        }
    }, [focusTransactionRow, selectedTransaction?.id, setFocusedTransactionId, setShowDetailSheet]);

    const buildTransactionDraftFromSource = useCallback((transaction: FinanceTransaction | null, options?: {
        duplicate?: boolean;
        preserveGroup?: boolean;
    }): TransactionDraftPayload | null => {
        if (!transaction) {
            return null;
        }

        const preserveGroup = options?.preserveGroup ?? false;
        const today = new Date().toISOString().slice(0, 10);

        return {
            owner_member_id: String(transaction.owner_member_id || transaction.owner_member?.id || activeMemberId || ""),
            type: transaction.type === "pemasukan" ? "pemasukan" : "pengeluaran",
            amount: String(transaction.amount || ""),
            currency_code: transaction.currency_code || defaultCurrency,
            category_id: transaction.category_id ? String(transaction.category_id) : "",
            transaction_date: options?.duplicate ? today : (transaction.transaction_date || today),
            description: transaction.description || "",
            notes: transaction.notes || "",
            merchant_name: transaction.merchant_name || "",
            location: transaction.location || "",
            reference_number: transaction.reference_number || "",
            bank_account_id: transaction.bank_account_id || transaction.bank_account?.id || "",
            pocket_id: transaction.pocket_id || transaction.pocket?.id || "",
            budget_id: transaction.budget_id ? String(transaction.budget_id) : "",
            payment_method: transaction.payment_method || "",
            exchange_rate: String(transaction.exchange_rate || "1.0"),
            tags: Array.isArray(transaction.tags) ? transaction.tags.map((tag) => typeof tag === "string" ? tag : tag.name || String(tag.id || "")) : [],
            source_type: preserveGroup ? (transaction.source_type || "") : "",
            source_id: preserveGroup ? (transaction.source_id || "") : "",
        };
    }, [activeMemberId, defaultCurrency]);

    const openCreateFromGroupedTransaction = useCallback((transaction: FinanceTransaction | null, options?: {
        duplicate?: boolean;
    }) => {
        if (!transaction) {
            return;
        }

        const label = transaction.merchant_name || transaction.notes || transaction.description || "Bulk Entry";
        const preserveGroup = transaction.source_type === "finance_bulk" && !!transaction.source_id;

        setSelectedTransaction(null);
        setShowDetailSheet(false);
        setTransactionPresetType(transaction.type === "pemasukan" ? "pemasukan" : "pengeluaran");
        setTransactionDraft(buildTransactionDraftFromSource(transaction, {
            duplicate: options?.duplicate,
            preserveGroup,
        }));
        setTransactionDraftMeta(null);
        setTransactionGroupLock(preserveGroup ? {
            sourceType: transaction.source_type ?? "",
            sourceId: transaction.source_id ?? "",
            merchantName: transaction.merchant_name || null,
            label,
        } : null);
        setTransactionModal(true);
    }, [
        buildTransactionDraftFromSource,
        setSelectedTransaction,
        setShowDetailSheet,
        setTransactionDraft,
        setTransactionDraftMeta,
        setTransactionGroupLock,
        setTransactionModal,
        setTransactionPresetType,
    ]);

    const editFromDetailSheet = useCallback(() => {
        setShowDetailSheet(false);
        setTransactionPresetType(selectedTransaction?.type === "pemasukan" ? "pemasukan" : "pengeluaran");
        setTransactionGroupLock(null);
        setTransactionModal(true);
    }, [selectedTransaction, setShowDetailSheet, setTransactionGroupLock, setTransactionModal, setTransactionPresetType]);

    const openNewTransaction = useCallback((type: TransactionType | "bulk") => {
        setShowComposer(false);
        if (type === "bulk") {
            setBatchEntryModal(true);
            return;
        }
        if (type === "transfer") {
            setTransferModal(true);
            return;
        }

        setTransactionPresetType(type);
        setSelectedTransaction(null);
        setTransactionDraft(null);
        setTransactionDraftMeta(null);
        setTransactionGroupLock(null);
        setTransactionModal(true);
    }, [
        setBatchEntryModal,
        setSelectedTransaction,
        setShowComposer,
        setTransactionDraft,
        setTransactionDraftMeta,
        setTransactionGroupLock,
        setTransactionModal,
        setTransactionPresetType,
        setTransferModal,
    ]);

    return {
        focusTransactionRow,
        closeDetailSheet,
        buildTransactionDraftFromSource,
        openCreateFromGroupedTransaction,
        editFromDetailSheet,
        openNewTransaction,
    };
};
