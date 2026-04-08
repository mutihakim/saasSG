import { useState } from "react";

import { FinanceAccount, FinancePocket, FinanceSavingsGoal } from "../../Finance/types";
import { ConvertWishFormState, WalletWish } from "../types";

const useWalletPageState = (initialAccountId?: string | null) => {
    const [activeTab, setActiveTab] = useState<"dashboard" | "accounts" | "wishes" | "goals">("dashboard");
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(initialAccountId ?? null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showGoalDetailSheet, setShowGoalDetailSheet] = useState(false);
    const [showGoalFundModal, setShowGoalFundModal] = useState(false);
    const [showGoalSpendModal, setShowGoalSpendModal] = useState(false);
    const [showWishModal, setShowWishModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [showAccountDetailSheet, setShowAccountDetailSheet] = useState(false);
    const [showWalletDetailSheet, setShowWalletDetailSheet] = useState(false);
    const [showMonthlyReviewWizard, setShowMonthlyReviewWizard] = useState(false);
    const [transactionModal, setTransactionModal] = useState(false);
    const [transactionPresetType, setTransactionPresetType] = useState<"pemasukan" | "pengeluaran" | "transfer">("pengeluaran");
    const [transactionDraft, setTransactionDraft] = useState<any>(null);
    const [transactionDraftMeta, setTransactionDraftMeta] = useState<any>(null);
    const [seedAccount, setSeedAccount] = useState<FinanceAccount | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
    const [selectedWallet, setSelectedWallet] = useState<FinancePocket | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<FinanceSavingsGoal | null>(null);
    const [selectedWish, setSelectedWish] = useState<WalletWish | null>(null);
    const [savingWallet, setSavingWallet] = useState(false);
    const [savingGoal, setSavingGoal] = useState(false);
    const [fundingGoal, setFundingGoal] = useState(false);
    const [spendingGoal, setSpendingGoal] = useState(false);
    const [savingWish, setSavingWish] = useState(false);
    const [convertingWish, setConvertingWish] = useState(false);
    const [convertForm, setConvertForm] = useState<ConvertWishFormState>({
        wallet_id: "",
        target_amount: "",
        target_date: "",
        notes: "",
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
        showMonthlyReviewWizard,
        setShowMonthlyReviewWizard,
        seedAccount,
        setSeedAccount,
        selectedAccount,
        setSelectedAccount,
        selectedWallet,
        setSelectedWallet,
        selectedGoal,
        setSelectedGoal,
        selectedWish,
        setSelectedWish,
        savingWallet,
        setSavingWallet,
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
        transactionPresetType,
        setTransactionPresetType,
        transactionDraft,
        setTransactionDraft,
        transactionDraftMeta,
        setTransactionDraftMeta,
    };
};

export default useWalletPageState;
