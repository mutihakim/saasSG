import { useState } from "react";

import {
    FinanceAccount,
    FinanceBudget,
    FinanceWallet,
    FinanceSavingsGoal,
    FinanceWalletFormState,
    FinanceWish,
    FinanceWishConvertFormState,
} from "../types";

const useFinancePlanningState = (
    initialAccountId?: string | null,
    initialTab: "dashboard" | "accounts" | "budgets" | "wishes" | "goals" = "dashboard"
) => {
    const [activeTab, setActiveTab] = useState<"dashboard" | "accounts" | "budgets" | "wishes" | "goals">(initialTab);
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(initialAccountId ?? null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showGoalDetailSheet, setShowGoalDetailSheet] = useState(false);
    const [showGoalFundModal, setShowGoalFundModal] = useState(false);
    const [showGoalSpendModal, setShowGoalSpendModal] = useState(false);
    const [showWishModal, setShowWishModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showAccountDetailSheet, setShowAccountDetailSheet] = useState(false);
    const [showWalletDetailSheet, setShowWalletDetailSheet] = useState(false);
    const [showBudgetDetailSheet, setShowBudgetDetailSheet] = useState(false);
    const [showMonthlyReviewWizard, setShowMonthlyReviewWizard] = useState(false);
    const [transactionModal, setTransactionModal] = useState(false);
    const [transferModal, setTransferModal] = useState(false);
    const [transactionPresetType, setTransactionPresetType] = useState<"pemasukan" | "pengeluaran" | "transfer">("pengeluaran");
    const [transactionDraft, setTransactionDraft] = useState<any>(null);
    const [transactionDraftMeta, setTransactionDraftMeta] = useState<any>(null);
    const [seedAccount, setSeedAccount] = useState<FinanceAccount | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
    const [selectedWallet, setSelectedWallet] = useState<FinanceWallet | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<FinanceBudget | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<FinanceSavingsGoal | null>(null);
    const [selectedWish, setSelectedWish] = useState<FinanceWish | null>(null);
    const [savingWallet, setSavingWallet] = useState(false);
    const [savingGoal, setSavingGoal] = useState(false);
    const [fundingGoal, setFundingGoal] = useState(false);
    const [spendingGoal, setSpendingGoal] = useState(false);
    const [savingWish, setSavingWish] = useState(false);
    const [convertingWish, setConvertingWish] = useState(false);
    const [convertForm, setConvertForm] = useState<FinanceWishConvertFormState>({
        wallet_id: "",
        target_amount: "",
        target_date: "",
        notes: "",
    });

    const [walletForm, setWalletForm] = useState<FinanceWalletFormState>({
        name: "",
        type: "personal",
        purpose_type: "spending",
        scope: "private",
        real_account_id: "",
        owner_member_id: "",
        default_budget_id: "",
        default_budget_key: "",
        budget_lock_enabled: false,
        icon_key: "ri-wallet-3-line",
        notes: "",
        background_color: "#fef08a",
        row_version: 1,
        member_access: [],
    });

    return {
        activeTab,
        setActiveTab,
        searchOpen,
        setSearchOpen,
        search,
        setSearch,
        expandedAccountId,
        setExpandedAccountId,
        showAccountModal,
        setShowAccountModal,
        showWalletModal,
        setShowWalletModal,
        showBudgetModal,
        setShowBudgetModal,
        showGoalModal,
        setShowGoalModal,
        showGoalDetailSheet,
        setShowGoalDetailSheet,
        showGoalFundModal,
        setShowGoalFundModal,
        showGoalSpendModal,
        setShowGoalSpendModal,
        showWishModal,
        setShowWishModal,
        showConvertModal,
        setShowConvertModal,
        showAccountDetailSheet,
        setShowAccountDetailSheet,
        showWalletDetailSheet,
        setShowWalletDetailSheet,
        showBudgetDetailSheet,
        setShowBudgetDetailSheet,
        showMonthlyReviewWizard,
        setShowMonthlyReviewWizard,
        seedAccount,
        setSeedAccount,
        savingWallet,
        setSavingWallet,
        selectedAccount,
        setSelectedAccount,
        selectedWallet,
        setSelectedWallet,
        walletForm,
        setWalletForm,
        selectedBudget,
        setSelectedBudget,
        selectedGoal,
        setSelectedGoal,
        selectedWish,
        setSelectedWish,
        savingGoal,
        setSavingGoal,
        fundingGoal,
        setFundingGoal,
        spendingGoal,
        setSpendingGoal,
        savingWish,
        setSavingWish,
        convertingWish,
        setConvertingWish,
        convertForm,
        setConvertForm,
        transactionModal,
        setTransactionModal,
        transferModal,
        setTransferModal,
        transactionPresetType,
        setTransactionPresetType,
        transactionDraft,
        setTransactionDraft,
        transactionDraftMeta,
        setTransactionDraftMeta,
    };
};

export default useFinancePlanningState;
