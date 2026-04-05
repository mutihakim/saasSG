import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Modal, Row, Col, InputGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import MiniCalculator from "../../../../Components/Common/MiniCalculator";
import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface AccountModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (account?: any) => void;
    onDelete?: () => void;
    account?: any;
    currencies: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    canDelete?: boolean;
}

const AccountModal = ({ show, onClose, onSuccess, onDelete, account, currencies, members, activeMemberId, canManageShared = false, canDelete = false }: AccountModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = Boolean(account);
    const [loading, setLoading] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        scope: "private",
        type: "cash",
        currency_code: currencies[0]?.code ?? "IDR",
        owner_member_id: "",
        member_access_ids: [] as number[],
        opening_balance: "0",
        notes: "",
        is_active: true,
        row_version: 1,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        if (account) {
            setFormData({
                name: account.name ?? "",
                scope: canManageShared ? account.scope ?? "private" : "private",
                type: account.type ?? "cash",
                currency_code: account.currency_code ?? currencies[0]?.code ?? "IDR",
                owner_member_id: canManageShared
                    ? (account.owner_member_id ? String(account.owner_member_id) : "")
                    : String(account.owner_member_id ?? activeMemberId ?? ""),
                member_access_ids: canManageShared ? (account.member_access || []).map((member: any) => member.id) : [],
                opening_balance: String(account.opening_balance ?? "0"),
                notes: account.notes ?? "",
                is_active: account.is_active ?? true,
                row_version: account.row_version ?? 1,
            });
            return;
        }

        setFormData({
            name: "",
            scope: "private",
            type: "cash",
            currency_code: currencies[0]?.code ?? "IDR",
            owner_member_id: activeMemberId ? String(activeMemberId) : "",
            member_access_ids: [],
            opening_balance: "0",
            notes: "",
            is_active: true,
            row_version: 1,
        });
    }, [show, account, currencies, activeMemberId, canManageShared]);

    const memberOptions = useMemo(() => members.map((member) => ({
        value: member.id,
        label: member.full_name,
    })), [members]);

    const currencyOptions = useMemo(() => currencies.map((currency) => ({
        value: currency.code,
        label: `${currency.code} - ${currency.name}`,
    })), [currencies]);

    const accountTypeOptions = [
        { value: "cash", label: t("finance.accounts.types.cash") },
        { value: "bank", label: t("finance.accounts.types.bank") },
        { value: "ewallet", label: t("finance.accounts.types.ewallet") },
        { value: "credit_card", label: t("finance.accounts.types.credit_card") },
        { value: "paylater", label: t("finance.accounts.types.paylater") },
    ];

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await axios({
                method: isEdit ? "patch" : "post",
                url: isEdit
                    ? tenantRoute.apiTo(`/finance/accounts/${account.id}`)
                    : tenantRoute.apiTo("/finance/accounts"),
                data: {
                    ...formData,
                    owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
                    member_access_ids: formData.scope === "shared" ? formData.member_access_ids : [],
                    opening_balance: parseFloat(formData.opening_balance || "0"),
                },
            });

            notify.success(t(isEdit ? "finance.accounts.messages.updated" : "finance.accounts.messages.created"));
            onSuccess(response.data?.data?.account);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.accounts.messages.save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t(isEdit ? "finance.accounts.modal.edit_title" : "finance.accounts.modal.add_title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body data-testid="finance-account-modal">
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label>{t("finance.accounts.fields.name")}</Form.Label>
                            <Form.Control
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.accounts.fields.type")}</Form.Label>
                            <Select
                                options={accountTypeOptions}
                                value={accountTypeOptions.find((option) => option.value === formData.type)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, type: option.value }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.accounts.fields.scope")}</Form.Label>
                            <Select
                                options={[
                                    { value: "private", label: t("finance.shared.private") },
                                    { value: "shared", label: t("finance.shared.shared") },
                                ]}
                                value={{
                                    value: formData.scope,
                                    label: formData.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private"),
                                }}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, scope: option.value }))}
                                isDisabled={!canManageShared}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.accounts.fields.currency")}</Form.Label>
                            <Select
                                options={currencyOptions}
                                value={currencyOptions.find((option) => option.value === formData.currency_code)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, currency_code: option.value }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.accounts.fields.owner")}</Form.Label>
                            <Select
                                options={memberOptions}
                                isClearable
                                value={memberOptions.find((option) => String(option.value) === formData.owner_member_id)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, owner_member_id: option ? String(option.value) : "" }))}
                                isDisabled={!canManageShared}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={6}>
                            <div className="d-flex align-items-center justify-content-between">
                                <Form.Label className="mb-0">{t("finance.accounts.fields.opening_balance")}</Form.Label>
                                <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowCalculator(true)}>
                                    {t("finance.calculator.open")}
                                </Button>
                            </div>
                            <InputGroup>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.opening_balance}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, opening_balance: e.target.value }))}
                                    readOnly={showCalculator}
                                    required
                                />
                                <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                    <i className="ri-calculator-line" aria-hidden="true" />
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.accounts.fields.status")}</Form.Label>
                            <Form.Check
                                type="switch"
                                id="account-active"
                                label={formData.is_active ? t("finance.shared.active") : t("finance.shared.inactive")}
                                checked={formData.is_active}
                                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                        </Col>
                        {canManageShared && formData.scope === "shared" && (
                            <Col md={12}>
                                <Form.Label>{t("finance.accounts.fields.shared_members")}</Form.Label>
                                <Select
                                    options={memberOptions}
                                    isMulti
                                    value={memberOptions.filter((option) => formData.member_access_ids.includes(option.value))}
                                    onChange={(options: any) => setFormData((prev) => ({
                                        ...prev,
                                        member_access_ids: (options || []).map((option: any) => option.value),
                                    }))}
                                    classNamePrefix="react-select"
                                />
                            </Col>
                        )}
                        <Col md={12}>
                            <Form.Label>{t("finance.accounts.fields.notes")}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    {isEdit && canDelete && (
                        <Button variant="outline-danger" onClick={onDelete} disabled={loading} data-testid="finance-account-delete">
                            {t("finance.shared.delete")}
                        </Button>
                    )}
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.shared.cancel")}</Button>
                    <Button type="submit" variant="primary" disabled={loading} data-testid="finance-account-save">
                        {loading ? t("finance.shared.processing") : t(isEdit ? "finance.shared.update" : "finance.shared.save")}
                    </Button>
                </Modal.Footer>
            </Form>
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(value) => setFormData((prev) => ({ ...prev, opening_balance: value }))}
                value={formData.opening_balance}
                currencyCode={formData.currency_code}
                title={t("finance.calculator.account_title")}
            />
        </Modal>
    );
};

export default AccountModal;
