import { useState, useCallback, useMemo } from "react";

import { TransactionFormData, TransactionDraftPayload, LockedGroupMeta } from "../../components/transactionModalTypes";
import { FinanceAccount, FinanceCategory, FinanceMember, FinanceWallet, FinanceTransaction } from "../../types";

import { buildInitialFormData } from "./buildInitialFormData";
import { findPocketForAccount, normalizeStringId } from "./helpers";

type Args = {
    show: boolean;
    transaction?: FinanceTransaction;
    activeMemberId?: number | null;
    initialType: "pemasukan" | "pengeluaran";
    initialDraft: TransactionDraftPayload | null;
    lockedGroupMeta: LockedGroupMeta | null;
    accounts: FinanceAccount[];
    categories: FinanceCategory[];
    defaultCurrency: string;
    members: FinanceMember[];
    pockets: FinanceWallet[];
};

export const useTransactionFormState = ({
    show,
    transaction,
    activeMemberId,
    initialType,
    initialDraft,
    lockedGroupMeta,
    accounts,
    categories,
    defaultCurrency,
    members,
    pockets,
}: Args) => {
    const buildInitial = useCallback((): TransactionFormData => buildInitialFormData({
        accounts,
        activeMemberId,
        categories,
        defaultCurrency,
        initialDraft,
        initialType,
        lockedGroupMeta: lockedGroupMeta || undefined,
        members,
        pockets,
    }), [accounts, activeMemberId, categories, defaultCurrency, initialDraft, initialType, lockedGroupMeta, members, pockets]);

    // Create a unique key for each transaction/modal state
    // This triggers React to reset state naturally when key changes
    const initializationKey = useMemo(() => {
        if (!show) return null;

        return transaction
            ? `edit:${transaction.id}:${transaction.row_version || 1}:${Array.isArray(transaction.tags) ? transaction.tags.length : -1}:${Array.isArray(transaction.attachments) ? transaction.attachments.length : -1}:${normalizeStringId(transaction.wallet_id || transaction.wallet?.id || transaction.pocket?.id)}:${normalizeStringId(transaction.budget_id)}`
            : `create:${JSON.stringify({
                draft: initialDraft,
                activeMemberId,
                initialType,
                lock: lockedGroupMeta,
            })}`;
    }, [show, transaction, initialDraft, activeMemberId, initialType, lockedGroupMeta]);

    // Track the key we've already processed
    const [processedKey, setProcessedKey] = useState<string | null>(null);

    // Build form data - reset when key changes
    const [formData, setFormData] = useState<TransactionFormData>(() => {
        // Initial build
        return buildInitial();
    });

    // Synchronize form data when initialization key changes
    // This runs during render, which is the correct React pattern for derived state
    if (show && initializationKey !== processedKey) {
        // Mark this key as processed
        setProcessedKey(initializationKey);

        // Set form data based on transaction or reset to initial
        const nextFormData: TransactionFormData = transaction
            ? {
                type: (transaction.type === "pemasukan" ? "pemasukan" : "pengeluaran") as "pemasukan" | "pengeluaran",
                owner_member_id: String(transaction.owner_member_id || activeMemberId || ""),
                transaction_date: transaction.transaction_date,
                amount: String(transaction.amount),
                currency_code: transaction.currency_code,
                category_id: normalizeStringId(transaction.category_id),
                bank_account_id: normalizeStringId(transaction.bank_account_id),
                wallet_id: normalizeStringId(
                    transaction.wallet_id
                    || transaction.wallet?.id
                    || transaction.pocket?.id
                    || findPocketForAccount(pockets, String(transaction.owner_member_id || activeMemberId || ""), normalizeStringId(transaction.bank_account_id))?.id,
                ),
                budget_id: normalizeStringId(transaction.budget_id),
                payment_method: transaction.payment_method || "",
                description: transaction.description || "",
                tags: (transaction.tags || []).map((tag) => typeof tag === "string" ? tag : tag.name),
                exchange_rate: String(transaction.exchange_rate || "1.0"),
                merchant_name: transaction.merchant_name || "",
                location: transaction.location || "",
                notes: transaction.notes || "",
                reference_number: transaction.reference_number || "",
                source_type: transaction.source_type || "",
                source_id: transaction.source_id || "",
                row_version: transaction.row_version || 1,
            }
            : buildInitial();

        // Update state - React will batch this with the current render
        setFormData(nextFormData);
    }

    // Reset tracking when modal closes
    if (!show && processedKey !== null) {
        setProcessedKey(null);
    }

    return { formData, setFormData, buildInitial };
};
