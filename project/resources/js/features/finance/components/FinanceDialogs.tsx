import React from "react";

import { useFinanceDialogCloseHandlers } from "../hooks/useFinanceDialogCloseHandlers";
import { FinanceAccount, FinanceBatchDraft, FinanceBudget, FinanceCategory, FinanceCurrency, FinanceDeleteTarget, FinanceFilterDraft, FinanceMember, FinancePaymentMethodOption, FinanceWallet, FinanceTransaction } from "../types";

import FinanceFilterDialog from "./FinanceFilterDialog";
import FinanceStructureDialogs from "./FinanceStructureDialogs";
import FinanceTransactionDialogs from "./FinanceTransactionDialogs";
import { LockedGroupMeta, TransactionDraftMeta, TransactionDraftPayload } from "./transactionModalTypes";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type FinanceDialogsProps = {
    deleteModal: boolean;
    isDeleting: boolean;
    deleteTargetType: "transaction" | "transaction_group" | "account" | "budget";
    deleteTarget: FinanceDeleteTarget | null;
    handleDelete: () => void;
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    showDetailSheet: boolean;
    selectedTransaction: FinanceTransaction | null;
    defaultCurrency: string;
    closeDetailSheet: () => void;
    editFromDetailSheet: () => void;
    openCreateFromGroupedTransaction: (transaction: FinanceTransaction | null, options?: { duplicate?: boolean }) => void;
    permissions: {
        update: boolean;
        delete: boolean;
        manageShared: boolean;
    };
    setDeleteTarget: React.Dispatch<React.SetStateAction<FinanceDeleteTarget | null>>;
    setDeleteTargetType: React.Dispatch<React.SetStateAction<"transaction" | "transaction_group" | "account" | "budget">>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setShowDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    transactionModal: boolean;
    setTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
    setTransactionDraft: React.Dispatch<React.SetStateAction<TransactionDraftPayload | null>>;
    setTransactionDraftMeta: React.Dispatch<React.SetStateAction<TransactionDraftMeta>>;
    setTransactionGroupLock: React.Dispatch<React.SetStateAction<LockedGroupMeta>>;
    clearWhatsappQuery: () => void;
    transactionDraft: TransactionDraftPayload | null;
    transactionDraftMeta: TransactionDraftMeta;
    transactionGroupLock: LockedGroupMeta;
    categories: FinanceCategory[];
    currencies: FinanceCurrency[];
    paymentMethods: FinancePaymentMethodOption[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    pockets: FinanceWallet[];
    transferDestinationPockets: FinanceWallet[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    walletSubscribed: boolean;
    transactionPresetType: "pemasukan" | "pengeluaran";
    upsertTransactionInList: (transaction?: FinanceTransaction | null) => void;
    refreshFinanceSideData: () => Promise<unknown>;
    tenantRoute: TenantRouteLike;
    batchEntryModal: boolean;
    setBatchEntryModal: React.Dispatch<React.SetStateAction<boolean>>;
    batchModal: boolean;
    setBatchModal: React.Dispatch<React.SetStateAction<boolean>>;
    batchDraft: FinanceBatchDraft | null;
    setBatchDraft: React.Dispatch<React.SetStateAction<FinanceBatchDraft | null>>;
    transferModal: boolean;
    setTransferModal: React.Dispatch<React.SetStateAction<boolean>>;
    budgetModal: boolean;
    setBudgetModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedBudget: FinanceBudget | null;
    setSelectedBudget: React.Dispatch<React.SetStateAction<FinanceBudget | null>>;
    upsertBudgetInList: (budget?: FinanceBudget | null) => void;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    draftFilters: FinanceFilterDraft;
    setDraftFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    setFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    categoriesForFilters: FinanceCategory[];
};

const FinanceDialogs = ({
    deleteModal,
    isDeleting,
    deleteTargetType,
    deleteTarget,
    handleDelete,
    setDeleteModal,
    showDetailSheet,
    selectedTransaction,
    defaultCurrency,
    closeDetailSheet,
    editFromDetailSheet,
    openCreateFromGroupedTransaction,
    permissions,
    setDeleteTarget,
    setDeleteTargetType,
    setSelectedTransaction,
    setShowDetailSheet,
    transactionModal,
    setTransactionModal,
    setTransactionDraft,
    setTransactionDraftMeta,
    setTransactionGroupLock,
    clearWhatsappQuery,
    transactionDraft,
    transactionDraftMeta,
    transactionGroupLock,
    categories,
    currencies,
    paymentMethods,
    accounts,
    budgets,
    pockets,
    transferDestinationPockets,
    members,
    activeMemberId,
    walletSubscribed,
    transactionPresetType,
    upsertTransactionInList,
    refreshFinanceSideData,
    tenantRoute,
    batchEntryModal,
    setBatchEntryModal,
    batchModal,
    setBatchModal,
    batchDraft,
    setBatchDraft,
    transferModal,
    setTransferModal,
    budgetModal,
    setBudgetModal,
    selectedBudget,
    setSelectedBudget,
    upsertBudgetInList,
    showFilters,
    setShowFilters,
    draftFilters,
    setDraftFilters,
    setFilters,
    categoriesForFilters,
}: FinanceDialogsProps) => {
    const {
        closeTransactionModal,
        closeBatchReviewModal,
        closeBudgetModal,
    } = useFinanceDialogCloseHandlers({
        clearWhatsappQuery,
        showDetailSheet,
        setTransactionModal,
        setTransactionDraft,
        setTransactionDraftMeta,
        setTransactionGroupLock,
        setSelectedTransaction,
        setBatchModal,
        setBatchDraft,
        setBudgetModal,
        setSelectedBudget,
    });

    return (
        <>
            <FinanceTransactionDialogs
                showDetailSheet={showDetailSheet}
                selectedTransaction={selectedTransaction}
                defaultCurrency={defaultCurrency}
                closeDetailSheet={closeDetailSheet}
                editFromDetailSheet={editFromDetailSheet}
                openCreateFromGroupedTransaction={openCreateFromGroupedTransaction}
                permissions={permissions}
                setDeleteTarget={setDeleteTarget}
                setDeleteTargetType={setDeleteTargetType}
                setDeleteModal={setDeleteModal}
                transactionModal={transactionModal}
                closeTransactionModal={closeTransactionModal}
                setShowDetailSheet={setShowDetailSheet}
                clearWhatsappQuery={clearWhatsappQuery}
                transactionDraft={transactionDraft}
                transactionDraftMeta={transactionDraftMeta}
                transactionGroupLock={transactionGroupLock}
                categories={categories}
                currencies={currencies}
                paymentMethods={paymentMethods}
                accounts={accounts}
                budgets={budgets}
                pockets={pockets}
                transferDestinationPockets={transferDestinationPockets}
                members={members}
                activeMemberId={activeMemberId}
                walletSubscribed={walletSubscribed}
                transactionPresetType={transactionPresetType}
                upsertTransactionInList={upsertTransactionInList}
                refreshFinanceSideData={refreshFinanceSideData}
                tenantRoute={tenantRoute}
                batchEntryModal={batchEntryModal}
                setBatchEntryModal={setBatchEntryModal}
                batchModal={batchModal}
                closeBatchReviewModal={closeBatchReviewModal}
                batchDraft={batchDraft}
                transferModal={transferModal}
                setTransferModal={setTransferModal}
            />

            <FinanceStructureDialogs
                deleteModal={deleteModal}
                isDeleting={isDeleting}
                deleteTargetType={deleteTargetType}
                deleteTarget={deleteTarget}
                handleDelete={handleDelete}
                setDeleteModal={setDeleteModal}
                members={members}
                pockets={pockets}
                activeMemberId={activeMemberId}
                permissions={{ manageShared: permissions.manageShared }}
                setDeleteTarget={setDeleteTarget}
                setDeleteTargetType={setDeleteTargetType}
                setDeleteModalState={setDeleteModal}
                budgetModal={budgetModal}
                closeBudgetModal={closeBudgetModal}
                selectedBudget={selectedBudget}
                upsertBudgetInList={upsertBudgetInList}
            />

            <FinanceFilterDialog
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                setFilters={setFilters}
                members={members}
                accounts={accounts}
                categories={categoriesForFilters}
                permissions={{
                    ...permissions,
                    create: false,
                    managePrivateStructures: false,
                }}
            />
        </>
    );
};

export default FinanceDialogs;
