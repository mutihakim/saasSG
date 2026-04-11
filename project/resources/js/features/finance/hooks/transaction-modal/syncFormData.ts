import { TransactionFormData } from "../../components/transactionModalTypes";
import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceTransaction, FinanceWallet } from "../../types";

import { canUseForOwner, getCategoryOptionsForType, isCategoryCompatibleWithType, toPeriodMonth } from "./helpers";

type Option = {
    value: string;
    label: string;
};

type SyncTransactionFormDataArgs = {
    formData: TransactionFormData;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    categories: FinanceCategory[];
    defaultCurrency: string;
    isEdit: boolean;
    memberOptions: Option[];
    pockets: FinanceWallet[];
    transaction?: FinanceTransaction;
};

export const syncTransactionFormData = ({
    formData,
    accounts,
    budgets,
    categories,
    defaultCurrency,
    isEdit,
    memberOptions,
    pockets,
    transaction,
}: SyncTransactionFormDataArgs): TransactionFormData => {
    const next = { ...formData };
    const categoryOptions = getCategoryOptionsForType(categories, next.type);

    const categoryStillValid = categoryOptions.some((option) => String(option.id) === next.category_id);
    if (!categoryStillValid) {
        const requestedCategory = next.category_id
            ? categories.find((category) => String(category.id) === String(next.category_id))
            : null;
        const shouldPreserveRequestedCategory = isCategoryCompatibleWithType(requestedCategory, next.type);

        if (!shouldPreserveRequestedCategory) {
            next.category_id = categoryOptions[0]?.id ? String(categoryOptions[0].id) : "";
        }
    }

    if (!next.owner_member_id && memberOptions[0]) {
        next.owner_member_id = memberOptions[0].value;
    }

    const syncedPocket = pockets.find((pocket) => String(pocket.id) === String(next.wallet_id));
    const validPocketsForOwner = pockets.filter((pocket) => canUseForOwner(pocket, next.owner_member_id));

    if (!syncedPocket || !canUseForOwner(syncedPocket, next.owner_member_id)) {
        next.wallet_id = validPocketsForOwner[0]?.id ? String(validPocketsForOwner[0].id) : "";
    }

    const resolvedPocket = pockets.find((pocket) => String(pocket.id) === String(next.wallet_id));
    next.bank_account_id = resolvedPocket?.real_account_id ? String(resolvedPocket.real_account_id) : "";

    const budgetCandidates = budgets.filter((budget) => canUseForOwner(budget, next.owner_member_id));
    const monthBudgetCandidates = budgetCandidates.filter((budget) => String(budget.period_month) === toPeriodMonth(next.transaction_date) && budget.is_active !== false);
    const selectedBudgetCandidate = budgetCandidates.find((budget) => String(budget.id) === String(next.budget_id));
    const lockedBudgetPocket = selectedBudgetCandidate?.wallet_id
        ? pockets.find((pocket) => String(pocket.id) === String(selectedBudgetCandidate.wallet_id) && pocket.budget_lock_enabled)
        : null;

    if (next.type === "pengeluaran" && lockedBudgetPocket && canUseForOwner(lockedBudgetPocket, next.owner_member_id)) {
        next.wallet_id = String(lockedBudgetPocket.id);
        next.bank_account_id = String(lockedBudgetPocket.real_account_id);
    }

    const syncedResolvedPocket = pockets.find((pocket) => String(pocket.id) === String(next.wallet_id));
    const selectedBudgetStillValidForMonth = monthBudgetCandidates.some((budget) => String(budget.id) === String(next.budget_id));
    const preserveExistingEditBudget = Boolean(
        isEdit
        && transaction
        && selectedBudgetCandidate
        && String(transaction.budget_id || "") === String(next.budget_id),
    );
    const walletDefaultBudget = syncedResolvedPocket?.default_budget_key
        ? monthBudgetCandidates.find((budget) =>
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
    } else if (!selectedBudgetStillValidForMonth && !preserveExistingEditBudget) {
        next.budget_id = walletDefaultBudget ? String(walletDefaultBudget.id) : "";
    }

    const syncedAccount = accounts.find((account) => String(account.id) === String(next.bank_account_id));
    if (syncedAccount?.currency_code) {
        next.currency_code = syncedAccount.currency_code;
        if (syncedAccount.currency_code === defaultCurrency) {
            next.exchange_rate = "1.0";
        }
    }

    return next;
};
