import React from "react";

import { FinanceAccount, FinanceBudget, FinanceCurrency, FinanceMember, FinanceWallet } from "../types";
import { FinanceWalletFormState } from "../types";

import FinanceWalletFormWizard from "./FinanceWalletFormWizard";
import FinanceWalletDetailSheet from "./pwa/FinanceWalletDetailSheet";

type Props = {
    showWalletDetailSheet: boolean;
    selectedWallet: FinanceWallet | null;
    setShowWalletDetailSheet: (show: boolean) => void;
    openWalletModal: (wallet?: FinanceWallet | null, accountId?: string) => void;
    setSelectedWallet: (wallet: FinanceWallet | null) => void;
    setWalletForm: (form: FinanceWalletFormState) => void;
    handleDeleteWallet: (wallet: FinanceWallet) => void;
    permissions: { update: boolean; delete: boolean; manageShared: boolean };
    showWalletModal: boolean;
    setShowWalletModal: (show: boolean) => void;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    currencies: FinanceCurrency[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    handleSaveWallet: (values: FinanceWalletFormState) => Promise<void>;
    savingWallet: boolean;
    onAddMoney: () => void;
    onMoveMoney: () => void;
    onPaySend: () => void;
};

const FinanceEntityDialogs = ({
    showWalletDetailSheet,
    selectedWallet,
    setShowWalletDetailSheet,
    openWalletModal,
    setSelectedWallet,
    setWalletForm,
    handleDeleteWallet,
    permissions,
    showWalletModal,
    setShowWalletModal,
    accounts,
    budgets,
    currencies,
    members,
    activeMemberId,
    handleSaveWallet,
    savingWallet,
    onAddMoney,
    onMoveMoney,
    onPaySend,
}: Props) => {
    return (
        <>
            <FinanceWalletDetailSheet
                show={showWalletDetailSheet}
                wallet={selectedWallet}
                onClose={() => setShowWalletDetailSheet(false)}
                onEdit={() => {
                    if (!selectedWallet) return;
                    setShowWalletDetailSheet(false);
                    openWalletModal(selectedWallet);
                }}
                onDuplicate={() => {
                    if (!selectedWallet) return;
                    setShowWalletDetailSheet(false);
                    setSelectedWallet(null);
                    setWalletForm({
                        name: `${selectedWallet.name} Copy`,
                        type: selectedWallet.type === "main" ? "personal" : (selectedWallet.type || "personal"),
                        purpose_type: selectedWallet.purpose_type || "spending",
                        scope: selectedWallet.scope || "private",
                        real_account_id: selectedWallet.real_account_id || selectedWallet.real_account?.id || "",
                        owner_member_id: selectedWallet.owner_member_id ? String(selectedWallet.owner_member_id) : "",
                        default_budget_id: selectedWallet.default_budget_id ? String(selectedWallet.default_budget_id) : "",
                        default_budget_key: selectedWallet.default_budget_key ? String(selectedWallet.default_budget_key) : "",
                        budget_lock_enabled: Boolean(selectedWallet.budget_lock_enabled),
                        icon_key: selectedWallet.icon_key || "ri-wallet-3-line",
                        notes: selectedWallet.notes || "",
                        background_color: selectedWallet.background_color || "#fef08a",
                        row_version: 1,
                        member_access: (selectedWallet.member_access || (selectedWallet as any).memberAccess || []).map((m: any) => ({
                            id: String(m.id),
                            can_view: Boolean(m.pivot?.can_view),
                            can_use: Boolean(m.pivot?.can_use),
                            can_manage: Boolean(m.pivot?.can_manage),
                        })),
                    });
                    setShowWalletModal(true);
                }}
                onDelete={() => {
                    if (!selectedWallet) return;
                    setShowWalletDetailSheet(false);
                    handleDeleteWallet(selectedWallet);
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete && Boolean(selectedWallet) && !selectedWallet?.is_system}
                onAddMoney={onAddMoney}
                onMoveMoney={onMoveMoney}
                onPaySend={onPaySend}
            />

            <FinanceWalletFormWizard
                key={`${showWalletModal ? "open" : "closed"}-${selectedWallet?.id || "new"}`}
                show={showWalletModal}
                onHide={() => setShowWalletModal(false)}
                onSave={async (values) => {
                    setWalletForm(values);
                    await handleSaveWallet(values);
                }}
                saving={savingWallet}
                wallet={selectedWallet}
                accounts={accounts}
                budgets={budgets}
                members={members}
                currencies={currencies}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
            />
        </>
    );
};

export default FinanceEntityDialogs;
