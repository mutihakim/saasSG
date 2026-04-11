import React, { useEffect, useMemo, useRef, useState } from "react";

import { LockedGroupMeta, TransactionAttachment, TransactionDraftPayload } from "../components/transactionModalTypes";
import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceMember, FinancePaymentMethodOption, FinanceWallet, FinanceTransaction } from "../types";

import { canUseForOwner, getCategoryOptionsForType, toPeriodMonth } from "./transaction-modal/helpers";
import { syncTransactionFormData } from "./transaction-modal/syncFormData";
import { useTransactionDerivedMetrics } from "./transaction-modal/useTransactionDerivedMetrics";
import { useTransactionFormState } from "./transaction-modal/useTransactionFormState";

export { canUseForOwner } from "./transaction-modal/helpers";

type Args = {
    show: boolean;
    transaction?: FinanceTransaction;
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    defaultCurrency: string;
    paymentMethods: FinancePaymentMethodOption[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    pockets: FinanceWallet[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    _walletSubscribed?: boolean;
    initialType?: "pemasukan" | "pengeluaran";
    initialDraft?: TransactionDraftPayload | null;
    lockedGroupMeta?: LockedGroupMeta;
};

export const useTransactionModalState = ({
    show,
    transaction,
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    accounts,
    budgets,
    pockets,
    members,
    activeMemberId,
    initialType = "pengeluaran",
    initialDraft = null,
    lockedGroupMeta = null,
}: Args) => {
    const isEdit = !!transaction;
    const lastHandledWalletIdRef = useRef<string | null>(null);

    // 1. Form State Hook
    const { formData, setFormData } = useTransactionFormState({
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
    });

    // 2. UI State (Attachments, Calculator, Previews)
    const [showCalculator, setShowCalculator] = useState(false);
    const [existingAttachments, setExistingAttachments] = useState<TransactionAttachment[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Array<string | number>>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null; mimeType?: string | null } | null>(null);

    const [prevTransactionId, setPrevId] = useState<string | number | undefined>(undefined);

    if (!show && prevTransactionId !== undefined) {
        setPrevId(undefined);
    }

    if (show && transaction?.id !== prevTransactionId) {
        setPrevId(transaction?.id);
        setExistingAttachments(Array.isArray(transaction?.attachments) ? transaction?.attachments : []);
        setRemovedAttachmentIds([]);
        setPendingFiles([]);
    }

    // Livedit: Force budget when pocket changes
    useEffect(() => {
        if (!show || !formData.wallet_id || isEdit) return;

        if (lastHandledWalletIdRef.current !== formData.wallet_id) {
            const currentWalletId = formData.wallet_id;
            lastHandledWalletIdRef.current = currentWalletId;

            const pocket = pockets.find((p) => String(p.id) === String(currentWalletId));
            if (pocket && formData.type === "pengeluaran") {
                const budgetCandidates = budgets.filter((b) => canUseForOwner(b, formData.owner_member_id));
                const walletDefault = pocket.default_budget_key
                    ? budgetCandidates.find((b) =>
                        String(b.budget_key || b.code || b.id) === String(pocket.default_budget_key)
                        && String(b.period_month) === toPeriodMonth(formData.transaction_date)
                        && b.is_active !== false
                    )
                    : null;
                
                if (walletDefault) {
                    setFormData((prev) => ({ ...prev, budget_id: String(walletDefault.id) }));
                }
            }
        }
    }, [formData.wallet_id, show, isEdit, pockets, budgets, formData.owner_member_id, formData.transaction_date, formData.type, setFormData]);

    // Live sync for complex dependencies
    useEffect(() => {
        if (!show) return;
        setFormData((prev) => {
            const next = syncTransactionFormData({
                formData: prev,
                accounts,
                budgets,
                categories,
                defaultCurrency,
                isEdit,
                memberOptions: members.map(m => ({ value: String(m.id), label: m.full_name })),
                pockets,
                transaction,
            });
            return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        });
    }, [accounts, budgets, categories, defaultCurrency, isEdit, members, pockets, show, transaction, setFormData]);

    // 3. Derived Data & Options
    const memberOptions = useMemo(() => members.map((m) => ({ value: String(m.id), label: m.full_name })), [members]);
    const visibleAccounts = useMemo(() => accounts.filter((a) => canUseForOwner(a, formData.owner_member_id)), [accounts, formData.owner_member_id]);
    const visiblePockets = useMemo(() => pockets.filter((p) => canUseForOwner(p, formData.owner_member_id)), [formData.owner_member_id, pockets]);
    const selectedPocket = useMemo(() => pockets.find((p) => String(p.id) === String(formData.wallet_id)) ?? null, [formData.wallet_id, pockets]);
    const visibleBudgets = useMemo(() => budgets.filter((b) => canUseForOwner(b, formData.owner_member_id)), [budgets, formData.owner_member_id]);
    
    const transactionPeriodMonth = toPeriodMonth(formData.transaction_date);
    const monthScopedBudgets = useMemo(
        () => visibleBudgets.filter((b) => String(b.period_month) === transactionPeriodMonth && b.is_active !== false),
        [transactionPeriodMonth, visibleBudgets],
    );

    const filteredBudgets = useMemo(() => {
        const fallbackBudgets = visibleBudgets.filter((b) => b.is_active !== false);
        let prioritizedBudgets = monthScopedBudgets.length > 0 ? monthScopedBudgets : fallbackBudgets;
        if (selectedPocket && selectedPocket.scope === "shared") {
            prioritizedBudgets = prioritizedBudgets.filter(b => b.scope === "shared");
        }
        if (!selectedPocket) return prioritizedBudgets;

        const lockedDefault = selectedPocket.default_budget_key
            ? prioritizedBudgets.find((b) => String(b.budget_key || b.code || b.id) === String(selectedPocket.default_budget_key))
            : null;
        const mapped = prioritizedBudgets.filter((b) => b.wallet_id && String(b.wallet_id) === String(selectedPocket.id));
        const unallocated = prioritizedBudgets.filter((b) => !b.wallet_id);
        const remaining = prioritizedBudgets.filter((b) => b !== lockedDefault && !mapped.includes(b) && !unallocated.includes(b));

        const ordered = [lockedDefault, ...mapped, ...unallocated, ...remaining].filter(Boolean) as FinanceBudget[];
        const selectedExistingBudget = formData.budget_id ? visibleBudgets.find((b) => String(b.id) === String(formData.budget_id)) : null;

        if (isEdit && selectedExistingBudget && !ordered.some((b) => String(b.id) === String(selectedExistingBudget.id))) {
            return [selectedExistingBudget, ...ordered];
        }
        return ordered;
    }, [formData.budget_id, isEdit, monthScopedBudgets, selectedPocket, visibleBudgets]);

    // 4. Metrics & Validation Hook
    const metrics = useTransactionDerivedMetrics({
        formData,
        transaction,
        _accounts: accounts,
        budgets,
        _pockets: pockets,
        selectedPocket,
        selectedAccount: accounts.find((a) => String(a.id) === String(selectedPocket?.real_account_id || formData.bank_account_id)) ?? null,
        monthScopedBudgets,
    });

    // 5. Handlers
    const handleAttachmentPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length > 0) {
            setPendingFiles((prev) => [...prev, ...files]);
            event.target.value = "";
        }
    };

    const handleRemoveExistingAttachment = (attachmentId: string | number) => {
        setRemovedAttachmentIds((prev) => Array.from(new Set([...prev, attachmentId])));
        setExistingAttachments((prev) => prev.filter((a) => String(a.id) !== String(attachmentId)));
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return {
        isEdit,
        formData,
        setFormData,
        showCalculator,
        setShowCalculator,
        existingAttachments,
        removedAttachmentIds,
        pendingFiles,
        previewItem,
        setPreviewItem,
        memberOptions,
        accountOptions: visibleAccounts.map(a => ({ label: `${a.name} · ${a.currency_code}`, value: String(a.id) })),
        pocketOptions: visiblePockets.map(p => ({ label: `${p.name} · ${p.real_account?.name || p.realAccount?.name || p.currency_code}`, value: String(p.id) })),
        budgetOptions: filteredBudgets.map(b => ({ label: `${b.name} · ${b.period_month}`, value: String(b.id) })),
        categoryOptions: getCategoryOptionsForType(categories, formData.type).map(c => ({ label: c.name, value: String(c.id) })),
        currencyOptions: currencies.map(c => ({ label: `${c.code} - ${c.name}`, value: c.code })),
        paymentMethodOptions: paymentMethods.map(m => ({ label: m.label, value: m.value })),
        selectedAccount: metrics.selectedAccount,
        selectedPocket,
        selectedBudget: metrics.selectedBudget,
        budgetLocked: metrics.budgetLocked,
        budgetLockMissingForMonth: metrics.budgetLockMissingForMonth,
        budgetDelta: metrics.budgetDelta,
        insufficientPocketBalance: metrics.insufficientPocketBalance,
        handleAttachmentPick,
        handleRemoveExistingAttachment,
        handleRemovePendingFile,
    };
};
