import { TransactionFormData } from "../../components/transactionModalTypes";
import { FinanceAccount, FinanceBudget, FinanceWallet, FinanceTransaction } from "../../types";

import { isLiabilityType, transactionDelta } from "./helpers";

type Args = {
    formData: TransactionFormData;
    transaction?: FinanceTransaction;
    _accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    _pockets: FinanceWallet[];
    selectedPocket: FinanceWallet | null;
    selectedAccount: FinanceAccount | null;
    monthScopedBudgets: FinanceBudget[];
};

export const useTransactionDerivedMetrics = ({
    formData,
    transaction,
    _accounts,
    budgets,
    _pockets,
    selectedPocket,
    selectedAccount,
    monthScopedBudgets,
}: Args) => {
    const selectedBudget = budgets.find((budget) => String(budget.id) === String(formData.budget_id));

    const walletDefaultBudgetForMonth = selectedPocket?.default_budget_key
        ? monthScopedBudgets.find((budget) => String(budget.budget_key || budget.code || budget.id) === String(selectedPocket.default_budget_key))
        : null;

    const budgetLockMissingForMonth = Boolean(
        formData.type === "pengeluaran"
        && selectedPocket?.budget_lock_enabled
        && !walletDefaultBudgetForMonth,
    );

    const budgetDelta = selectedBudget
        ? Number(selectedBudget.remaining_amount || 0) - (Number(formData.amount || 0) * Number(formData.exchange_rate || 1))
        : 0;

    const parsedAmount = Number(formData.amount || 0);
    const currentPocketBalance = Number(selectedPocket?.current_balance || 0);
    const originalPocketId = transaction?.wallet_id
        ? String(transaction.wallet_id)
        : (transaction?.wallet_id ? String(transaction.wallet_id) : "");
    
    const originalTransactionAmount = Number(transaction?.amount || 0);
    const originalTransactionDelta = transaction?.type === "pemasukan"
        ? originalTransactionAmount
        : transaction?.type === "pengeluaran"
            ? -originalTransactionAmount
            : 0;

    const newTransactionDelta = transactionDelta(formData.type, parsedAmount);
    
    const projectedPocketBalance = selectedPocket
        ? (
            String(selectedPocket.id) === originalPocketId
                ? currentPocketBalance - originalTransactionDelta + newTransactionDelta
                : currentPocketBalance + newTransactionDelta
        )
        : 0;

    const insufficientPocketBalance = Boolean(
        formData.type === "pengeluaran"
        && selectedPocket
        && selectedAccount
        && !isLiabilityType(selectedAccount.type)
        && parsedAmount > 0
        && projectedPocketBalance < 0,
    );

    return {
        selectedBudget,
        selectedAccount,
        budgetLocked: Boolean(selectedPocket?.budget_lock_enabled && walletDefaultBudgetForMonth && formData.type === "pengeluaran"),
        budgetLockMissingForMonth,
        budgetDelta,
        insufficientPocketBalance,
        projectedPocketBalance,
    };
};
