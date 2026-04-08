import { useRef, useState } from "react";

import { LockedGroupMeta, TransactionDraftMeta, TransactionDraftPayload } from "../components/transactionModalTypes";
import { MainTab, MoreView } from "../components/pwa/types";
import { FinanceAccount, FinanceBatchDraft, FinanceBudget, FinanceDeleteTarget, FinanceTransaction } from "../types";

export const useFinancePageState = () => {
    const [activeTab, setActiveTab] = useState<MainTab>("transactions");
    const [moreView, setMoreView] = useState<MoreView>("menu");
    const [showComposer, setShowComposer] = useState(false);
    const [transactionModal, setTransactionModal] = useState(false);
    const [transferModal, setTransferModal] = useState(false);
    const [batchEntryModal, setBatchEntryModal] = useState(false);
    const [accountModal, setAccountModal] = useState(false);
    const [budgetModal, setBudgetModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
    const [focusedTransactionId, setFocusedTransactionId] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<FinanceBudget | null>(null);
    const [showDetailSheet, setShowDetailSheet] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FinanceDeleteTarget | null>(null);
    const [deleteTargetType, setDeleteTargetType] = useState<"transaction" | "transaction_group" | "account" | "budget">("transaction");
    const [isDeleting, setIsDeleting] = useState(false);
    const [transactionPresetType, setTransactionPresetType] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
    const [transactionDraft, setTransactionDraft] = useState<TransactionDraftPayload | null>(null);
    const [transactionGroupLock, setTransactionGroupLock] = useState<LockedGroupMeta>(null);
    const [transactionDraftMeta, setTransactionDraftMeta] = useState<TransactionDraftMeta>(null);
    const [batchDraft, setBatchDraft] = useState<FinanceBatchDraft | null>(null);
    const [batchModal, setBatchModal] = useState(false);
    const [statsMetric, setStatsMetric] = useState<"expense" | "income">("expense");
    const [showFilters, setShowFilters] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    return {
        activeTab,
        setActiveTab,
        moreView,
        setMoreView,
        showComposer,
        setShowComposer,
        transactionModal,
        setTransactionModal,
        transferModal,
        setTransferModal,
        batchEntryModal,
        setBatchEntryModal,
        accountModal,
        setAccountModal,
        budgetModal,
        setBudgetModal,
        selectedTransaction,
        setSelectedTransaction,
        focusedTransactionId,
        setFocusedTransactionId,
        selectedAccount,
        setSelectedAccount,
        selectedBudget,
        setSelectedBudget,
        showDetailSheet,
        setShowDetailSheet,
        deleteModal,
        setDeleteModal,
        deleteTarget,
        setDeleteTarget,
        deleteTargetType,
        setDeleteTargetType,
        isDeleting,
        setIsDeleting,
        transactionPresetType,
        setTransactionPresetType,
        transactionDraft,
        setTransactionDraft,
        transactionGroupLock,
        setTransactionGroupLock,
        transactionDraftMeta,
        setTransactionDraftMeta,
        batchDraft,
        setBatchDraft,
        batchModal,
        setBatchModal,
        statsMetric,
        setStatsMetric,
        showFilters,
        setShowFilters,
        searchOpen,
        setSearchOpen,
        loadMoreRef,
    };
};
