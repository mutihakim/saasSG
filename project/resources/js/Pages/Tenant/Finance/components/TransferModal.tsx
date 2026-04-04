import axios from "axios";
import React, { useMemo, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import Flatpickr from "react-flatpickr";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface TransferModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (payload?: { transaction?: any; paired_transaction?: any }) => void;
    accounts: any[];
    members: any[];
    activeMemberId?: number | null;
}

const TransferModal = ({ show, onClose, onSuccess, accounts, members, activeMemberId }: TransferModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        transfer_mode: "account",
        owner_member_id: activeMemberId ? String(activeMemberId) : "",
        recipient_member_id: "",
        from_account_id: "",
        to_account_id: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: "",
        description: "",
        currency_code: accounts[0]?.currency_code ?? "IDR",
        notes: "",
        reference_number: "",
    });

    const memberOptions = useMemo(() => members.map((member) => ({
        value: member.id,
        label: member.full_name,
    })), [members]);

    const accountOptions = useMemo(() => accounts.map((account) => ({
        value: account.id,
        label: `${account.name} (${account.currency_code})`,
        memberId: account.owner_member_id,
    })), [accounts]);

    const toAccountOptions = useMemo(() => {
        if (formData.transfer_mode !== "member" || ! formData.recipient_member_id) {
            return accountOptions;
        }

        return accountOptions.filter((option) => String(option.memberId ?? "") === formData.recipient_member_id);
    }, [accountOptions, formData.transfer_mode, formData.recipient_member_id]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(tenantRoute.apiTo("/finance/transactions"), {
                type: "transfer",
                transaction_date: formData.transaction_date,
                amount: parseFloat(formData.amount || "0"),
                currency_code: formData.currency_code,
                exchange_rate: 1,
                description: formData.description || t("finance.transfers.default_description"),
                owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
                recipient_member_id: formData.recipient_member_id ? parseInt(formData.recipient_member_id, 10) : null,
                transfer_mode: formData.transfer_mode,
                from_account_id: formData.from_account_id,
                to_account_id: formData.to_account_id,
                notes: formData.notes || null,
                reference_number: formData.reference_number || null,
            });

            notify.success(t("finance.transfers.messages.created"));
            onSuccess(response.data?.data);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.transfers.messages.save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} fullscreen>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title>{t("finance.transfers.modal.title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-3" style={{ paddingBottom: 112 }}>
                    <div className="rounded-4 border p-3 bg-light-subtle">
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.mode")}</Form.Label>
                            <div className="d-flex gap-2 mt-1">
                                {[
                                    { value: "account", label: t("finance.transfers.modes.account") },
                                    { value: "member", label: t("finance.transfers.modes.member") },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        className={`btn btn-sm flex-fill ${formData.transfer_mode === mode.value ? "btn-danger" : "btn-light"}`}
                                        onChange={() => setFormData((prev) => ({ ...prev, transfer_mode: mode.value, recipient_member_id: "", to_account_id: "" }))}
                                        onClick={() => setFormData((prev) => ({ ...prev, transfer_mode: mode.value, recipient_member_id: "", to_account_id: "" }))}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.sender")}</Form.Label>
                            <Select
                                options={memberOptions}
                                value={memberOptions.find((option) => String(option.value) === formData.owner_member_id)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, owner_member_id: String(option.value) }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        {formData.transfer_mode === "member" && (
                            <Col xs={12}>
                                <Form.Label>{t("finance.transfers.fields.recipient")}</Form.Label>
                                <Select
                                    options={memberOptions}
                                    value={memberOptions.find((option) => String(option.value) === formData.recipient_member_id)}
                                    onChange={(option: any) => setFormData((prev) => ({ ...prev, recipient_member_id: String(option.value), to_account_id: "" }))}
                                    classNamePrefix="react-select"
                                />
                            </Col>
                        )}
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.from_account")}</Form.Label>
                            <Select
                                options={accountOptions}
                                value={accountOptions.find((option) => option.value === formData.from_account_id)}
                                onChange={(option: any) => setFormData((prev) => ({
                                    ...prev,
                                    from_account_id: option.value,
                                    currency_code: accounts.find((account) => account.id === option.value)?.currency_code ?? prev.currency_code,
                                }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.to_account")}</Form.Label>
                            <Select
                                options={toAccountOptions}
                                value={toAccountOptions.find((option) => option.value === formData.to_account_id)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, to_account_id: option.value }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.date")}</Form.Label>
                            <Flatpickr
                                className="form-control"
                                value={formData.transaction_date ? new Date(formData.transaction_date) : new Date()}
                                onChange={([date]) => setFormData((prev) => ({ ...prev, transaction_date: date.toISOString().slice(0, 10) }))}
                                options={{ dateFormat: "Y-m-d" }}
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.amount")}</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                                required
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.description")}</Form.Label>
                            <Form.Control
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.notes")}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            />
                        </Col>
                    </Row>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.shared.cancel")}</Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? t("finance.shared.processing") : t("finance.transfers.actions.save")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default TransferModal;
