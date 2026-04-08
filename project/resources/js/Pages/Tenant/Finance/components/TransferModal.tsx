import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import MiniCalculator from "../../../../Components/Common/MiniCalculator";
import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface TransferModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (payload?: { transaction?: any; paired_transaction?: any }) => void;
    accounts: any[];
    pockets: any[];
    destinationPockets: any[];
    members: any[];
    activeMemberId?: number | null;
}

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) return false;
    if (item.scope === "shared") return true;
    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

const TransferModal = ({ show, onClose, onSuccess, accounts, pockets, destinationPockets, members, activeMemberId }: TransferModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [formData, setFormData] = useState({
        transfer_mode: "wallet",
        owner_member_id: activeMemberId ? String(activeMemberId) : "",
        recipient_member_id: "",
        from_pocket_id: "",
        to_pocket_id: "",
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: "",
        description: "",
        currency_code: pockets[0]?.currency_code ?? accounts[0]?.currency_code ?? "IDR",
        notes: "",
        reference_number: "",
    });

    const memberOptions = useMemo(() => members.map((member) => ({
        value: member.id,
        label: member.full_name,
    })), [members]);

    const visiblePockets = useMemo(() => pockets.filter((pocket) => canUseForOwner(pocket, formData.owner_member_id)), [formData.owner_member_id, pockets]);
    const pocketOptions = useMemo(() => visiblePockets.map((pocket) => ({
        value: pocket.id,
        label: `${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`,
        memberId: pocket.owner_member_id,
    })), [visiblePockets]);

    const destinationPocketOptions = useMemo(() => destinationPockets.map((pocket) => ({
        value: pocket.id,
        label: `${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`,
        memberId: pocket.owner_member_id,
        currencyCode: pocket.currency_code,
    })), [destinationPockets]);

    const toPocketOptions = useMemo(() => {
        const filtered = formData.transfer_mode === "member" && formData.recipient_member_id
            ? destinationPocketOptions.filter((option) => String(option.memberId ?? "") === formData.recipient_member_id || String(option.memberId ?? "") === "")
            : destinationPocketOptions;

        return filtered.filter((option) => option.currencyCode === formData.currency_code && String(option.value) !== String(formData.from_pocket_id));
    }, [destinationPocketOptions, formData.currency_code, formData.from_pocket_id, formData.recipient_member_id, formData.transfer_mode]);

    const selectedFromPocket = useMemo(() => visiblePockets.find((pocket) => String(pocket.id) === String(formData.from_pocket_id)) ?? null, [formData.from_pocket_id, visiblePockets]);
    const selectedToPocket = useMemo(() => destinationPockets.find((pocket) => String(pocket.id) === String(formData.to_pocket_id)) ?? null, [destinationPockets, formData.to_pocket_id]);
    const selectedFromAccount = useMemo(() => accounts.find((account) => String(account.id) === String(selectedFromPocket?.real_account_id || "")) ?? null, [accounts, selectedFromPocket]);
    const selectedToAccount = useMemo(() => accounts.find((account) => String(account.id) === String(selectedToPocket?.real_account_id || "")) ?? null, [accounts, selectedToPocket]);

    useEffect(() => {
        if (!show) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            owner_member_id: prev.owner_member_id || (activeMemberId ? String(activeMemberId) : ""),
            from_pocket_id: prev.from_pocket_id || (visiblePockets[0]?.id ? String(visiblePockets[0].id) : ""),
            currency_code: prev.currency_code || visiblePockets[0]?.currency_code || accounts[0]?.currency_code || "IDR",
        }));
    }, [accounts, activeMemberId, show, visiblePockets]);

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
                from_pocket_id: formData.from_pocket_id,
                to_pocket_id: formData.to_pocket_id,
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
                                    { value: "wallet", label: t("wallet.title", { defaultValue: "Wallet" }) },
                                    { value: "member", label: t("finance.transfers.modes.member") },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        className={`btn btn-sm flex-fill ${formData.transfer_mode === mode.value ? "btn-danger" : "btn-light"}`}
                                        onChange={() => setFormData((prev) => ({ ...prev, transfer_mode: mode.value, recipient_member_id: "", to_pocket_id: "" }))}
                                        onClick={() => setFormData((prev) => ({ ...prev, transfer_mode: mode.value, recipient_member_id: "", to_pocket_id: "" }))}
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
                                    onChange={(option: any) => setFormData((prev) => ({ ...prev, recipient_member_id: String(option.value), to_pocket_id: "" }))}
                                    classNamePrefix="react-select"
                                />
                            </Col>
                        )}
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.from_account", { defaultValue: "Wallet Asal" })}</Form.Label>
                            <Select
                                options={pocketOptions}
                                value={pocketOptions.find((option) => option.value === formData.from_pocket_id)}
                                onChange={(option: any) => setFormData((prev) => ({
                                    ...prev,
                                    from_pocket_id: option.value,
                                    currency_code: visiblePockets.find((pocket) => pocket.id === option.value)?.currency_code ?? prev.currency_code,
                                    to_pocket_id: prev.to_pocket_id === option.value ? "" : prev.to_pocket_id,
                                }))}
                                classNamePrefix="react-select"
                            />
                            {selectedFromPocket && (
                                <Form.Text className="text-muted d-block mt-1">
                                    Saldo: {Number(selectedFromPocket.current_balance || 0).toLocaleString("id-ID")}
                                </Form.Text>
                            )}
                            {selectedFromAccount && (
                                <Form.Text className="text-muted d-block">
                                    Akun: {selectedFromAccount.name} · {selectedFromAccount.currency_code}
                                </Form.Text>
                            )}
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.to_account", { defaultValue: "Wallet Tujuan" })}</Form.Label>
                            <Select
                                options={toPocketOptions}
                                value={toPocketOptions.find((option) => option.value === formData.to_pocket_id)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, to_pocket_id: option.value }))}
                                classNamePrefix="react-select"
                            />
                            {selectedToPocket && (
                                <Form.Text className="text-muted d-block mt-1">
                                    Saldo: {Number(selectedToPocket.current_balance || 0).toLocaleString("id-ID")}
                                </Form.Text>
                            )}
                            {selectedToAccount && (
                                <Form.Text className="text-muted d-block">
                                    Akun: {selectedToAccount.name} · {selectedToAccount.currency_code}
                                </Form.Text>
                            )}
                        </Col>
                        <Col xs={12}>
                            <Form.Label>{t("finance.transfers.fields.date")}</Form.Label>
                            <Form.Control
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
                            />
                        </Col>
                        <Col xs={12}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <Form.Label className="mb-0">{t("finance.transfers.fields.amount")}</Form.Label>
                                <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowCalculator(true)}>
                                    {t("finance.calculator.open")}
                                </Button>
                            </div>
                            <InputGroup>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                                    readOnly={showCalculator}
                                    required
                                />
                                <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                    <i className="ri-calculator-line" aria-hidden="true" />
                                </Button>
                            </InputGroup>
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
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(value) => setFormData((prev) => ({ ...prev, amount: value }))}
                value={formData.amount}
                currencyCode={formData.currency_code}
                title={t("finance.calculator.transaction_title")}
            />
        </Modal>
    );
};

export default TransferModal;
