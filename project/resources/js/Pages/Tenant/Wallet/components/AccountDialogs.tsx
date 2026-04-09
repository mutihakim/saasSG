import React from "react";

import { AccountFormWizard } from "../../Finance/components/AccountFormWizard";
import { FinanceAccount, FinanceCurrency, FinanceMember } from "../../Finance/types";

import WalletAccountDetailSheet from "./pwa/WalletAccountDetailSheet";

type Props = {
    showAccountDetailSheet: boolean;
    selectedAccount: FinanceAccount | null;
    setShowAccountDetailSheet: (show: boolean) => void;
    openAccountModal: (account?: FinanceAccount | null, duplicateFrom?: FinanceAccount | null) => void;
    handleDeleteAccount: () => void;
    permissions: { update: boolean; delete: boolean; manageShared: boolean };
    showAccountModal: boolean;
    setShowAccountModal: (show: boolean) => void;
    seedAccount: FinanceAccount | null;
    setSeedAccount: (account: FinanceAccount | null) => void;
    syncAccounts: () => Promise<void>;
    currencies: FinanceCurrency[];
    members: FinanceMember[];
    activeMemberId?: number | null;
};

const AccountDialogs = ({
    showAccountDetailSheet,
    selectedAccount,
    setShowAccountDetailSheet,
    openAccountModal,
    handleDeleteAccount,
    permissions,
    showAccountModal,
    setShowAccountModal,
    seedAccount,
    setSeedAccount,
    syncAccounts,
    currencies,
    members,
    activeMemberId,
}: Props) => {
    return (
        <>
            <WalletAccountDetailSheet
                show={showAccountDetailSheet}
                account={selectedAccount}
                onClose={() => setShowAccountDetailSheet(false)}
                onEdit={() => {
                    setShowAccountDetailSheet(false);
                    openAccountModal(selectedAccount);
                }}
                onDuplicate={() => {
                    if (!selectedAccount) return;
                    setShowAccountDetailSheet(false);
                    openAccountModal(null, {
                        ...selectedAccount,
                        name: `${selectedAccount.name} Copy`,
                    });
                }}
                onDelete={() => {
                    setShowAccountDetailSheet(false);
                    handleDeleteAccount();
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete && Boolean(selectedAccount)}
            />

            <AccountFormWizard
                show={showAccountModal}
                onClose={() => {
                    setShowAccountModal(false);
                    setSeedAccount(null);
                }}
                onSuccess={async () => {
                    setSeedAccount(null);
                    await syncAccounts();
                }}
                onDelete={handleDeleteAccount}
                account={selectedAccount || undefined}
                seedAccount={seedAccount || undefined}
                currencies={currencies}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                canDelete={permissions.delete && Boolean(selectedAccount)}
            />
        </>
    );
};

export default AccountDialogs;
