import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Accordion, InputGroup } from "react-bootstrap";
import Flatpickr from "react-flatpickr";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import MiniCalculator from "../../../../Components/Common/MiniCalculator";
import TagsInput from "../../../../Components/Finance/TagsInput";
import { useTenantRoute } from "../../../../common/tenantRoute";

import { submitTransaction } from "../hooks/useSubmitTransaction";
import { useTransactionModalState } from "../hooks/useTransactionModalState";
import AttachmentPreviewModal from "./pwa/AttachmentPreviewModal";
import { LockedGroupMeta, TransactionDraftMeta } from "./transactionModalTypes";

interface TransactionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (transaction?: any) => void;
    transaction?: any;
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    accounts: any[];
    budgets: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    initialType?: "pemasukan" | "pengeluaran";
    initialDraft?: Record<string, any> | null;
    draftMeta?: TransactionDraftMeta;
    lockedGroupMeta?: LockedGroupMeta;
}
const formatLocalDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

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
    members,
    activeMemberId,
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
        accountOptions,
        budgetOptions,
        categoryOptions,
        currencyOptions,
        paymentMethodOptions,
        selectedBudget,
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
        members,
        activeMemberId,
        initialType,
        initialDraft,
        lockedGroupMeta,
    });

    const attachmentPreviewUrl = (transactionId: string | number, attachmentId: string | number) => tenantRoute.apiTo(
        `/finance/transactions/${transactionId}/attachments/${attachmentId}/preview`
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
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between">
                        <Modal.Title>{t(isEdit ? "finance.modals.transaction.edit_title" : "finance.modals.transaction.add_title")}</Modal.Title>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        {(["pengeluaran", "pemasukan"] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                className={`btn btn-sm flex-fill ${formData.type === type ? "btn-danger" : "btn-light"}`}
                                onClick={() => setFormData((prev) => ({
                                    ...prev,
                                    type,
                                    category_id: "",
                                    budget_id: "",
                                }))}
                                disabled={isEdit}
                            >
                                {t(`finance.transactions.types.${type}`)}
                            </button>
                        ))}
                    </div>
                </div>
                </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-3 bg-white" style={{ paddingBottom: 112 }} data-testid="finance-transaction-modal">
                    <div className="rounded-4 border bg-white overflow-hidden h-auto">
                        <div className="p-3">
                            {draftMeta?.source === "whatsapp" && (
                                <Alert variant="info" className="rounded-4 border-0 mb-3">
                                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                        <div>
                                            <div className="fw-semibold">WhatsApp Draft</div>
                                            <div className="small text-muted">
                                                {draftMeta.confidenceScore !== null && draftMeta.confidenceScore !== undefined
                                                    ? `Confidence ${Math.round(draftMeta.confidenceScore * 100)}%`
                                                    : "Review detail transaksi sebelum submit."}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {(draftMeta.mediaItems && draftMeta.mediaItems.length > 0
                                                ? draftMeta.mediaItems
                                                : draftMeta.mediaPreviewUrl
                                                    ? [{ id: 0, preview_url: draftMeta.mediaPreviewUrl }]
                                                    : []
                                            ).map((mediaItem, index) => (
                                                <button
                                                    key={`${mediaItem.id}-${index}`}
                                                    type="button"
                                                    className="btn btn-sm btn-soft-primary"
                                                    onClick={() => setPreviewItem({
                                                        url: mediaItem.preview_url,
                                                        title: index === 0
                                                            ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                                            : `Lampiran ${index + 1}`,
                                                        mimeType: mediaItem.mime_type || null,
                                                    })}
                                                >
                                                    <i className={`${String(mediaItem.mime_type || "").startsWith("image/") ? "ri-image-line" : "ri-attachment-2"} me-1`} />
                                                    {index === 0
                                                        ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                                        : `Lampiran ${index + 1}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Alert>
                            )}
                            {!!formData.source_type && !!formData.source_id && (
                                <Alert variant="secondary" className="rounded-4 border-0 mb-3">
                                    <div className="fw-semibold">Bagian dari grup</div>
                                    <div className="small text-muted mt-1">
                                        {lockedGroupMeta?.label || formData.merchant_name || "Bulk Entry"}
                                    </div>
                                </Alert>
                            )}
                            <div className="small text-muted mb-2">{t("finance.modals.transaction.tabs.main")}</div>
                            <Row className="g-3">
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.date")}</Form.Label>
                                    <Flatpickr
                                        className="form-control"
                                        value={formData.transaction_date ? new Date(formData.transaction_date) : new Date()}
                                        onChange={([date]) => setFormData((prev) => ({ ...prev, transaction_date: formatLocalDate(date) }))}
                                        options={{ dateFormat: "Y-m-d" }}
                                    />
                                </Col>
                                {canManageShared && (
                                    <Col xs={12}>
                                        <Form.Label>{t("finance.modals.transaction.fields.owner_member")}</Form.Label>
                                        <Select
                                            options={memberOptions}
                                            value={memberOptions.find((option) => option.value === formData.owner_member_id)}
                                            onChange={(option: any) => setFormData((prev) => ({ ...prev, owner_member_id: option?.value ?? "" }))}
                                            classNamePrefix="react-select"
                                        />
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.account")}</Form.Label>
                                    <Select
                                        options={accountOptions}
                                        value={accountOptions.find((option) => option.value === formData.bank_account_id)}
                                        onChange={(option: any) => setFormData((prev) => ({ ...prev, bank_account_id: option?.value ?? "" }))}
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                <Col xs={5} className="d-flex flex-column justify-content-end">
                                    <Form.Label className="mb-2">{t("finance.modals.transaction.fields.currency")}</Form.Label>
                                    <div className="flex-grow-1 d-flex align-items-end">
                                        <div className="w-100">
                                            <Select
                                                options={currencyOptions}
                                                value={currencyOptions.find((option) => option.value === formData.currency_code)}
                                                onChange={(option: any) => setFormData((prev) => ({ ...prev, currency_code: option.value }))}
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={7} className="d-flex flex-column justify-content-end">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <Form.Label className="mb-0">{t("finance.modals.transaction.fields.amount")}</Form.Label>
                                        <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowCalculator(true)}>
                                            {t("finance.calculator.open")}
                                        </Button>
                                    </div>
                                    <div className="flex-grow-1 d-flex align-items-end">
                                        <InputGroup>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.amount")}
                                                readOnly={showCalculator}
                                                required
                                            />
                                            <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                                <i className="ri-calculator-line" aria-hidden="true" />
                                            </Button>
                                        </InputGroup>
                                    </div>
                                </Col>
                                {formData.currency_code !== defaultCurrency && (
                                    <Col xs={12}>
                                        <div className="p-3 border rounded-4 bg-white">
                                            <Form.Label>{t("finance.modals.transaction.fields.exchange_rate_hint", { currency: formData.currency_code, baseCurrency: defaultCurrency })}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.000001"
                                                value={formData.exchange_rate}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, exchange_rate: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.exchange_rate")}
                                                required
                                            />
                                        </div>
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.category")}</Form.Label>
                                    <Select
                                        options={categoryOptions}
                                        value={categoryOptions.find((option) => option.value === formData.category_id)}
                                        onChange={(option: any) => setFormData((prev) => ({ ...prev, category_id: option?.value || "" }))}
                                        isClearable
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                {formData.type === "pengeluaran" && (
                                    <Col xs={12}>
                                        <Form.Label>{t("finance.modals.transaction.fields.budget")}</Form.Label>
                                        <Select
                                            options={budgetOptions}
                                            value={budgetOptions.find((option) => option.value === formData.budget_id)}
                                            onChange={(option: any) => setFormData((prev) => ({ ...prev, budget_id: option?.value || "" }))}
                                            isClearable
                                            classNamePrefix="react-select"
                                        />
                                        {!formData.budget_id && (
                                            <Form.Text className="text-muted">{t("finance.modals.transaction.budget_unset_hint")}</Form.Text>
                                        )}
                                        {selectedBudget && budgetDelta < 0 && (
                                            <Alert variant="warning" className="mt-2 mb-0 rounded-4">
                                                {t("finance.modals.transaction.budget_over_hint", {
                                                    remaining: Number(selectedBudget.remaining_amount || 0).toLocaleString(),
                                                })}
                                            </Alert>
                                        )}
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.description")}</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        placeholder={t("finance.modals.transaction.placeholders.description")}
                                        required
                                    />
                                </Col>
                            </Row>
                        </div>

                        <div className="px-3 pb-3 bg-white">
                            <div className="small text-muted mb-2">Lampiran</div>
                            <Form.Control
                                type="file"
                                accept="image/*,application/pdf"
                                multiple
                                onChange={handleAttachmentPick}
                            />
                            <Form.Text className="text-muted">
                                Upload foto struk, resi, atau PDF. File akan disimpan setelah transaksi berhasil dibuat.
                            </Form.Text>
                            {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
                                <div className="d-grid gap-2 mt-3">
                                    {existingAttachments.map((attachment) => (
                                        <div key={attachment.id} className="d-flex align-items-center justify-content-between gap-3 rounded-4 border px-3 py-2">
                                            <div className="overflow-hidden">
                                                <div className="fw-medium text-dark text-truncate">{attachment.file_name || `Lampiran ${attachment.id}`}</div>
                                                <div className="small text-muted">
                                                    {attachment.mime_type || "file"}
                                                    {attachment.file_size ? ` · ${(Number(attachment.file_size) / 1024).toFixed(0)} KB` : ""}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2 flex-shrink-0">
                                                {transaction?.id && (
                                                    <a
                                                        className="btn btn-sm btn-light"
                                                        href={attachment.preview_url || attachmentPreviewUrl(transaction.id, attachment.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Lihat
                                                    </a>
                                                )}
                                                <Button type="button" size="sm" variant="outline-danger" onClick={() => handleRemoveExistingAttachment(attachment.id)}>
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="d-flex align-items-center justify-content-between gap-3 rounded-4 border border-dashed px-3 py-2 bg-light">
                                            <div className="overflow-hidden">
                                                <div className="fw-medium text-dark text-truncate">{file.name}</div>
                                                <div className="small text-muted">{(file.size / 1024).toFixed(0)} KB · menunggu upload</div>
                                            </div>
                                            <Button type="button" size="sm" variant="outline-secondary" onClick={() => handleRemovePendingFile(index)}>
                                                Batal
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

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

                        <Accordion className="border-top bg-white mb-0">
                            <Accordion.Item eventKey="0" className="border-0 rounded-0 bg-white">
                                <Accordion.Header>{t("finance.pwa.detail.optional_details")}</Accordion.Header>
                                <Accordion.Body className="bg-white pt-0 pb-3">
                                    <Row className="g-3">
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.payment_method_optional")}</Form.Label>
                                            <Select
                                                options={paymentMethodOptions}
                                                value={paymentMethodOptions.find((option) => option.value === formData.payment_method)}
                                                onChange={(option: any) => setFormData((prev) => ({ ...prev, payment_method: option?.value || "" }))}
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.merchant_name")}</Form.Label>
                                            <Form.Control
                                                value={formData.merchant_name}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, merchant_name: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.merchant_name")}
                                                readOnly={!isEdit && !!lockedGroupMeta}
                                            />
                                            {!isEdit && !!lockedGroupMeta && (
                                                <Form.Text className="text-muted">
                                                    Label grup dikunci agar item baru tetap masuk ke grup yang sama.
                                                </Form.Text>
                                            )}
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.location")}</Form.Label>
                                            <Form.Control
                                                value={formData.location}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.location")}
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.reference_number")}</Form.Label>
                                            <Form.Control
                                                value={formData.reference_number}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, reference_number: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.reference_number")}
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.tags")}</Form.Label>
                                            <TagsInput
                                                value={formData.tags}
                                                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                                                placeholder={t("finance.modals.transaction.placeholders.tags")}
                                            />
                                        </Col>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.modals.transaction.buttons.cancel")}</Button>
                    <Button variant="primary" type="submit" disabled={loading} data-testid="finance-transaction-save">
                        {loading
                            ? (pendingFiles.length > 0 || removedAttachmentIds.length > 0 ? "Menyimpan transaksi dan lampiran..." : t("finance.shared.processing"))
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
