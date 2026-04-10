import { LockedGroupMeta, TransactionDraftPayload, TransactionFormData } from "../../components/transactionModalTypes";
import { FinanceAccount, FinanceCategory, FinanceMember, FinanceWallet } from "../../types";

import {
    canUseForOwner,
    findPocketForAccount,
    formatLocalDate,
    getCategoryOptionsForType,
    isCategoryCompatibleWithType,
} from "./helpers";

type BuildInitialFormDataArgs = {
    accounts: FinanceAccount[];
    activeMemberId?: number | null;
    categories: FinanceCategory[];
    defaultCurrency: string;
    initialDraft?: TransactionDraftPayload | null;
    initialType: "pemasukan" | "pengeluaran";
    lockedGroupMeta?: LockedGroupMeta;
    members: FinanceMember[];
    pockets: FinanceWallet[];
};

export const buildInitialFormData = ({
    accounts,
    activeMemberId,
    categories,
    defaultCurrency,
    initialDraft,
    initialType,
    lockedGroupMeta,
    members,
    pockets,
}: BuildInitialFormDataArgs): TransactionFormData => {
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
        wallet_id: initialDraft?.wallet_id
            ? String(initialDraft.wallet_id)
            : (
                initialDraft?.wallet_id
                    ? String(initialDraft.wallet_id)
                    : (defaultPocketForOwner ? String(defaultPocketForOwner.id) : "")
            ),
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
};
