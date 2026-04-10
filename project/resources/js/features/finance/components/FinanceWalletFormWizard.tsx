import React from "react";
import { Button, Modal, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinanceBudget, FinanceCurrency, FinanceMember, FinanceWallet, FinanceWalletFormState } from "../types";

import WalletBasicInfoStep from "./wallet-wizard/WalletBasicInfoStep";
import WalletBudgetStep from "./wallet-wizard/WalletBudgetStep";
import WalletPersonalizationStep from "./wallet-wizard/WalletPersonalizationStep";
import WalletWizardProgress from "./wallet-wizard/WalletWizardProgress";
import { useFinanceWalletWizardState } from "./wallet-wizard/useFinanceWalletWizardState";

type Props = {
    show: boolean;
    onHide: () => void;
    onSave: (values: FinanceWalletFormState) => Promise<void>;
    saving: boolean;
    wallet: FinanceWallet | null;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    members: FinanceMember[];
    currencies: FinanceCurrency[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
};

const FinanceWalletFormWizard = ({
    show,
    onHide,
    onSave,
    saving,
    wallet,
    accounts,
    budgets,
    members,
    currencies: _currencies,
    activeMemberId,
    canManageShared = false,
}: Props) => {
    const { t } = useTranslation();
    const {
        activeStep,
        errors,
        formData,
        isEdit,
        isSystemWallet,
        canManageScope,
        stepTitles,
        selectedAccountAllowsShared,
        walletBudgetOptions,
        updateField,
        handleNext,
        handleBack,
        handleSubmit,
        handleModalHide,
    } = useFinanceWalletWizardState({
        wallet,
        accounts,
        budgets,
        members,
        activeMemberId,
        canManageShared,
        onHide,
        onSave,
    });

    return (
        <Modal show={show} onHide={handleModalHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title>
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar-xs bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                            <i className="ri-wallet-3-line text-primary fs-5"></i>
                        </div>
                        <div>
                            <div className="fw-semibold">{t(isEdit ? "wallet.modal.edit_wallet" : "wallet.modal.add_wallet", { defaultValue: isEdit ? "Edit Wallet" : "Tambah Wallet Baru" })}</div>
                            <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
                                {isEdit ? "Ubah pengaturan wallet" : "Buat wallet baru untuk kategori"}
                            </div>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-0">
                <WalletWizardProgress activeStep={activeStep} stepTitles={stepTitles} />

                <Tab.Container activeKey={String(activeStep)}>
                    <Tab.Content>
                        <Tab.Pane eventKey="1">
                            <WalletBasicInfoStep
                                isSystemWallet={isSystemWallet}
                                canManageScope={canManageScope}
                                formData={formData}
                                errors={errors}
                                accounts={accounts}
                                selectedAccountAllowsShared={selectedAccountAllowsShared}
                                updateField={updateField}
                            />
                        </Tab.Pane>

                        <Tab.Pane eventKey="2">
                            <WalletBudgetStep formData={formData} walletBudgetOptions={walletBudgetOptions} updateField={updateField} />
                        </Tab.Pane>

                        <Tab.Pane eventKey="3">
                            <WalletPersonalizationStep isSystemWallet={isSystemWallet} formData={formData} errors={errors} updateField={updateField} />
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                {activeStep > 1 ? (
                    <Button variant="light" onClick={handleBack} className="me-auto">
                        <i className="ri-arrow-left-line me-2"></i>
                        Kembali
                    </Button>
                ) : null}

                {activeStep < 3 ? (
                    <Button variant="primary" onClick={handleNext} className="ms-auto">
                        Selanjutnya
                        <i className="ri-arrow-right-line ms-2"></i>
                    </Button>
                ) : (
                    <Button variant="success" onClick={handleSubmit} disabled={saving} className="ms-auto">
                        <i className="ri-check-line me-2"></i>
                        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Wallet"}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default FinanceWalletFormWizard;
