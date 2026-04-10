import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Row, Col, InputGroup, Card, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { MemberAccessSelector, MemberAccessState } from "./MemberAccessSelector";

import MiniCalculator from "@/components/ui/MiniCalculator";
import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";


export interface AccountFormWizardProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (account?: any) => void;
    onDelete?: () => void;
    account?: any;
    seedAccount?: any;
    currencies: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    canDelete?: boolean;
    endpointBase?: string;
}

export const AccountFormWizard = ({ show, onClose, onSuccess, onDelete, account, seedAccount, currencies, members, activeMemberId, canManageShared = false, canDelete = false, endpointBase = "/finance/accounts" }: AccountFormWizardProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = Boolean(account);
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCalculator, setShowCalculator] = useState(false);
    
    const canManageScope = !isEdit || canManageShared || String(account?.owner_member_id) === String(activeMemberId);

    const [formData, setFormData] = useState({
        name: "",
        scope: "private" as "private" | "shared",
        type: "cash",
        currency_code: currencies[0]?.code ?? "IDR",
        owner_member_id: "",
        member_access: [] as MemberAccessState[],
        opening_balance: "0",
        notes: "",
        is_active: true,
        row_version: 1,
    });

    useEffect(() => {
        if (!show) {
            return;
        }

        const source = account || seedAccount;

        if (source) {
            const memberAccessArr = (source.member_access || source.memberAccess || []).map((m: any) => ({
                id: String(m.id),
                can_view: Boolean(m.pivot?.can_view),
                can_use: Boolean(m.pivot?.can_use),
                can_manage: Boolean(m.pivot?.can_manage),
            }));

            setFormData({
                name: source.name ?? "",
                scope: canManageScope ? source.scope ?? "private" : "private",
                type: source.type ?? "cash",
                currency_code: source.currency_code ?? currencies[0]?.code ?? "IDR",
                owner_member_id: canManageScope
                    ? (source.owner_member_id ? String(source.owner_member_id) : "")
                    : String(source.owner_member_id ?? activeMemberId ?? ""),
                member_access: memberAccessArr,
                opening_balance: String(source.opening_balance ?? "0"),
                notes: source.notes ?? "",
                is_active: source.is_active ?? true,
                row_version: source.row_version ?? 1,
            });
            setActiveStep(1);
            setErrors({});
            return;
        }

        setFormData({
            name: "",
            scope: "private",
            type: "cash",
            currency_code: currencies[0]?.code ?? "IDR",
            owner_member_id: activeMemberId ? String(activeMemberId) : "",
            member_access: [],
            opening_balance: "0",
            notes: "",
            is_active: true,
            row_version: 1,
        });
        setActiveStep(1);
        setErrors({});
    }, [show, account, seedAccount, currencies, activeMemberId, canManageScope]);

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
        if (!formData.name.trim()) newErrs.name = "Nama wajib diisi";
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

    const handleSubmit = async () => {
        if (activeStep === 1 && !validateStep1()) return;

        setLoading(true);

        try {
            const response = await axios({
                method: isEdit ? "patch" : "post",
                url: isEdit
                    ? tenantRoute.apiTo(`${endpointBase}/${account.id}`)
                    : tenantRoute.apiTo(endpointBase),
                data: {
                    ...formData,
                    owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
                    member_access: formData.scope === "shared" ? formData.member_access : [],
                    opening_balance: parseFloat(formData.opening_balance || "0"),
                },
            });

            notify.success(t(isEdit ? "finance.accounts.messages.updated" : "finance.accounts.messages.created", { defaultValue: isEdit ? "Akun berhasil diperbarui" : "Akun berhasil dibuat" }));
            onSuccess(response.data?.data?.account);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.accounts.messages.save_failed", { defaultValue: "Gagal menyimpan akun" }));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = [
        { number: 1, label: "Informasi Dasar", icon: "ri-bank-card-line" },
        { number: 2, label: "Saldo Dasar", icon: "ri-coins-line" },
        { number: 3, label: "Pengaturan & Akses", icon: "ri-shield-user-fill" },
    ];

    const typeOptions = [
        { value: 'cash', icon: 'ri-wallet-3-line', label: 'Tunai', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
        { value: 'bank', icon: 'ri-bank-line', label: 'Rekening Bank', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
        { value: 'ewallet', icon: 'ri-smartphone-line', label: 'E-Wallet', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
        { value: 'credit_card', icon: 'ri-mastercard-line', label: 'Kartu Kredit', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
        { value: 'paylater', icon: 'ri-time-line', label: 'Paylater / Pinjaman', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    ];

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title>
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar-xs bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                            <i className="ri-bank-card-line text-primary fs-5"></i>
                        </div>
                        <div>
                            <div className="fw-semibold">{isEdit ? t("finance.accounts.modal.edit_title", { defaultValue: "Edit Real Account" }) : t("finance.accounts.modal.add_title", { defaultValue: "Tambah Real Account" })}</div>
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                Real account adalah sumber dana (kas fisik, rekening bank terdaftar)
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
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Nama Akun</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    isInvalid={Boolean(errors.name)}
                                    placeholder="Contoh: BCA Budi, Tunai Harian, CC Mandiri"
                                />
                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Tipe Akun</Form.Label>
                                <Row className="g-3">
                                    {typeOptions.map(option => (
                                        <Col key={option.value} xs={4} className="d-flex">
                                            <Card
                                                onClick={() => updateField('type', option.value)}
                                                className="position-relative w-100 shadow-none border-2"
                                                style={{
                                                    cursor: 'pointer',
                                                    border: formData.type === option.value ? `2px solid ${option.color}` : '1px solid #e2e8f0',
                                                    background: formData.type === option.value ? option.bg : '#fff',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    borderRadius: '16px'
                                                }}
                                            >
                                                <Card.Body className="d-flex flex-column align-items-center text-center p-3">
                                                    <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ background: formData.type === option.value ? option.color : '#f1f5f9' }}>
                                                        <i className={`${option.icon} fs-4`} style={{ color: formData.type === option.value ? '#fff' : '#94a3b8' }}></i>
                                                    </div>
                                                    <div className={`fw-bold mt-1 ${formData.type === option.value ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>{option.label}</div>
                                                    {formData.type === option.value && (
                                                        <div className="position-absolute top-0 end-0 m-2">
                                                            <i className="ri-checkbox-circle-fill text-success fs-5"></i>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                                <Form.Text className="text-muted d-block mt-2">
                                    {["credit_card", "paylater"].includes(formData.type)
                                        ? "Akun pinjaman ini memperbolehkan saldo negatif atau hutang berjalan."
                                        : "Akun tunai/bank. Tidak boleh bersaldo negatif."}
                                </Form.Text>
                            </div>
                        </Tab.Pane>

                        {/* STEP 2 */}
                        <Tab.Pane eventKey="2">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Mata Uang Basis</Form.Label>
                                <Form.Select
                                    value={formData.currency_code}
                                    onChange={(e) => updateField('currency_code', e.target.value || "IDR")}
                                >
                                    {currencies.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.code} - {currency.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <Form.Label className="fw-semibold small text-uppercase text-muted m-0">Saldo Awal</Form.Label>
                                    <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={() => setShowCalculator(true)}>
                                        <i className="ri-calculator-line" /> Kalkulator
                                    </Button>
                                </div>
                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        pattern="[0-9]*"
                                        value={formData.opening_balance}
                                        onChange={(e) => updateField('opening_balance', e.target.value)}
                                        readOnly={showCalculator}
                                    />
                                    <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                                        <i className="ri-calculator-line" />
                                    </Button>
                                </InputGroup>
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
                                                    <div className="fw-semibold">Status Aktif</div>
                                                    <div className="small text-muted">Akun aktif bisa digunakan untuk transaksi</div>
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
                        </Tab.Pane>

                        {/* STEP 3 */}
                        <Tab.Pane eventKey="3">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Owner Akun</Form.Label>
                                <Form.Select
                                    value={formData.owner_member_id}
                                    onChange={(e) => updateField('owner_member_id', e.target.value)}
                                    disabled={!canManageScope}
                                >
                                    <option value="">Tanpa owner</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={String(member.id)}>
                                            {member.full_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    {formData.scope === "shared"
                                        ? "Pindah owner tidak mengubah scope shared. Owner lama akan tetap jadi manager sampai dihapus manual dari akses."
                                        : "Pindah owner tidak akan membuat akun private menjadi shared."}
                                </Form.Text>
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Tipe Akses (Scope)</Form.Label>
                                <Row className="g-3">
                                    {[
                                        { value: 'private', icon: 'ri-user-line', label: 'Private', desc: 'Hanya Anda', color: '#64748b', bg: '#f8fafc' },
                                        { value: 'shared', icon: 'ri-team-line', label: 'Shared', desc: 'Bisa Buka Akses', color: '#3b82f6', bg: '#eff6ff' },
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

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Catatan (Opsional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    placeholder="Informasi tambahan untuk akun ini..."
                                />
                            </div>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                {activeStep > 1 && (
                    <Button variant="light" onClick={() => setActiveStep(activeStep - 1)} className="me-auto" disabled={loading}>
                        <i className="ri-arrow-left-line me-2"></i> Kembali
                    </Button>
                )}
                {isEdit && canDelete && onDelete && activeStep === 1 && (
                    <Button variant="outline-danger" onClick={onDelete} disabled={loading} className="me-auto">
                        <i className="ri-delete-bin-line me-1"></i> Hapus
                    </Button>
                )}
                {activeStep < 3 ? (
                    <Button variant="primary" onClick={handleNext} className="ms-auto" disabled={loading}>
                        Selanjutnya <i className="ri-arrow-right-line ms-2"></i>
                    </Button>
                ) : (
                    <Button variant="success" onClick={handleSubmit} disabled={loading} className="ms-auto">
                        <i className="ri-check-line me-2"></i>
                        {loading ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Simpan Akun")}
                    </Button>
                )}
            </Modal.Footer>
            
            <MiniCalculator
                show={showCalculator}
                onClose={() => setShowCalculator(false)}
                onCommit={(val) => updateField('opening_balance', val)}
                value={formData.opening_balance}
                currencyCode={formData.currency_code}
                title="Kalkulator Saldo"
            />
        </Modal>
    );
};

export default AccountFormWizard;
