import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Modal, Row, InputGroup, Card, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { MemberAccessSelector, MemberAccessState } from "./MemberAccessSelector";

import MiniCalculator from "@/components/ui/MiniCalculator";
import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";


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
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCalculator, setShowCalculator] = useState(false);
    
    const canManageScope = !isEdit || canManageShared || String(budget?.owner_member_id) === String(activeMemberId);

    const [formData, setFormData] = useState({
        name: "",
        scope: "private" as "private" | "shared",
        period_month: new Date().toISOString().slice(0, 7),
        allocated_amount: "0",
        owner_member_id: "",
        wallet_id: "",
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
            const memberAccessArr = (budget.member_access || budget.memberAccess || []).map((m: any) => ({
                id: String(m.id),
                can_view: Boolean(m.pivot?.can_view || m.can_view),
                can_use: Boolean(m.pivot?.can_use || m.can_use),
                can_manage: Boolean(m.pivot?.can_manage || m.can_manage),
            }));

            setFormData({
                name: budget.name ?? "",
                scope: canManageScope ? budget.scope ?? "private" : "private",
                period_month: budget.period_month ?? new Date().toISOString().slice(0, 7),
                allocated_amount: String(budget.allocated_amount ?? "0"),
                owner_member_id: canManageScope
                    ? (budget.owner_member_id ? String(budget.owner_member_id) : "")
                    : String(budget.owner_member_id ?? activeMemberId ?? ""),
                wallet_id: budget.wallet_id ? String(budget.wallet_id) : "",
                member_access: memberAccessArr,
                notes: budget.notes ?? "",
                is_active: budget.is_active ?? true,
                row_version: budget.row_version ?? 1,
            });
            setActiveStep(1);
            setErrors({});
            return;
        }

        setFormData({
            name: "",
            scope: "private",
            period_month: new Date().toISOString().slice(0, 7),
            allocated_amount: "0",
            owner_member_id: activeMemberId ? String(activeMemberId) : "",
            member_access: [],
            wallet_id: "",
            notes: "",
            is_active: true,
            row_version: 1,
        });
        setActiveStep(1);
        setErrors({});
    }, [show, budget, activeMemberId, canManageScope]);

    const visiblePockets = useMemo(
        () => pockets.filter((pocket) => canUseForOwner(pocket, formData.owner_member_id)),
        [formData.owner_member_id, pockets],
    );

    useEffect(() => {
        if (!show) {
            return;
        }

        if (formData.wallet_id && !visiblePockets.some((pocket) => String(pocket.id) === formData.wallet_id)) {
            setFormData((prev) => ({ ...prev, wallet_id: "" }));
        }
    }, [formData.wallet_id, show, visiblePockets]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[field];
                return newErr;
            });
        }
    };

    const validateStep1 = () => {
        const newErrs: Record<string, string> = {};
        if (!formData.name.trim()) newErrs.name = "Nama budget wajib diisi";
        setErrors(newErrs);
        return Object.keys(newErrs).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 1) {
            if (validateStep1()) setActiveStep(2);
        } else if (activeStep === 2) {
            setActiveStep(3);
        }
    };

    const handleSubmit = async (event?: React.FormEvent) => {
        if (event) event.preventDefault();
        if (activeStep === 1 && !validateStep1()) return;

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
                    wallet_id: formData.wallet_id || null,
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

    const stepTitles = [
        { number: 1, label: "Informasi Dasar", icon: "ri-pie-chart-line" },
        { number: 2, label: "Konfigurasi", icon: "ri-settings-4-line" },
        { number: 3, label: "Pengaturan & Akses", icon: "ri-shield-user-fill" },
    ];

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title>
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar-xs bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                            <i className="ri-pie-chart-line text-primary fs-5"></i>
                        </div>
                        <div>
                            <div className="fw-semibold">{isEdit ? t("finance.budgets.modal.edit_title") : t("finance.budgets.modal.add_title")}</div>
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                Budget membantu mengontrol alokasi pengeluaran bulanan Anda.
                            </div>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-0">
                {/* Progress Steps */}
                <div className="mb-4 mt-3">
                    <div className="d-flex justify-content-between align-items-center position-relative">
                        <div className="position-absolute top-50 start-0 w-100 translate-middle-y" style={{ height: '2px', background: '#e2e8f0', zIndex: 0 }} />
                        <div 
                            className="position-absolute top-50 start-0 translate-middle-y" 
                            style={{ 
                                height: '2px', 
                                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                                width: `${((activeStep - 1) / 2) * 100}%`,
                                zIndex: 1,
                                transition: 'width 0.3s ease'
                            }} 
                        />

                        {stepTitles.map((step) => {
                            const isActive = activeStep === step.number;
                            const isCompleted = activeStep > step.number;
                            
                            return (
                                <div key={step.number} className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                                    <div
                                        className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: isCompleted 
                                                ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' 
                                                : isActive 
                                                    ? '#fff' 
                                                    : '#f1f5f9',
                                            border: isActive || isCompleted ? '3px solid #3b82f6' : '3px solid #e2e8f0',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                        }}
                                    >
                                        {isCompleted ? (
                                            <i className="ri-check-line text-white fs-5"></i>
                                        ) : (
                                            <i className={`${step.icon} ${isActive ? 'text-primary' : 'text-muted'} fs-5`}></i>
                                        )}
                                    </div>
                                    <div className={`mt-2 fw-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                                        {step.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Tab.Container activeKey={String(activeStep)}>
                    <Tab.Content>
                        {/* STEP 1 */}
                        <Tab.Pane eventKey="1">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">{t("finance.budgets.fields.name")}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    isInvalid={Boolean(errors.name)}
                                    placeholder="Contoh: Belanja Bulanan, Biaya Listrik, Jajan"
                                />
                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                            </div>

                            <Row>
                                <Col md={6}>
                                    <div className="mb-4">
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">{t("finance.budgets.fields.period")}</Form.Label>
                                        <Form.Control
                                            type="month"
                                            value={formData.period_month}
                                            onChange={(e) => updateField('period_month', e.target.value)}
                                            required
                                        />
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <Form.Label className="fw-semibold small text-uppercase text-muted m-0">{t("finance.budgets.fields.allocated_amount")}</Form.Label>
                                            <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={() => setShowCalculator(true)}>
                                                <i className="ri-calculator-line" /> {t("finance.calculator.open")}
                                            </Button>
                                        </div>
                                        <InputGroup>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                pattern="[0-9]*"
                                                value={formData.allocated_amount}
                                                onChange={(e) => updateField('allocated_amount', e.target.value)}
                                                readOnly={showCalculator}
                                                required
                                            />
                                            <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                                <i className="ri-calculator-line" />
                                            </Button>
                                        </InputGroup>
                                    </div>
                                </Col>
                            </Row>
                        </Tab.Pane>

                        {/* STEP 2 */}
                        <Tab.Pane eventKey="2">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">{t("wallet.title")}</Form.Label>
                                <Form.Select
                                    value={formData.wallet_id}
                                    onChange={(e) => updateField('wallet_id', e.target.value)}
                                >
                                    <option value="">{t("finance.shared.select_placeholder", { defaultValue: "Semua Wallet (Unallocated)" })}</option>
                                    {visiblePockets.map((pocket) => (
                                        <option key={pocket.id} value={String(pocket.id)}>
                                            {`${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Menghubungkan budget ke wallet spesifik akan mengunci penggunaan budget hanya dari wallet tersebut.
                                </Form.Text>
                            </div>

                            <div className="mb-4">
                                <Card
                                    className="border-0 mb-3"
                                    style={{
                                        background: formData.is_active ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(52, 211, 153, 0.05))' : '#fff',
                                        border: formData.is_active ? '2px solid #10b981' : '1px solid #e2e8f0',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                                    <i className="ri-toggle-line text-success fs-5"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">{t("finance.shared.status")}</div>
                                                    <div className="small text-muted">Budget aktif dapat dipilih saat membuat transaksi</div>
                                                </div>
                                            </div>
                                            <Form.Check
                                                type="switch"
                                                checked={formData.is_active}
                                                onChange={(e) => updateField('is_active', e.target.checked)}
                                                className="mb-0"
                                                style={{ transform: 'scale(1.3)' }}
                                            />
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">{t("finance.budgets.fields.notes")}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    placeholder="Catatan tambahan mengenai budget ini..."
                                />
                            </div>
                        </Tab.Pane>

                        {/* STEP 3 */}
                        <Tab.Pane eventKey="3">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">{t("finance.budgets.fields.owner")}</Form.Label>
                                <Form.Select
                                    value={formData.owner_member_id}
                                    onChange={(e) => updateField('owner_member_id', e.target.value)}
                                    disabled={!canManageScope}
                                >
                                    <option value="">{t("finance.shared.unassigned")}</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={String(member.id)}>
                                            {member.full_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">{t("finance.budgets.fields.scope")}</Form.Label>
                                <Row className="g-3">
                                    {[
                                        { value: 'private', icon: 'ri-user-line', label: 'Private', color: '#64748b', bg: '#f8fafc' },
                                        { value: 'shared', icon: 'ri-team-line', label: 'Shared', color: '#3b82f6', bg: '#eff6ff' },
                                    ].map(option => (
                                        <Col key={option.value} xs={6} className="d-flex">
                                            <Card
                                                onClick={() => {
                                                    if (!canManageScope) return;
                                                    updateField('scope', option.value);
                                                    if (option.value === 'private') {
                                                        updateField('member_access', []);
                                                    }
                                                }}
                                                className={`position-relative w-100 shadow-none border-2 ${!canManageScope ? 'opacity-50' : ''}`}
                                                style={{
                                                    cursor: canManageScope ? 'pointer' : 'not-allowed',
                                                    border: formData.scope === option.value ? `2px solid ${option.color}` : '1px solid #e2e8f0',
                                                    background: formData.scope === option.value ? option.bg : '#fff',
                                                    transition: 'all 0.15s ease',
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                <Card.Body className="d-flex align-items-center gap-3 p-3">
                                                    <div className="avatar-xs rounded-circle d-flex align-items-center justify-content-center" style={{ background: formData.scope === option.value ? option.color : '#f1f5f9', color: formData.scope === option.value ? '#fff' : '#64748b' }}>
                                                        <i className={option.icon}></i>
                                                    </div>
                                                    <div>
                                                        <div className={`fw-bold lh-sm ${formData.scope === option.value ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>{option.label}</div>
                                                    </div>
                                                    {formData.scope === option.value && (
                                                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                                            <i className="ri-checkbox-circle-fill fs-5" style={{ color: option.color }}></i>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>

                            {formData.scope === 'shared' && (
                                <div className="mb-4">
                                    <Form.Label className="fw-semibold small text-uppercase text-muted mb-2">{t("finance.budgets.fields.shared_members")}</Form.Label>
                                    <MemberAccessSelector
                                        members={members}
                                        value={formData.member_access}
                                        onChange={(val) => updateField('member_access', val)}
                                        ownerMemberId={formData.owner_member_id}
                                        activeMemberId={activeMemberId ? String(activeMemberId) : null}
                                        disabled={!canManageScope}
                                    />
                                </div>
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                {activeStep > 1 && (
                    <Button variant="light" onClick={() => setActiveStep(activeStep - 1)} className="me-auto" disabled={loading}>
                        <i className="ri-arrow-left-line me-2"></i> {t("finance.shared.back", { defaultValue: "Kembali" })}
                    </Button>
                )}
                {isEdit && canDelete && onDelete && activeStep === 1 && (
                    <Button variant="outline-danger" onClick={onDelete} disabled={loading} className="me-auto" data-testid="finance-budget-delete">
                        <i className="ri-delete-bin-line me-1"></i> {t("finance.shared.delete")}
                    </Button>
                )}
                {activeStep < 3 ? (
                    <Button variant="primary" onClick={handleNext} className="ms-auto" disabled={loading}>
                        {t("finance.shared.next", { defaultValue: "Selanjutnya" })} <i className="ri-arrow-right-line ms-2"></i>
                    </Button>
                ) : (
                    <Button variant="success" onClick={() => handleSubmit()} disabled={loading} className="ms-auto" data-testid="finance-budget-save">
                        <i className="ri-check-line me-2"></i>
                        {loading ? t("finance.shared.processing") : (isEdit ? t("finance.shared.update") : t("finance.shared.save"))}
                    </Button>
                )}
            </Modal.Footer>
            
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(value) => updateField('allocated_amount', value)}
                value={formData.allocated_amount}
                title={t("finance.calculator.budget_title")}
            />
        </Modal>
    );
};

export default BudgetModal;
