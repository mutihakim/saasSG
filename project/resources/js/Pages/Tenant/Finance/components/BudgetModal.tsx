import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface BudgetModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (budget?: any) => void;
    onDelete?: () => void;
    budget?: any;
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    canDelete?: boolean;
}

const BudgetModal = ({ show, onClose, onSuccess, onDelete, budget, members, activeMemberId, canManageShared = false, canDelete = false }: BudgetModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = Boolean(budget);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        scope: "shared",
        period_month: new Date().toISOString().slice(0, 7),
        allocated_amount: "0",
        owner_member_id: "",
        member_access_ids: [] as number[],
        notes: "",
        is_active: true,
        row_version: 1,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        if (budget) {
            setFormData({
                name: budget.name ?? "",
                scope: canManageShared ? budget.scope ?? "shared" : "private",
                period_month: budget.period_month ?? new Date().toISOString().slice(0, 7),
                allocated_amount: String(budget.allocated_amount ?? "0"),
                owner_member_id: canManageShared
                    ? (budget.owner_member_id ? String(budget.owner_member_id) : "")
                    : String(budget.owner_member_id ?? activeMemberId ?? ""),
                member_access_ids: canManageShared ? (budget.member_access || []).map((member: any) => member.id) : [],
                notes: budget.notes ?? "",
                is_active: budget.is_active ?? true,
                row_version: budget.row_version ?? 1,
            });
            return;
        }

        setFormData({
            name: "",
            scope: "private",
            period_month: new Date().toISOString().slice(0, 7),
            allocated_amount: "0",
            owner_member_id: activeMemberId ? String(activeMemberId) : "",
            member_access_ids: [],
            notes: "",
            is_active: true,
            row_version: 1,
        });
    }, [show, budget, activeMemberId, canManageShared]);

    const memberOptions = useMemo(() => members.map((member) => ({
        value: member.id,
        label: member.full_name,
    })), [members]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await axios({
                method: isEdit ? "patch" : "post",
                url: isEdit
                    ? tenantRoute.apiTo(`/finance/budgets/${budget.id}`)
                    : tenantRoute.apiTo("/finance/budgets"),
                data: {
                    ...formData,
                    owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
                    member_access_ids: formData.scope === "shared" ? formData.member_access_ids : [],
                    allocated_amount: parseFloat(formData.allocated_amount || "0"),
                },
            });

            notify.success(t(isEdit ? "finance.budgets.messages.updated" : "finance.budgets.messages.created"));
            onSuccess(response.data?.data?.budget);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.budgets.messages.save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t(isEdit ? "finance.budgets.modal.edit_title" : "finance.budgets.modal.add_title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body data-testid="finance-budget-modal">
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label>{t("finance.budgets.fields.name")}</Form.Label>
                            <Form.Control
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.period")}</Form.Label>
                            <Form.Control
                                type="month"
                                value={formData.period_month}
                                onChange={(e) => setFormData((prev) => ({ ...prev, period_month: e.target.value }))}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.allocated_amount")}</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={formData.allocated_amount}
                                onChange={(e) => setFormData((prev) => ({ ...prev, allocated_amount: e.target.value }))}
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.scope")}</Form.Label>
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
                            <Form.Label>{t("finance.budgets.fields.owner")}</Form.Label>
                            <Select
                                options={memberOptions}
                                isClearable
                                value={memberOptions.find((option) => String(option.value) === formData.owner_member_id)}
                                onChange={(option: any) => setFormData((prev) => ({ ...prev, owner_member_id: option ? String(option.value) : "" }))}
                                isDisabled={!canManageShared}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        {canManageShared && formData.scope === "shared" && (
                            <Col md={12}>
                                <Form.Label>{t("finance.budgets.fields.shared_members")}</Form.Label>
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
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.status")}</Form.Label>
                            <Form.Check
                                type="switch"
                                id="budget-active"
                                label={formData.is_active ? t("finance.shared.active") : t("finance.shared.inactive")}
                                checked={formData.is_active}
                                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Label>{t("finance.budgets.fields.notes")}</Form.Label>
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
                        <Button variant="outline-danger" onClick={onDelete} disabled={loading} data-testid="finance-budget-delete">
                            {t("finance.shared.delete")}
                        </Button>
                    )}
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.shared.cancel")}</Button>
                    <Button type="submit" variant="primary" disabled={loading} data-testid="finance-budget-save">
                        {loading ? t("finance.shared.processing") : t(isEdit ? "finance.shared.update" : "finance.shared.save")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default BudgetModal;
