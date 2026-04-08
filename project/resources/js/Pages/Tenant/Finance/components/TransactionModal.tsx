import React, { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import MiniCalculator from "../../../../Components/Common/MiniCalculator";
import { useTenantRoute } from "../../../../common/tenantRoute";
import { submitTransaction } from "../hooks/useSubmitTransaction";
import { useTransactionModalState } from "../hooks/useTransactionModalState";

import AttachmentPreviewModal from "./pwa/AttachmentPreviewModal";
import TransactionModalAlerts from "./TransactionModalAlerts";
import TransactionModalAttachmentSection from "./TransactionModalAttachmentSection";
import TransactionModalHeader from "./TransactionModalHeader";
import TransactionModalMainFields from "./TransactionModalMainFields";
import TransactionModalOptionalDetails from "./TransactionModalOptionalDetails";
import { TransactionModalProps } from "./transactionModalTypes";

const TransactionModal = ({
    show,
    onClose,
    onSuccess,
    transaction,
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    accounts,
    budgets,
    pockets,
    members,
    activeMemberId,
    walletSubscribed = false,
    canManageShared = false,
    initialType = "pengeluaran",
    initialDraft = null,
    draftMeta = null,
    lockedGroupMeta = null,
}: TransactionModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const {
        isEdit,
        formData,
        setFormData,
        showCalculator,
        setShowCalculator,
        existingAttachments,
        removedAttachmentIds,
        pendingFiles,
        previewItem,
        setPreviewItem,
        memberOptions,
        pocketOptions,
        budgetOptions,
        categoryOptions,
        currencyOptions,
        paymentMethodOptions,
        selectedAccount,
        selectedPocket,
        selectedBudget,
        budgetLocked,
        budgetDelta,
        handleAttachmentPick,
        handleRemoveExistingAttachment,
        handleRemovePendingFile,
    } = useTransactionModalState({
        show,
        transaction,
        categories,
        currencies,
        defaultCurrency,
        paymentMethods,
        accounts,
        budgets,
        pockets,
        members,
        activeMemberId,
        walletSubscribed,
        initialType,
        initialDraft,
        lockedGroupMeta,
    });

    const attachmentPreviewUrl = (transactionId: string | number, attachmentId: string | number) => tenantRoute.apiTo(
        `/finance/transactions/${transactionId}/attachments/${attachmentId}/preview`,
    );

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        await submitTransaction({
            formData,
            isEdit,
            tenantRoute,
            transaction,
            removedAttachmentIds,
            pendingFiles,
            t,
            onSuccess,
            onClose,
            setLoading,
        });
    };

    return (
        <Modal show={show} onHide={onClose} fullscreen>
            <TransactionModalHeader
                title={t(isEdit ? "finance.modals.transaction.edit_title" : "finance.modals.transaction.add_title")}
                formData={formData}
                isEdit={isEdit}
                setFormData={setFormData}
                getTypeLabel={(type) => t(`finance.transactions.types.${type}`)}
            />
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-3 bg-white" style={{ paddingBottom: 112 }} data-testid="finance-transaction-modal">
                    <div className="rounded-4 border bg-white overflow-hidden h-auto">
                        <div className="p-3">
                            <TransactionModalAlerts
                                draftMeta={draftMeta}
                                lockedGroupMeta={lockedGroupMeta}
                                sourceType={formData.source_type}
                                sourceId={formData.source_id}
                                merchantName={formData.merchant_name}
                                setPreviewItem={setPreviewItem}
                                t={t}
                            />
                            <TransactionModalMainFields
                                canManageShared={canManageShared}
                                formData={formData}
                                defaultCurrency={defaultCurrency}
                                memberOptions={memberOptions}
                                pocketOptions={pocketOptions}
                                selectedAccount={selectedAccount}
                                selectedPocket={selectedPocket}
                                currencyOptions={currencyOptions}
                                categoryOptions={categoryOptions}
                                budgetOptions={budgetOptions}
                                selectedBudget={selectedBudget}
                                budgetLocked={budgetLocked}
                                budgetDelta={budgetDelta}
                                setFormData={setFormData}
                                setShowCalculator={setShowCalculator}
                                showCalculator={showCalculator}
                                t={t}
                            />
                        </div>

                        <TransactionModalAttachmentSection
                            existingAttachments={existingAttachments}
                            pendingFiles={pendingFiles}
                            transactionId={transaction?.id}
                            attachmentPreviewUrl={attachmentPreviewUrl}
                            handleAttachmentPick={handleAttachmentPick}
                            handleRemoveExistingAttachment={handleRemoveExistingAttachment}
                            handleRemovePendingFile={handleRemovePendingFile}
                        />

                        <div className="px-3 pb-3 bg-white">
                            <div className="small text-muted mb-2">{t("finance.modals.transaction.fields.notes")}</div>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder={t("finance.modals.transaction.placeholders.notes")}
                            />
                        </div>

                        <TransactionModalOptionalDetails
                            formData={formData}
                            isEdit={isEdit}
                            lockedGroupMeta={lockedGroupMeta}
                            paymentMethodOptions={paymentMethodOptions}
                            setFormData={setFormData}
                            t={t}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.modals.transaction.buttons.cancel")}</Button>
                    <Button variant="primary" type="submit" disabled={loading} data-testid="finance-transaction-save">
                        {loading
                            ? t("finance.shared.processing")
                            : t(isEdit ? "finance.modals.transaction.buttons.update" : "finance.modals.transaction.buttons.save")}
                    </Button>
                </Modal.Footer>
            </Form>
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(value) => setFormData((prev) => ({ ...prev, amount: value }))}
                value={formData.amount}
                currencyCode={formData.currency_code}
                title={t("finance.calculator.transaction_title")}
            />
            <AttachmentPreviewModal
                show={previewItem !== null}
                item={previewItem}
                onClose={() => setPreviewItem(null)}
            />
        </Modal>
    );
};

export default TransactionModal;
