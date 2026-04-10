import React from "react";

import { FinanceBudget, FinanceDeleteTarget } from "../types";

import BudgetModal from "./BudgetModal";

import DangerDeleteModal from "@/components/ui/DangerDeleteModal";
import DeleteModal from "@/components/ui/DeleteModal";


type Props = {
    deleteModal: boolean;
    isDeleting: boolean;
    deleteTargetType: "transaction" | "transaction_group" | "account" | "budget";
    deleteTarget: FinanceDeleteTarget | null;
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
    deleteTarget,
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
        {(() => {
            const deleteTargetName = String((deleteTarget as any)?.name || (deleteTarget as any)?.summary || "");
            const deleteTargetKey = String((deleteTarget as any)?.id || (deleteTarget as any)?.summary || "");

            return deleteTargetType === "account" ? (
            <DangerDeleteModal
                key={`finance-account-delete-${deleteTargetKey}`}
                show={deleteModal}
                onConfirm={handleDelete}
                onClose={() => setDeleteModal(false)}
                loading={isDeleting}
                title="Hapus akun ini?"
                entityLabel="Akun"
                entityName={deleteTargetName}
                message="Akun hanya bisa dihapus jika backend mengizinkan. Pastikan Anda benar-benar ingin menghapus struktur ini."
                warnings={[
                    "Wallet turunan, goal, dan struktur terkait bisa ikut terdampak secara operasional.",
                    "Jika akun sudah dipakai transaksi, backend akan menolak penghapusan ini.",
                    "Aksi ini tidak dapat dipulihkan dari UI biasa.",
                ]}
                confirmLabel="Ya, Hapus Akun"
            />
            ) : (
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
            );
        })()}

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
            canDelete={permissions.manageShared || String(selectedBudget?.owner_member_id || "") === String(activeMemberId || "")}
        />
    </>
);

export default FinanceStructureDialogs;
