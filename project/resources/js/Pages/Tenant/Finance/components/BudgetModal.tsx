import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Modal, Row, InputGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import MiniCalculator from "../../../../Components/Common/MiniCalculator";
import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

import { MemberAccessSelector, MemberAccessState } from "./MemberAccessSelector";

interface BudgetModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (budget?: any) => void;
    onDelete?: () => void;
    budget?: any;
    members: any[];
    pockets: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    canDelete?: boolean;
}

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) return false;
    if (item.scope === "shared") return true;
    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

const BudgetModal = ({ show, onClose, onSuccess, onDelete, budget, members, pockets, activeMemberId, canManageShared = false, canDelete = false }: BudgetModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = Boolean(budget);
    const [loading, setLoading] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const canManageScope = !isEdit || canManageShared || String(budget?.owner_member_id) === String(activeMemberId);
    const [formData, setFormData] = useState({
        name: "",
        scope: "shared",
        period_month: new Date().toISOString().slice(0, 7),
        allocated_amount: "0",
        owner_member_id: "",
        pocket_id: "",
        member_access: [] as MemberAccessState[],
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
                scope: canManageScope ? budget.scope ?? "shared" : "private",
                period_month: budget.period_month ?? new Date().toISOString().slice(0, 7),
                allocated_amount: String(budget.allocated_amount ?? "0"),
                owner_member_id: canManageScope
                    ? (budget.owner_member_id ? String(budget.owner_member_id) : "")
                    : String(budget.owner_member_id ?? activeMemberId ?? ""),
                pocket_id: budget.pocket_id ? String(budget.pocket_id) : "",
                member_access: canManageScope ? (budget.member_access || (budget as any).memberAccess || []).map((m: any) => ({
                    id: String(m.id),
                    can_view: Boolean(m.pivot?.can_view),
                    can_use: Boolean(m.pivot?.can_use),
                    can_manage: Boolean(m.pivot?.can_manage),
                })) : [],
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
            pocket_id: "",
            member_access: [],
            notes: "",
            is_active: true,
            row_version: 1,
        });
    }, [show, budget, activeMemberId, canManageScope]);

    const visiblePockets = useMemo(
        () => pockets.filter((pocket) => canUseForOwner(pocket, formData.owner_member_id)),
        [formData.owner_member_id, pockets],
    );

    useEffect(() => {
        if (!show) {
            return;
        }

        if (formData.pocket_id && !visiblePockets.some((pocket) => String(pocket.id) === formData.pocket_id)) {
            setFormData((prev) => ({ ...prev, pocket_id: "" }));
        }
    }, [formData.pocket_id, show, visiblePockets]);

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
                    pocket_id: formData.pocket_id || null,
                    member_access: formData.scope === "shared" ? formData.member_access : [],
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
                            <div className="d-flex align-items-center justify-content-between">
                                <Form.Label className="mb-0">{t("finance.budgets.fields.allocated_amount")}</Form.Label>
                                <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowCalculator(true)}>
                                    {t("finance.calculator.open")}
                                </Button>
                            </div>
                            <InputGroup>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    value={formData.allocated_amount}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, allocated_amount: e.target.value }))}
                                    readOnly={showCalculator}
                                    required
                                />
                                <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                    <i className="ri-calculator-line" aria-hidden="true" />
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.scope")}</Form.Label>
                            <Form.Select
                                value={formData.scope}
                                onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value as "private" | "shared" }))}
                                disabled={!canManageScope}
                            >
                                <option value="private">{t("finance.shared.private")}</option>
                                <option value="shared">{t("finance.shared.shared")}</option>
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.budgets.fields.owner")}</Form.Label>
                            <Form.Select
                                value={formData.owner_member_id}
                                onChange={(e) => setFormData((prev) => ({ ...prev, owner_member_id: e.target.value }))}
                                disabled={!canManageScope}
                            >
                                <option value="">{t("finance.shared.unassigned", { defaultValue: "Tanpa owner" })}</option>
                                {members.map((member) => (
                                    <option key={member.id} value={String(member.id)}>
                                        {member.full_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={12}>
                            <Form.Label>{t("wallet.title", { defaultValue: "Wallet" })}</Form.Label>
                            <Form.Select
                                value={formData.pocket_id}
                                onChange={(e) => setFormData((prev) => ({ ...prev, pocket_id: e.target.value }))}
                            >
                                <option value="">{t("finance.shared.select_placeholder", { defaultValue: "Pilih wallet" })}</option>
                                {visiblePockets.map((pocket) => (
                                    <option key={pocket.id} value={String(pocket.id)}>
                                        {`${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        {canManageScope && formData.scope === "shared" && (
                            <Col md={12}>
                                <Form.Label className="fw-semibold small text-uppercase text-muted">{t("finance.budgets.fields.shared_members")}</Form.Label>
                                <MemberAccessSelector
                                    members={members}
                                    value={formData.member_access}
                                    onChange={(val) => setFormData(prev => ({ ...prev, member_access: val }))}
                                    ownerMemberId={formData.owner_member_id}
                                    activeMemberId={activeMemberId ? String(activeMemberId) : null}
                                    disabled={!canManageScope}
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
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(value) => setFormData((prev) => ({ ...prev, allocated_amount: value }))}
                value={formData.allocated_amount}
                title={t("finance.calculator.budget_title")}
            />
        </Modal>
    );
};

export default BudgetModal;
