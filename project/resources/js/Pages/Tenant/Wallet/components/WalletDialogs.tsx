import React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import TransactionModal from "../../Finance/components/TransactionModal";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinanceBudget, FinanceCurrency, FinanceMember, FinancePocket, FinanceSavingsGoal } from "../../Finance/types";
import WalletAccountModal from "./WalletAccountModal";
import WalletAccountDetailSheet from "./pwa/WalletAccountDetailSheet";
import WalletDetailSheet from "./pwa/WalletDetailSheet";
import WalletFormWizard from "./WalletFormWizard";
import { ConvertWishFormState, GoalFormState, WalletFormState, WalletWish, WishFormState } from "../types";

type Props = {
    showAccountDetailSheet: boolean;
    selectedAccount: FinanceAccount | null;
    setShowAccountDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    openAccountModal: (account?: FinanceAccount | null, duplicateFrom?: FinanceAccount | null) => void;
    handleDeleteAccount: () => Promise<void>;
    showWalletDetailSheet: boolean;
    selectedWallet: FinancePocket | null;
    setShowWalletDetailSheet: React.Dispatch<React.SetStateAction<boolean>>;
    openWalletModal: (wallet?: FinancePocket | null, accountId?: string) => void;
    setSelectedWallet: React.Dispatch<React.SetStateAction<FinancePocket | null>>;
    setWalletForm: React.Dispatch<React.SetStateAction<WalletFormState>>;
    handleDeleteWallet: (wallet: FinancePocket) => Promise<void>;
    permissions: { update: boolean; delete: boolean; manageShared: boolean };
    showAccountModal: boolean;
    setShowAccountModal: React.Dispatch<React.SetStateAction<boolean>>;
    seedAccount: FinanceAccount | null;
    setSeedAccount: React.Dispatch<React.SetStateAction<FinanceAccount | null>>;
    syncAll: () => Promise<void>;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    currencies: FinanceCurrency[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    showWalletModal: boolean;
    setShowWalletModal: React.Dispatch<React.SetStateAction<boolean>>;
    walletForm: WalletFormState;
    selectedGoal: FinanceSavingsGoal | null;
    showGoalModal: boolean;
    setShowGoalModal: React.Dispatch<React.SetStateAction<boolean>>;
    goalForm: GoalFormState;
    setGoalForm: React.Dispatch<React.SetStateAction<GoalFormState>>;
    handleSaveGoal: () => Promise<void>;
    handleDeleteGoal: (goal: FinanceSavingsGoal) => Promise<void>;
    savingGoal: boolean;
    wallets: FinancePocket[];
    selectedWish: WalletWish | null;
    showWishModal: boolean;
    setShowWishModal: React.Dispatch<React.SetStateAction<boolean>>;
    wishForm: WishFormState;
    setWishForm: React.Dispatch<React.SetStateAction<WishFormState>>;
    handleSaveWish: () => Promise<void>;
    savingWish: boolean;
    showConvertModal: boolean;
    setShowConvertModal: React.Dispatch<React.SetStateAction<boolean>>;
    convertForm: ConvertWishFormState;
    setConvertForm: React.Dispatch<React.SetStateAction<ConvertWishFormState>>;
    handleConvertWish: () => Promise<void>;
    convertingWish: boolean;
    handleSaveWallet: () => Promise<void>;
    savingWallet: boolean;
    transactionModal: boolean;
    setTransactionModal: (show: boolean) => void;
    transactionDraft: any;
    setTransactionDraft: (draft: any) => void;
    transactionDraftMeta: any;
    setTransactionDraftMeta: (meta: any) => void;
    transactionPresetType: "pemasukan" | "pengeluaran"| "transfer";
    categories: any[];
    paymentMethods: any[];
    walletSubscribed: boolean;
    defaultCurrency: string;
    onAddMoney: () => void;
    onMoveMoney: () => void;
    onPaySend: () => void;
};

const WalletDialogs = ({
    showAccountDetailSheet,
    selectedAccount,
    setShowAccountDetailSheet,
    openAccountModal,
    handleDeleteAccount,
    showWalletDetailSheet,
    selectedWallet,
    setShowWalletDetailSheet,
    openWalletModal,
    setSelectedWallet,
    setWalletForm,
    handleDeleteWallet,
    permissions,
    showAccountModal,
    setShowAccountModal,
    seedAccount,
    setSeedAccount,
    syncAll,
    accounts,
    budgets,
    currencies,
    members,
    activeMemberId,
    showWalletModal,
    setShowWalletModal,
    walletForm,
    selectedGoal,
    showGoalModal,
    setShowGoalModal,
    goalForm,
    setGoalForm,
    handleSaveGoal,
    savingGoal,
    wallets,
    selectedWish,
    showWishModal,
    setShowWishModal,
    wishForm,
    setWishForm,
    handleSaveWish,
    savingWish,
    showConvertModal,
    setShowConvertModal,
    convertForm,
    setConvertForm,
    handleConvertWish,
    convertingWish,
    handleSaveWallet,
    savingWallet,
    transactionModal,
    setTransactionModal,
    transactionDraft,
    setTransactionDraft,
    transactionDraftMeta,
    setTransactionDraftMeta,
    transactionPresetType,
    categories,
    paymentMethods,
    walletSubscribed,
    defaultCurrency,
    onAddMoney,
    onMoveMoney,
    onPaySend,
}: Props) => {
    const { t } = useTranslation();
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
                    if (!selectedAccount) {
                        return;
                    }

                    setShowAccountDetailSheet(false);
                    openAccountModal(null, {
                        ...selectedAccount,
                        name: `${selectedAccount.name} Copy`,
                    });
                }}
                onDelete={() => {
                    setShowAccountDetailSheet(false);
                    void handleDeleteAccount();
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete && Boolean(selectedAccount)}
            />

            <WalletDetailSheet
                show={showWalletDetailSheet}
                wallet={selectedWallet}
                onClose={() => setShowWalletDetailSheet(false)}
                onEdit={() => {
                    if (!selectedWallet) {
                        return;
                    }

                    setShowWalletDetailSheet(false);
                    openWalletModal(selectedWallet);
                }}
                onDuplicate={() => {
                    if (!selectedWallet) {
                        return;
                    }

                    setShowWalletDetailSheet(false);
                    setSelectedWallet(null);
                    setWalletForm({
                        name: `${selectedWallet.name} Copy`,
                        type: (selectedWallet.type as string) === "main" ? "personal" : (selectedWallet.type as WalletFormState["type"]),
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
                    });
                    setShowWalletModal(true);
                }}
                onDelete={() => {
                    if (!selectedWallet) {
                        return;
                    }

                    setShowWalletDetailSheet(false);
                    void handleDeleteWallet(selectedWallet);
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete && Boolean(selectedWallet) && !selectedWallet?.is_system}
                onAddMoney={onAddMoney}
                onMoveMoney={onMoveMoney}
                onPaySend={onPaySend}
            />

            <WalletAccountModal
                show={showAccountModal}
                onClose={() => {
                    setShowAccountModal(false);
                    setSeedAccount(null);
                }}
                onSuccess={async () => {
                    setSeedAccount(null);
                    await syncAll();
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

            <WalletFormWizard
                show={showWalletModal}
                onHide={() => setShowWalletModal(false)}
                onSave={async (values) => {
                    setWalletForm(values);
                    await handleSaveWallet();
                }}
                saving={savingWallet}
                wallet={selectedWallet}
                accounts={accounts}
                budgets={budgets}
                members={members}
                currencies={currencies}
                activeMemberId={activeMemberId}
            />

            <Modal show={showGoalModal} onHide={() => setShowGoalModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t(selectedGoal ? "wallet.modal.edit_goal" : "wallet.modal.add_goal")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("wallet.fields.goal_name")}</Form.Label>
                        <Form.Control value={goalForm.name} onChange={(e) => setGoalForm((prev) => ({ ...prev, name: e.target.value }))} />
                    </Form.Group>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.wallet")}</Form.Label>
                            <Form.Select value={goalForm.pocket_id} onChange={(e) => setGoalForm((prev) => ({ ...prev, pocket_id: e.target.value }))}>
                                {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_amount")}</Form.Label>
                            <Form.Control type="number" step="0.01" value={goalForm.target_amount} onChange={(e) => setGoalForm((prev) => ({ ...prev, target_amount: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_date")}</Form.Label>
                            <Form.Control type="date" value={goalForm.target_date} onChange={(e) => setGoalForm((prev) => ({ ...prev, target_date: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.status")}</Form.Label>
                            <Form.Select value={goalForm.status} onChange={(e) => setGoalForm((prev) => ({ ...prev, status: e.target.value as GoalFormState["status"] }))}>
                                <option value="active">{t("wallet.goal_status.active")}</option>
                                <option value="completed">{t("wallet.goal_status.completed")}</option>
                                <option value="paused">{t("wallet.goal_status.paused")}</option>
                            </Form.Select>
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.notes")}</Form.Label>
                        <Form.Control as="textarea" rows={3} value={goalForm.notes} onChange={(e) => setGoalForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowGoalModal(false)}>{t("wallet.actions.cancel")}</Button>
                    <Button variant="primary" onClick={() => void handleSaveGoal()} disabled={savingGoal || !goalForm.name || !goalForm.pocket_id || !goalForm.target_amount}>
                        {savingGoal ? t("wallet.actions.saving") : t("wallet.actions.save_goal")}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showWishModal} onHide={() => setShowWishModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t(selectedWish ? "wallet.modal.edit_wish" : "wallet.modal.add_wish")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("wallet.fields.wish_title")}</Form.Label>
                        <Form.Control value={wishForm.title} onChange={(e) => setWishForm((prev) => ({ ...prev, title: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("wallet.fields.description")}</Form.Label>
                        <Form.Control as="textarea" rows={3} value={wishForm.description} onChange={(e) => setWishForm((prev) => ({ ...prev, description: e.target.value }))} />
                    </Form.Group>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.estimated_amount")}</Form.Label>
                            <Form.Control type="number" step="0.01" value={wishForm.estimated_amount} onChange={(e) => setWishForm((prev) => ({ ...prev, estimated_amount: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.priority")}</Form.Label>
                            <Form.Select value={wishForm.priority} onChange={(e) => setWishForm((prev) => ({ ...prev, priority: e.target.value as WishFormState["priority"] }))}>
                                <option value="low">{t("wallet.priority.low")}</option>
                                <option value="medium">{t("wallet.priority.medium")}</option>
                                <option value="high">{t("wallet.priority.high")}</option>
                            </Form.Select>
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.image_url")}</Form.Label>
                        <Form.Control value={wishForm.image_url} onChange={(e) => setWishForm((prev) => ({ ...prev, image_url: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.notes")}</Form.Label>
                        <Form.Control as="textarea" rows={2} value={wishForm.notes} onChange={(e) => setWishForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowWishModal(false)}>{t("wallet.actions.cancel")}</Button>
                    <Button variant="primary" onClick={() => void handleSaveWish()} disabled={savingWish || !wishForm.title}>
                        {savingWish ? t("wallet.actions.saving") : t("wallet.actions.save_wish")}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t("wallet.modal.convert_wish")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="small text-muted mb-3">{selectedWish?.title}</div>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label>{t("wallet.fields.wallet")}</Form.Label>
                            <Form.Select value={convertForm.wallet_id} onChange={(e) => setConvertForm((prev) => ({ ...prev, wallet_id: e.target.value }))}>
                                {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_amount")}</Form.Label>
                            <Form.Control type="number" step="0.01" value={convertForm.target_amount} onChange={(e) => setConvertForm((prev) => ({ ...prev, target_amount: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_date")}</Form.Label>
                            <Form.Control type="date" value={convertForm.target_date} onChange={(e) => setConvertForm((prev) => ({ ...prev, target_date: e.target.value }))} />
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.notes")}</Form.Label>
                        <Form.Control as="textarea" rows={3} value={convertForm.notes} onChange={(e) => setConvertForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowConvertModal(false)}>{t("wallet.actions.cancel")}</Button>
                    <Button variant="primary" onClick={() => void handleConvertWish()} disabled={convertingWish || !convertForm.wallet_id}>
                        {convertingWish ? t("wallet.actions.saving") : t("wallet.actions.convert_goal")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default WalletDialogs;
