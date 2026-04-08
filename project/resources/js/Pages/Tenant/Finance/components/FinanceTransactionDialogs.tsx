import React from "react";

import { useFinanceWhatsappSubmission } from "../hooks/useFinanceWhatsappSubmission";
import { FinanceBatchDraft, FinanceDeleteTarget, FinanceTransaction } from "../types";

import TransactionBatchModal from "./TransactionBatchModal";
import TransactionModal from "./TransactionModal";
import TransferModal from "./TransferModal";
import TransactionDetailSheet from "./pwa/TransactionDetailSheet";
import { LockedGroupMeta, TransactionDraftMeta, TransactionDraftPayload } from "./transactionModalTypes";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Props = {
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
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    transactionModal: boolean;
    closeTransactionModal: () => void;
    setShowDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    clearWhatsappQuery: () => void;
    transactionDraft: TransactionDraftPayload | null;
    transactionDraftMeta: TransactionDraftMeta;
    transactionGroupLock: LockedGroupMeta;
    categories: React.ComponentProps<typeof TransactionModal>["categories"];
    currencies: React.ComponentProps<typeof TransactionModal>["currencies"];
    paymentMethods: React.ComponentProps<typeof TransactionModal>["paymentMethods"];
    accounts: React.ComponentProps<typeof TransactionModal>["accounts"];
    budgets: React.ComponentProps<typeof TransactionModal>["budgets"];
    pockets: React.ComponentProps<typeof TransactionModal>["pockets"];
    transferDestinationPockets: React.ComponentProps<typeof TransferModal>["destinationPockets"];
    members: React.ComponentProps<typeof TransactionModal>["members"];
    activeMemberId?: number | null;
    walletSubscribed: boolean;
    transactionPresetType: "pemasukan" | "pengeluaran";
    upsertTransactionInList: (transaction?: FinanceTransaction | null) => void;
    refreshFinanceSideData: () => Promise<unknown>;
    tenantRoute: TenantRouteLike;
    batchEntryModal: boolean;
    setBatchEntryModal: React.Dispatch<React.SetStateAction<boolean>>;
    batchModal: boolean;
    closeBatchReviewModal: () => void;
    batchDraft: FinanceBatchDraft | null;
    transferModal: boolean;
    setTransferModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const FinanceTransactionDialogs = ({
    showDetailSheet,
    selectedTransaction,
    defaultCurrency,
    closeDetailSheet,
    editFromDetailSheet,
    openCreateFromGroupedTransaction,
    permissions,
    setDeleteTarget,
    setDeleteTargetType,
    setDeleteModal,
    transactionModal,
    closeTransactionModal,
    setShowDetailSheet,
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
    closeBatchReviewModal,
    batchDraft,
    transferModal,
    setTransferModal,
}: Props) => {
    const { submitWhatsappSingleTransaction, submitWhatsappBatchTransactions } = useFinanceWhatsappSubmission({ tenantRoute });

    return (
        <>
            <TransactionDetailSheet
                show={showDetailSheet}
                transaction={selectedTransaction}
                defaultCurrency={defaultCurrency}
                onClose={closeDetailSheet}
                onEdit={editFromDetailSheet}
                onDuplicate={() => {
                    if (!selectedTransaction) {
                        return;
                    }

                    openCreateFromGroupedTransaction(selectedTransaction, { duplicate: true });
                }}
                onAddToGroup={() => {
                    if (!selectedTransaction || selectedTransaction.source_type !== "finance_bulk" || !selectedTransaction.source_id) {
                        return;
                    }

                    openCreateFromGroupedTransaction(selectedTransaction);
                }}
                onDelete={() => {
                    if (!selectedTransaction) {
                        return;
                    }
                    setDeleteTarget(selectedTransaction as FinanceDeleteTarget);
                    setDeleteTargetType("transaction");
                    setDeleteModal(true);
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete}
            />

            <TransactionModal
                show={transactionModal}
                onClose={closeTransactionModal}
                onSuccess={async (transaction) => {
                    const finalTransaction = await submitWhatsappSingleTransaction(transaction);
                    upsertTransactionInList(finalTransaction);
                    setShowDetailSheet(false);
                    clearWhatsappQuery();
                    await refreshFinanceSideData();
                }}
                transaction={selectedTransaction ?? undefined}
                initialDraft={selectedTransaction ? null : transactionDraft}
                draftMeta={transactionDraftMeta}
                lockedGroupMeta={transactionGroupLock}
                categories={categories}
                currencies={currencies}
                defaultCurrency={defaultCurrency}
                paymentMethods={paymentMethods}
                accounts={accounts}
                budgets={budgets}
                pockets={pockets}
                members={members}
                activeMemberId={activeMemberId}
                walletSubscribed={walletSubscribed}
                canManageShared={permissions.manageShared}
                initialType={transactionPresetType}
            />

            <TransactionBatchModal
                show={batchEntryModal}
                onClose={() => setBatchEntryModal(false)}
                onSuccess={async (createdTransactions) => {
                    createdTransactions.forEach((transaction) => upsertTransactionInList(transaction));
                    await refreshFinanceSideData();
                }}
                categories={categories}
                accounts={accounts}
                budgets={budgets}
                pockets={pockets}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                defaultCurrency={defaultCurrency}
            />

            <TransactionBatchModal
                show={batchModal}
                onClose={closeBatchReviewModal}
                onSuccess={async (createdTransactions) => {
                    const finalTransactions = await submitWhatsappBatchTransactions(createdTransactions);
                    finalTransactions.forEach((transaction: FinanceTransaction) => upsertTransactionInList(transaction));
                    clearWhatsappQuery();
                    await refreshFinanceSideData();
                }}
                draft={batchDraft}
                categories={categories}
                accounts={accounts}
                budgets={budgets}
                pockets={pockets}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                defaultCurrency={defaultCurrency}
            />

            <TransferModal
                show={transferModal}
                onClose={() => setTransferModal(false)}
                onSuccess={async (payload) => {
                    if (payload?.transaction) {
                        upsertTransactionInList(payload.transaction);
                    }
                    await refreshFinanceSideData();
                }}
                accounts={accounts}
                pockets={pockets}
                destinationPockets={transferDestinationPockets}
                members={members}
                activeMemberId={activeMemberId}
            />
        </>
    );
};

export default FinanceTransactionDialogs;
