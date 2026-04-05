import React, { useEffect, useMemo, useState } from "react";

import { LockedGroupMeta, TransactionAttachment, TransactionDraftMeta, TransactionFormData } from "../components/transactionModalTypes";

const normalizeStringId = (value: unknown) => (value === null || value === undefined ? "" : String(value));
const formatLocalDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getCategoryOptionsForType = (categories: any[], type: "pemasukan" | "pengeluaran") =>
    categories.filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === type);

const isCategoryCompatibleWithType = (category: any, type: "pemasukan" | "pengeluaran") => {
    if (!category) {
        return false;
    }

    return !category.sub_type || category.sub_type === "all" || category.sub_type === type;
};

export const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) {
        return false;
    }

    if (item.scope === "shared") {
        return true;
    }

    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

type Args = {
    show: boolean;
    transaction?: any;
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    accounts: any[];
    budgets: any[];
    members: any[];
    activeMemberId?: number | null;
    initialType?: "pemasukan" | "pengeluaran";
    initialDraft?: Record<string, any> | null;
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
    members,
    activeMemberId,
    initialType = "pengeluaran",
    initialDraft = null,
    lockedGroupMeta = null,
}: Args) => {
    const isEdit = !!transaction;

    const buildInitialFormData = React.useCallback((): TransactionFormData => {
        const defaultOwnerMemberId = activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "";
        const defaultAccount = accounts[0];

        const draftType = initialDraft?.type === "pemasukan" ? "pemasukan" : initialType;
        const ownerMemberId = initialDraft?.owner_member_id ? String(initialDraft.owner_member_id) : defaultOwnerMemberId;
        const defaultAccountForOwner = accounts.find((account) => canUseForOwner(account, ownerMemberId)) ?? defaultAccount;
        const defaultCategoryForType = getCategoryOptionsForType(categories, draftType)[0];
        const requestedDraftCategoryId = initialDraft?.category_id ? String(initialDraft.category_id) : "";
        const resolvedDraftCategory = requestedDraftCategoryId
            ? categories.find((category) => String(category.id) === requestedDraftCategoryId && isCategoryCompatibleWithType(category, draftType))
            : null;

        return {
            type: draftType,
            owner_member_id: ownerMemberId,
            transaction_date: initialDraft?.transaction_date || formatLocalDate(new Date()),
            amount: initialDraft?.amount ? String(initialDraft.amount) : "",
            currency_code: initialDraft?.currency_code || (defaultAccountForOwner?.currency_code ?? defaultCurrency),
            category_id: resolvedDraftCategory
                ? String(resolvedDraftCategory.id)
                : (defaultCategoryForType ? String(defaultCategoryForType.id) : ""),
            bank_account_id: initialDraft?.bank_account_id ? String(initialDraft.bank_account_id) : (defaultAccountForOwner ? String(defaultAccountForOwner.id) : ""),
            budget_id: initialDraft?.budget_id ? String(initialDraft.budget_id) : "",
            payment_method: initialDraft?.payment_method || "",
            description: initialDraft?.description || initialDraft?.notes || "",
            tags: Array.isArray(initialDraft?.tags) ? initialDraft.tags : [],
            exchange_rate: initialDraft?.exchange_rate ? String(initialDraft.exchange_rate) : "1.0",
            merchant_name: initialDraft?.merchant_name || initialDraft?.merchant || "",
            location: initialDraft?.location || "",
            notes: initialDraft?.notes || "",
            reference_number: initialDraft?.reference_number || "",
            source_type: initialDraft?.source_type || lockedGroupMeta?.sourceType || "",
            source_id: initialDraft?.source_id || lockedGroupMeta?.sourceId || "",
            row_version: 1,
        };
    }, [accounts, activeMemberId, categories, defaultCurrency, initialDraft, initialType, lockedGroupMeta, members]);

    const [showCalculator, setShowCalculator] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>(buildInitialFormData);
    const [existingAttachments, setExistingAttachments] = useState<TransactionAttachment[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Array<string | number>>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null; mimeType?: string | null } | null>(null);

    useEffect(() => {
        if (!show) {
            return;
        }

        if (transaction) {
            setExistingAttachments(Array.isArray(transaction.attachments) ? transaction.attachments : []);
            setRemovedAttachmentIds([]);
            setPendingFiles([]);
            setFormData({
                type: transaction.type,
                owner_member_id: String(transaction.owner_member_id || activeMemberId || ""),
                transaction_date: transaction.transaction_date,
                amount: String(transaction.amount),
                currency_code: transaction.currency_code,
                category_id: normalizeStringId(transaction.category_id),
                bank_account_id: normalizeStringId(transaction.bank_account_id),
                budget_id: normalizeStringId(transaction.budget_id),
                payment_method: transaction.payment_method || "",
                description: transaction.description || "",
                tags: (transaction.tags || []).map((tag: any) => tag.name),
                exchange_rate: String(transaction.exchange_rate || "1.0"),
                merchant_name: transaction.merchant_name || "",
                location: transaction.location || "",
                notes: transaction.notes || "",
                reference_number: transaction.reference_number || "",
                source_type: transaction.source_type || "",
                source_id: transaction.source_id || "",
                row_version: transaction.row_version || 1,
            });
            return;
        }

        setExistingAttachments([]);
        setRemovedAttachmentIds([]);
        setPendingFiles([]);
        setFormData(buildInitialFormData());
    }, [show, transaction, activeMemberId, buildInitialFormData]);

    useEffect(() => {
        if (!show || isEdit || !lockedGroupMeta) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            source_type: lockedGroupMeta.sourceType || prev.source_type,
            source_id: lockedGroupMeta.sourceId || prev.source_id,
            merchant_name: lockedGroupMeta.merchantName ?? prev.merchant_name,
        }));
    }, [isEdit, lockedGroupMeta, show]);

    const memberOptions = useMemo(() => members.map((member) => ({
        value: String(member.id),
        label: member.full_name,
    })), [members]);

    const visibleAccounts = useMemo(() => accounts.filter((account) => canUseForOwner(account, formData.owner_member_id)), [accounts, formData.owner_member_id]);
    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, formData.owner_member_id)), [budgets, formData.owner_member_id]);

    const accountOptions = useMemo(() => visibleAccounts.map((account) => ({
        label: `${account.name} · ${account.currency_code}`,
        value: String(account.id),
    })), [visibleAccounts]);

    const budgetOptions = useMemo(() => visibleBudgets.map((budget) => ({
        label: `${budget.name} · ${budget.period_month}`,
        value: String(budget.id),
    })), [visibleBudgets]);

    const categoryOptions = useMemo(() => getCategoryOptionsForType(categories, formData.type)
        .map((category) => ({
            label: category.name,
            value: String(category.id),
        })), [categories, formData.type]);

    const currencyOptions = useMemo(() => currencies.map((currency) => ({
        label: `${currency.code} - ${currency.name}`,
        value: currency.code,
    })), [currencies]);

    const paymentMethodOptions = useMemo(() => paymentMethods.map((method) => ({
        label: method.label,
        value: method.value,
    })), [paymentMethods]);

    useEffect(() => {
        if (!show) {
            return;
        }

        setFormData((prev) => {
            const next = { ...prev };

            const accountStillValid = accountOptions.some((option) => option.value === next.bank_account_id);
            if (!accountStillValid) {
                next.bank_account_id = accountOptions[0]?.value ?? "";
            }

            const categoryStillValid = categoryOptions.some((option) => option.value === next.category_id);
            if (!categoryStillValid) {
                const requestedCategory = next.category_id
                    ? categories.find((category) => String(category.id) === String(next.category_id))
                    : null;
                const shouldPreserveRequestedCategory = isCategoryCompatibleWithType(requestedCategory, next.type);

                if (!shouldPreserveRequestedCategory) {
                    next.category_id = categoryOptions[0]?.value ?? "";
                }
            }

            const budgetStillValid = budgetOptions.some((option) => option.value === next.budget_id);
            if (!budgetStillValid) {
                next.budget_id = "";
            }

            if (!next.owner_member_id && memberOptions[0]) {
                next.owner_member_id = memberOptions[0].value;
            }

            const syncedAccount = accounts.find((account) => String(account.id) === String(next.bank_account_id));
            if (syncedAccount?.currency_code) {
                next.currency_code = syncedAccount.currency_code;
                if (syncedAccount.currency_code === defaultCurrency) {
                    next.exchange_rate = "1.0";
                }
            }

            return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        });
    }, [accountOptions, accounts, budgetOptions, categories, categoryOptions, defaultCurrency, memberOptions, show]);

    const selectedBudget = budgets.find((budget) => String(budget.id) === String(formData.budget_id));
    const budgetDelta = selectedBudget
        ? Number(selectedBudget.remaining_amount || 0) - (Number(formData.amount || 0) * Number(formData.exchange_rate || 1))
        : 0;

    const handleAttachmentPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) {
            return;
        }

        setPendingFiles((prev) => [...prev, ...files]);
        event.target.value = "";
    };

    const handleRemoveExistingAttachment = (attachmentId: string | number) => {
        setRemovedAttachmentIds((prev) => Array.from(new Set([...prev, attachmentId])));
        setExistingAttachments((prev) => prev.filter((attachment) => String(attachment.id) !== String(attachmentId)));
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
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
        accountOptions,
        budgetOptions,
        categoryOptions,
        currencyOptions,
        paymentMethodOptions,
        selectedBudget,
        budgetDelta,
        handleAttachmentPick,
        handleRemoveExistingAttachment,
        handleRemovePendingFile,
    };
};
