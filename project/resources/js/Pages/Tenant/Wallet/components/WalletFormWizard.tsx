import React, { useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, Modal, Row, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinanceBudget, FinanceCurrency, FinanceMember, FinancePocket } from "../../Finance/types";
import { WalletFormState } from "../types";

type Props = {
    show: boolean;
    onHide: () => void;
    onSave: (values: WalletFormState) => Promise<void>;
    saving: boolean;
    wallet: FinancePocket | null;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    members: FinanceMember[];
    currencies: FinanceCurrency[];
    activeMemberId?: number | null;
};

const iconOptions = [
    { value: 'ri-shopping-bag-line', label: 'Belanja' },
    { value: 'ri-restaurant-line', label: 'Makan' },
    { value: 'ri-car-line', label: 'Transport' },
    { value: 'ri-t-shirt-line', label: 'Fashion' },
    { value: 'ri-movie-2-line', label: 'Hiburan' },
    { value: 'ri-home-4-line', label: 'Rumah' },
    { value: 'ri-safe-2-line', label: 'Tabungan' },
    { value: 'ri-plane-line', label: 'Travel' },
    { value: 'ri-hand-heart-line', label: 'Ibadah' },
    { value: 'ri-macbook-line', label: 'Gadget' },
    { value: 'ri-briefcase-4-line', label: 'Bisnis' },
    { value: 'ri-heart-line', label: 'Kesehatan' },
];

const colorOptions = [
    '#fef08a', '#06b6d4', '#fbcfe8', '#86efac', '#fcd34d', '#93c5fd',
    '#c4b5fd', '#ffedd5', '#e2e8f0', '#f87171', '#fb923c', '#a3e635'
];

const WalletFormWizard = ({
    show,
    onHide,
    onSave,
    saving,
    wallet,
    accounts,
    budgets,
    members,
    currencies,
    activeMemberId,
}: Props) => {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEdit = Boolean(wallet);

    const [formData, setFormData] = useState<WalletFormState>(() => {
        if (wallet) {
            return {
                name: wallet.name || "",
                type: (wallet.type as WalletFormState["type"]) || "personal",
                purpose_type: (wallet.purpose_type as WalletFormState["purpose_type"]) || "spending",
                scope: wallet.scope || "private",
                real_account_id: wallet.real_account_id || wallet.real_account?.id || "",
                owner_member_id: wallet.owner_member_id ? String(wallet.owner_member_id) : (activeMemberId ? String(activeMemberId) : ""),
                default_budget_id: wallet.default_budget_id ? String(wallet.default_budget_id) : "",
                default_budget_key: wallet.default_budget_key ? String(wallet.default_budget_key) : "",
                budget_lock_enabled: Boolean(wallet.budget_lock_enabled),
                icon_key: wallet.icon_key || "ri-wallet-3-line",
                notes: wallet.notes || "",
                background_color: wallet.background_color || "#fef08a",
                row_version: wallet.row_version || 1,
            };
        }

        return {
            name: "",
            type: "personal",
            purpose_type: "spending",
            scope: "private",
            real_account_id: accounts[0]?.id || "",
            owner_member_id: activeMemberId ? String(activeMemberId) : (members[0] ? String(members[0].id) : ""),
            default_budget_id: "",
            default_budget_key: "",
            budget_lock_enabled: false,
            icon_key: "ri-wallet-3-line",
            notes: "",
            background_color: "#fef08a",
            row_version: 1,
        };
    });

    const walletBudgetOptions = useMemo(() => {
        return budgets
            .filter((budget) => {
                if (!budget || budget.is_active === false) return false;
                
                // For shared wallets, only show shared budgets
                if (formData.scope === "shared") {
                    return budget.scope === "shared";
                }
                
                // For private wallets, show all active budgets
                return true;
            })
            .filter((budget, index, self) => {
                // Remove duplicates by budget_key/code/id
                const identifier = String(budget.budget_key || budget.code || budget.id);
                if (!identifier) return false;
                return index === self.findIndex(b => 
                    String(b.budget_key || b.code || b.id) === identifier
                );
            });
    }, [budgets, formData.scope]);

    const updateField = (field: keyof WalletFormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        
        // Auto-set scope based on type
        if (field === 'type') {
            const autoScope = value === 'shared' ? 'shared' : 'private';
            setFormData((prev) => ({ ...prev, scope: autoScope }));
        }
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 3) {
            newErrors.name = "Nama wallet minimal 3 karakter";
        }

        if (!formData.type || !["personal", "business", "shared"].includes(formData.type)) {
            newErrors.type = "Tipe wallet wajib dipilih";
        }

        if (!formData.purpose_type || !["spending", "saving", "income"].includes(formData.purpose_type)) {
            newErrors.purpose_type = "Fungsi wallet wajib dipilih";
        }

        if (!formData.real_account_id) {
            newErrors.real_account_id = "Source account wajib dipilih";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 1) {
            if (validateStep1()) {
                setActiveStep(2);
            }
        } else if (activeStep === 2) {
            setActiveStep(3);
        }
    };

    const handleBack = () => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleSubmit = async () => {
        await onSave(formData);
    };

    const handleModalHide = () => {
        setActiveStep(1);
        setErrors({});
        // Reset form data to initial values
        if (wallet) {
            setFormData({
                name: wallet.name || "",
                type: (wallet.type as WalletFormState["type"]) || "personal",
                purpose_type: (wallet.purpose_type as WalletFormState["purpose_type"]) || "spending",
                scope: wallet.scope || "private",
                real_account_id: wallet.real_account_id || wallet.real_account?.id || "",
                owner_member_id: wallet.owner_member_id ? String(wallet.owner_member_id) : (activeMemberId ? String(activeMemberId) : ""),
                default_budget_id: wallet.default_budget_id ? String(wallet.default_budget_id) : "",
                default_budget_key: wallet.default_budget_key ? String(wallet.default_budget_key) : "",
                budget_lock_enabled: Boolean(wallet.budget_lock_enabled),
                icon_key: wallet.icon_key || "ri-wallet-3-line",
                notes: wallet.notes || "",
                background_color: wallet.background_color || "#fef08a",
                row_version: wallet.row_version || 1,
            });
        }
        onHide();
    };

    const stepTitles = [
        { number: 1, label: "Informasi Dasar", icon: "ri-file-list-3-line" },
        { number: 2, label: "Budget Default", icon: "ri-bank-card-line" },
        { number: 3, label: "Personalisasi", icon: "ri-palette-line" },
    ];

    return (
        <Modal show={show} onHide={handleModalHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title>
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar-xs bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                            <i className="ri-wallet-3-line text-primary fs-5"></i>
                        </div>
                        <div>
                            <div className="fw-semibold">{t(isEdit ? "wallet.modal.edit_wallet" : "wallet.modal.add_wallet", { defaultValue: isEdit ? "Edit Wallet" : "Tambah Wallet Baru" })}</div>
                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                {isEdit ? "Ubah pengaturan wallet" : "Buat wallet baru untuk kategori"}
                            </div>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-0">
                {/* Progress Steps */}
                <div className="mb-4 mt-3">
                    <div className="d-flex justify-content-between align-items-center position-relative">
                        {/* Progress Line Background */}
                        <div className="position-absolute top-50 start-0 w-100 translate-middle-y" style={{ height: '2px', background: '#e2e8f0', zIndex: 0 }} />
                        
                        {/* Progress Line Active */}
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

                        {stepTitles.map((step, idx) => {
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
                        {/* STEP 1: Basic Information */}
                        <Tab.Pane eventKey="1">
                            <div className="mb-3">
                                <h6 className="fw-bold mb-1">
                                    <i className="ri-file-list-3-line text-primary me-2"></i>
                                    Informasi Dasar
                                </h6>
                                <p className="text-muted small mb-3">Isi informasi dasar wallet yang akan dibuat</p>
                            </div>

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Nama Wallet</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    isInvalid={Boolean(errors.name)}
                                    placeholder="Contoh: Tabungan Liburan Bali"
                                />
                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Tipe Wallet</Form.Label>
                                <Row className="g-3">
                                    {[
                                        { value: 'personal', icon: 'ri-user-line', label: 'Personal', desc: 'Untuk penggunaan pribadi', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
                                        { value: 'business', icon: 'ri-briefcase-4-line', label: 'Bisnis', desc: 'Untuk kegiatan bisnis', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
                                        { value: 'shared', icon: 'ri-team-line', label: 'Shared', desc: 'Bisa diakses bersama', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                                    ].map(option => (
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
                                                    <div className="text-muted mt-1 lh-sm" style={{ fontSize: '0.65rem' }}>{option.desc}</div>
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
                                {errors.type && <div className="text-danger small mt-2">{errors.type}</div>}
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Fungsi Wallet</Form.Label>
                                <Row className="g-3">
                                    {[
                                        { value: 'spending', icon: 'ri-shopping-bag-line', label: 'Spending', desc: 'Pengeluaran Harian', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
                                        { value: 'saving', icon: 'ri-safe-2-line', label: 'Saving', desc: 'Tabungan Jangka Panjang', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
                                        { value: 'income', icon: 'ri-money-dollar-circle-line', label: 'Income', desc: 'Kotak Masuk Pendapatan', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
                                    ].map(option => (
                                        <Col key={option.value} xs={4} className="d-flex">
                                            <Card
                                                onClick={() => {
                                                    updateField('purpose_type', option.value);
                                                    // Reset budget if not spending
                                                    if (option.value !== 'spending') {
                                                        updateField('default_budget_key', '');
                                                        updateField('default_budget_id', '');
                                                        updateField('budget_lock_enabled', false);
                                                    }
                                                }}
                                                className="position-relative w-100 shadow-none border-2"
                                                style={{
                                                    cursor: 'pointer',
                                                    border: formData.purpose_type === option.value ? `2px solid ${option.color}` : '1px solid #e2e8f0',
                                                    background: formData.purpose_type === option.value ? option.bg : '#fff',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    borderRadius: '16px'
                                                }}
                                            >
                                                <Card.Body className="d-flex flex-column align-items-center text-center p-3">
                                                    <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ background: formData.purpose_type === option.value ? option.color : '#f1f5f9' }}>
                                                        <i className={`${option.icon} fs-4`} style={{ color: formData.purpose_type === option.value ? '#fff' : '#94a3b8' }}></i>
                                                    </div>
                                                    <div className={`fw-bold mt-1 ${formData.purpose_type === option.value ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>{option.label}</div>
                                                    <div className="text-muted mt-1 lh-sm" style={{ fontSize: '0.65rem' }}>{option.desc}</div>
                                                    {formData.purpose_type === option.value && (
                                                        <div className="position-absolute top-0 end-0 m-2">
                                                            <i className="ri-checkbox-circle-fill text-success fs-5"></i>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                                {errors.purpose_type && <div className="text-danger small mt-2">{errors.purpose_type}</div>}
                            </div>

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Source Account</Form.Label>
                                <Form.Select
                                    value={formData.real_account_id}
                                    onChange={(e) => updateField('real_account_id', e.target.value)}
                                    isInvalid={Boolean(errors.real_account_id)}
                                >
                                    <option value="">Pilih account...</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{errors.real_account_id}</Form.Control.Feedback>
                            </div>
                        </Tab.Pane>

                        {/* STEP 2: Budget Configuration */}
                        <Tab.Pane eventKey="2">
                            {formData.purpose_type !== 'spending' ? (
                                <Card className="border-0 bg-light">
                                    <Card.Body className="text-center py-4">
                                        <i className="ri-information-line fs-1 text-muted mb-2 d-block"></i>
                                        <div className="text-muted small">
                                            Budget default hanya tersedia untuk wallet dengan fungsi <strong>Spending</strong>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Budget Default (Opsional)</Form.Label>
                                        <Form.Select
                                            value={formData.default_budget_key}
                                            onChange={(e) => {
                                                const selectedBudget = walletBudgetOptions.find(b => String(b.budget_key || b.code || b.id) === e.target.value);
                                                updateField('default_budget_key', e.target.value);
                                                updateField('default_budget_id', selectedBudget?.id ? String(selectedBudget.id) : '');
                                            }}
                                        >
                                            <option value="">— Tidak ada —</option>
                                            {walletBudgetOptions.map((budget) => {
                                                const budgetIdentifier = String(budget.budget_key || budget.code || budget.name);
                                                return (
                                                    <option key={budget.id} value={budgetIdentifier}>
                                                        {budget.name} · {budget.period_month}
                                                    </option>
                                                );
                                            })}
                                        </Form.Select>
                                        <Form.Text className="text-muted small">
                                            Akan otomatis terpilih saat transaksi, tapi masih bisa diganti.
                                        </Form.Text>
                                    </div>

                                    {formData.default_budget_key && (
                                        <div className="mb-4">
                                            <Card
                                                className="border-0"
                                                style={{
                                                    background: formData.budget_lock_enabled ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(6, 182, 212, 0.05))' : '#fff',
                                                    border: formData.budget_lock_enabled ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                <Card.Body className="p-4">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                                                <i className="ri-lock-line text-primary fs-5"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">Kunci Budget ke Wallet Ini</div>
                                                                <div className="small text-muted">Jika aktif, budget ini menjadi wajib dan tidak bisa diganti saat transaksi</div>
                                                            </div>
                                                        </div>
                                                        <Form.Check
                                                            type="switch"
                                                            checked={formData.budget_lock_enabled}
                                                            onChange={(e) => updateField('budget_lock_enabled', e.target.checked)}
                                                            className="mb-0"
                                                            style={{ transform: 'scale(1.3)' }}
                                                        />
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    )}
                                </>
                            )}
                        </Tab.Pane>

                        {/* STEP 3: Personalization */}
                        <Tab.Pane eventKey="3">
                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Icon Wallet</Form.Label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                    {iconOptions.map(icon => (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            className="d-flex flex-column align-items-center justify-content-center position-relative border-0"
                                            style={{
                                                padding: '8px 4px',
                                                background: formData.icon_key === icon.value ? 'rgba(59, 130, 246, 0.1)' : '#f8f9fa',
                                                border: formData.icon_key === icon.value ? '2px solid #3b82f6' : '1px solid #dee2e6',
                                                borderRadius: '8px',
                                                transition: 'all 0.15s ease',
                                                minHeight: '56px'
                                            }}
                                            onClick={() => updateField('icon_key', icon.value)}
                                        >
                                            <i className={`${icon.value}`} style={{ fontSize: '1.2rem', color: formData.icon_key === icon.value ? '#3b82f6' : '#64748b' }} />
                                            <small style={{ fontSize: '0.55rem', color: formData.icon_key === icon.value ? '#3b82f6' : '#94a3b8', marginTop: '2px' }}>{icon.label}</small>
                                            {formData.icon_key === icon.value && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    right: '-6px',
                                                    background: '#3b82f6',
                                                    color: '#fff',
                                                    borderRadius: '50%',
                                                    width: '16px',
                                                    height: '16px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}>✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Warna Kartu</Form.Label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className="position-relative border-0"
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                background: color,
                                                border: formData.background_color === color ? '3px solid #3b82f6' : '2px solid rgba(0,0,0,0.08)',
                                                borderRadius: '8px',
                                                transition: 'all 0.15s ease',
                                                transform: formData.background_color === color ? 'scale(1.1)' : 'scale(1)',
                                                boxShadow: formData.background_color === color ? '0 4px 8px rgba(59, 130, 246, 0.3)' : 'none'
                                            }}
                                            onClick={() => updateField('background_color', color)}
                                        >
                                            {formData.background_color === color && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: '#fff',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                                }}>✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Catatan (Opsional)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    placeholder="Tambahkan catatan untuk wallet ini..."
                                />
                            </div>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                {activeStep > 1 && (
                    <Button variant="light" onClick={handleBack} className="me-auto">
                        <i className="ri-arrow-left-line me-2"></i>
                        Kembali
                    </Button>
                )}
                {activeStep < 3 ? (
                    <Button variant="primary" onClick={handleNext} className="ms-auto">
                        Selanjutnya
                        <i className="ri-arrow-right-line ms-2"></i>
                    </Button>
                ) : (
                    <Button variant="success" onClick={handleSubmit} disabled={saving} className="ms-auto">
                        <i className="ri-check-line me-2"></i>
                        {saving ? "Menyimpan..." : (isEdit ? "Simpan Perubahan" : "Buat Wallet")}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default WalletFormWizard;
