import React from "react";

import DeleteModal from "../../../../Components/Common/DeleteModal";

import { FinanceBudget, FinanceDeleteTarget } from "../types";
import BudgetModal from "./BudgetModal";

type Props = {
    deleteModal: boolean;
    isDeleting: boolean;
    deleteTargetType: "transaction" | "transaction_group" | "account" | "budget";
    handleDelete: () => void;
    setDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    members: React.ComponentProps<typeof BudgetModal>["members"];
    pockets: React.ComponentProps<typeof BudgetModal>["pockets"];
    activeMemberId?: number | null;
    permissions: { manageShared: boolean };
    setDeleteTarget: React.Dispatch<React.SetStateAction<FinanceDeleteTarget | null>>;
    setDeleteTargetType: React.Dispatch<React.SetStateAction<"transaction" | "transaction_group" | "account" | "budget">>;
    setDeleteModalState: React.Dispatch<React.SetStateAction<boolean>>;
    budgetModal: boolean;
    closeBudgetModal: () => void;
    selectedBudget: FinanceBudget | null;
    upsertBudgetInList: (budget?: FinanceBudget | null) => void;
};

const FinanceStructureDialogs = ({
    deleteModal,
    isDeleting,
    deleteTargetType,
    handleDelete,
    setDeleteModal,
    members,
    pockets,
    activeMemberId,
    permissions,
    setDeleteTarget,
    setDeleteTargetType,
    setDeleteModalState,
    budgetModal,
    closeBudgetModal,
    selectedBudget,
    upsertBudgetInList,
}: Props) => (
    <>
        <DeleteModal
            show={deleteModal}
            onDeleteClick={handleDelete}
            onCloseClick={() => setDeleteModal(false)}
            loading={isDeleting}
            title={deleteTargetType === "transaction_group" ? "Hapus seluruh grup?" : "Are you sure?"}
            message={deleteTargetType === "transaction_group"
                ? "Apakah Anda yakin ingin menghapus seluruh grup ini beserta transaksi, lampiran, tag, dan log terkait? Tindakan ini tidak dapat dibatalkan."
                : "Are you sure you want to delete this record? This action cannot be undone."}
            confirmLabel={deleteTargetType === "transaction_group" ? "Ya, Hapus Grup" : "Yes, Delete It!"}
        />

        <BudgetModal
            show={budgetModal}
            onClose={closeBudgetModal}
            onSuccess={(budget) => {
                upsertBudgetInList(budget);
            }}
            onDelete={() => {
                if (!selectedBudget) {
                    return;
                }
                setDeleteTarget(selectedBudget as FinanceDeleteTarget);
                setDeleteTargetType("budget");
                setDeleteModalState(true);
            }}
            budget={selectedBudget}
            members={members}
            pockets={pockets}
            activeMemberId={activeMemberId}
            canManageShared={permissions.manageShared}
            canDelete={permissions.manageShared || (selectedBudget?.scope === "private" && String(selectedBudget?.owner_member_id || "") === String(activeMemberId || ""))}
        />
    </>
);

export default FinanceStructureDialogs;
