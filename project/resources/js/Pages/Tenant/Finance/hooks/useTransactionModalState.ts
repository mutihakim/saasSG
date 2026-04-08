import React, { useEffect, useMemo, useRef, useState } from "react";

import { LockedGroupMeta, TransactionAttachment, TransactionDraftPayload, TransactionFormData } from "../components/transactionModalTypes";
import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceMember, FinancePaymentMethodOption, FinancePocket, FinanceTransaction } from "../types";

const normalizeStringId = (value: unknown) => (value === null || value === undefined ? "" : String(value));
const formatLocalDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getCategoryOptionsForType = (categories: FinanceCategory[], type: "pemasukan" | "pengeluaran") =>
    categories.filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === type);

const isCategoryCompatibleWithType = (category: FinanceCategory | undefined | null, type: "pemasukan" | "pengeluaran") => {
    if (!category) {
        return false;
    }

    return !category.sub_type || category.sub_type === "all" || category.sub_type === type;
};

const findPocketForAccount = (pockets: FinancePocket[], ownerMemberId: string, accountId?: string | null) => {
    const visiblePockets = pockets.filter((pocket) => canUseForOwner(pocket, ownerMemberId));
    if (accountId) {
        const matched = visiblePockets.find((pocket) => String(pocket.real_account_id) === String(accountId) && pocket.is_active !== false);
        if (matched) {
            return matched;
        }
    }

    return visiblePockets[0] ?? null;
};

const toPeriodMonth = (value: string) => String(value || "").slice(0, 7);

export const canUseForOwner = (item: FinanceAccount | FinanceBudget | FinancePocket | undefined | null, ownerMemberId: string) => {
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
    transaction?: FinanceTransaction;
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    defaultCurrency: string;
    paymentMethods: FinancePaymentMethodOption[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    pockets: FinancePocket[];
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
    _walletSubscribed = false,
    initialType = "pengeluaran",
    initialDraft = null,
    lockedGroupMeta = null,
}: Args) => {
    const isEdit = !!transaction;
    const initializedKeyRef = useRef<string | null>(null);

    const buildInitialFormData = React.useCallback((): TransactionFormData => {
        const defaultOwnerMemberId = activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "";
        const defaultAccount = accounts[0];

        const draftType = initialDraft?.type === "pemasukan" ? "pemasukan" : initialType;
        const ownerMemberId = initialDraft?.owner_member_id ? String(initialDraft.owner_member_id) : defaultOwnerMemberId;
        const defaultAccountForOwner = accounts.find((account) => canUseForOwner(account, ownerMemberId)) ?? defaultAccount;
        const defaultPocketForOwner = findPocketForAccount(pockets, ownerMemberId, defaultAccountForOwner?.id ? String(defaultAccountForOwner.id) : null);
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
            bank_account_id: initialDraft?.bank_account_id
                ? String(initialDraft.bank_account_id)
                : (defaultPocketForOwner?.real_account_id ? String(defaultPocketForOwner.real_account_id) : (defaultAccountForOwner ? String(defaultAccountForOwner.id) : "")),
            pocket_id: initialDraft && "pocket_id" in initialDraft && initialDraft.pocket_id ? String(initialDraft.pocket_id) : (defaultPocketForOwner ? String(defaultPocketForOwner.id) : ""),
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
    }, [accounts, activeMemberId, categories, defaultCurrency, initialDraft, initialType, lockedGroupMeta, members, pockets]);

    const [showCalculator, setShowCalculator] = useState(false);
    const lastHandledPocketIdRef = useRef<string | null>(null);
    const [formData, setFormData] = useState<TransactionFormData>(buildInitialFormData);
    const [existingAttachments, setExistingAttachments] = useState<TransactionAttachment[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Array<string | number>>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null; mimeType?: string | null } | null>(null);

    useEffect(() => {
        if (!show) {
            initializedKeyRef.current = null;
            lastHandledPocketIdRef.current = null;
            return;
        }

        const initializationKey = transaction
            ? `edit:${transaction.id}:${transaction.row_version || 1}`
            : `create:${JSON.stringify({
                draft: initialDraft,
                activeMemberId,
                initialType,
                lock: lockedGroupMeta,
            })}`;

        if (initializedKeyRef.current === initializationKey) {
            return;
        }

        initializedKeyRef.current = initializationKey;

        if (transaction) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setExistingAttachments(Array.isArray(transaction.attachments) ? transaction.attachments : []);
            setRemovedAttachmentIds([]);
            setPendingFiles([]);
            setFormData({
                type: transaction.type === "pemasukan" ? "pemasukan" : "pengeluaran",
                owner_member_id: String(transaction.owner_member_id || activeMemberId || ""),
                transaction_date: transaction.transaction_date,
                amount: String(transaction.amount),
                currency_code: transaction.currency_code,
                category_id: normalizeStringId(transaction.category_id),
                bank_account_id: normalizeStringId(transaction.bank_account_id),
                pocket_id: normalizeStringId(transaction.pocket_id || findPocketForAccount(pockets, String(transaction.owner_member_id || activeMemberId || ""), normalizeStringId(transaction.bank_account_id))?.id),
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
            });
            return;
        }

        setExistingAttachments([]);
        setRemovedAttachmentIds([]);
        setPendingFiles([]);
        setFormData(buildInitialFormData());
    }, [show, transaction, activeMemberId, buildInitialFormData, initialDraft, initialType, lockedGroupMeta, pockets]);

    // Livedit: Force budget when pocket changes
    useEffect(() => {
        if (!show || !formData.pocket_id || isEdit) {
            return;
        }

        if (lastHandledPocketIdRef.current !== formData.pocket_id) {
            const currentPocketId = formData.pocket_id;
            lastHandledPocketIdRef.current = currentPocketId;

            const pocket = pockets.find((p) => String(p.id) === String(currentPocketId));
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
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setFormData((prev) => ({ ...prev, budget_id: String(walletDefault.id) }));
                }
            }
        }
    }, [formData.pocket_id, show, isEdit, pockets, budgets, formData.owner_member_id, formData.transaction_date, formData.type]);

    useEffect(() => {
        if (!show || isEdit || !lockedGroupMeta) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const visiblePockets = useMemo(() => pockets.filter((pocket) => canUseForOwner(pocket, formData.owner_member_id)), [formData.owner_member_id, pockets]);
    const selectedPocket = useMemo(
        () => pockets.find((pocket) => String(pocket.id) === String(formData.pocket_id)) ?? null,
        [formData.pocket_id, pockets],
    );
    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, formData.owner_member_id)), [budgets, formData.owner_member_id]);
    const filteredBudgets = useMemo(
        () => {
            if (!selectedPocket) {
                return visibleBudgets;
            }

            const lockedDefault = selectedPocket.default_budget_key
                ? visibleBudgets.find((budget) => String(budget.budget_key || budget.code || budget.id) === String(selectedPocket.default_budget_key))
                : null;
            const mapped = visibleBudgets.filter((budget) => budget.pocket_id && String(budget.pocket_id) === String(selectedPocket.id));
            const unallocated = visibleBudgets.filter((budget) => !budget.pocket_id);
            const remaining = visibleBudgets.filter((budget) => budget !== lockedDefault && !mapped.includes(budget) && !unallocated.includes(budget));

            return [lockedDefault, ...mapped, ...unallocated, ...remaining].filter(Boolean) as FinanceBudget[];
        },
        [selectedPocket, visibleBudgets],
    );

    const accountOptions = useMemo(() => visibleAccounts.map((account) => ({
        label: `${account.name} · ${account.currency_code}`,
        value: String(account.id),
    })), [visibleAccounts]);

    const budgetOptions = useMemo(() => filteredBudgets.map((budget) => ({
        label: `${budget.name} · ${budget.period_month}`,
        value: String(budget.id),
    })), [filteredBudgets]);

    const pocketOptions = useMemo(() => visiblePockets.map((pocket) => ({
        label: `${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`,
        value: String(pocket.id),
    })), [visiblePockets]);

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

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData((prev) => {
            const next = { ...prev };

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

            if (!next.owner_member_id && memberOptions[0]) {
                next.owner_member_id = memberOptions[0].value;
            }

            const syncedPocket = pockets.find((pocket) => String(pocket.id) === String(next.pocket_id));
            const validPocketsForOwner = pockets.filter((pocket) => canUseForOwner(pocket, next.owner_member_id));

            if (!syncedPocket || !canUseForOwner(syncedPocket, next.owner_member_id)) {
                next.pocket_id = validPocketsForOwner[0]?.id ? String(validPocketsForOwner[0].id) : "";
            }

            const resolvedPocket = pockets.find((pocket) => String(pocket.id) === String(next.pocket_id));
            next.bank_account_id = resolvedPocket?.real_account_id ? String(resolvedPocket.real_account_id) : "";

            const budgetCandidates = budgets.filter((budget) => canUseForOwner(budget, next.owner_member_id));
            const selectedBudgetCandidate = budgetCandidates.find((budget) => String(budget.id) === String(next.budget_id));
            const lockedBudgetPocket = selectedBudgetCandidate?.pocket_id
                ? pockets.find((pocket) => String(pocket.id) === String(selectedBudgetCandidate.pocket_id) && pocket.budget_lock_enabled)
                : null;

            if (next.type === "pengeluaran" && lockedBudgetPocket && canUseForOwner(lockedBudgetPocket, next.owner_member_id)) {
                next.pocket_id = String(lockedBudgetPocket.id);
                next.bank_account_id = String(lockedBudgetPocket.real_account_id);
            }

            const syncedResolvedPocket = pockets.find((pocket) => String(pocket.id) === String(next.pocket_id));
            const budgetStillValid = budgetCandidates.some((budget) => String(budget.id) === String(next.budget_id));
            const walletDefaultBudget = syncedResolvedPocket?.default_budget_key
                ? budgetCandidates.find((budget) =>
                    String(budget.budget_key || budget.code || budget.id) === String(syncedResolvedPocket.default_budget_key)
                    && String(budget.period_month) === toPeriodMonth(next.transaction_date)
                    && budget.is_active !== false
                )
                : null;

            if (next.type !== "pengeluaran") {
                next.budget_id = "";
            } else if (syncedResolvedPocket?.budget_lock_enabled && walletDefaultBudget) {
                next.budget_id = String(walletDefaultBudget.id);
            } else if (walletDefaultBudget && !next.budget_id) {
                next.budget_id = String(walletDefaultBudget.id);
            } else if (!budgetStillValid) {
                next.budget_id = walletDefaultBudget ? String(walletDefaultBudget.id) : "";
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
    }, [accounts, budgets, categories, categoryOptions, defaultCurrency, memberOptions, pockets, show]);

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
        pocketOptions,
        budgetOptions,
        categoryOptions,
        currencyOptions,
        paymentMethodOptions,
        selectedAccount: accounts.find((account) => String(account.id) === String(selectedPocket?.real_account_id || formData.bank_account_id)) ?? null,
        selectedPocket,
        selectedBudget,
        budgetLocked: Boolean(selectedPocket?.budget_lock_enabled && selectedPocket?.default_budget_key && formData.type === "pengeluaran"),
        budgetDelta,
        handleAttachmentPick,
        handleRemoveExistingAttachment,
        handleRemovePendingFile,
    };
};
