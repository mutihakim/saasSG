import React, { useMemo, useState } from "react";
import { Button, Card, Col, Form, Modal, Row, Tab } from "react-bootstrap";
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
    canManageShared?: boolean;
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

const typeSuggestions = [
    { value: "personal", icon: "ri-user-line", label: "Personal", desc: "Dompet pribadi harian" },
    { value: "business", icon: "ri-briefcase-4-line", label: "Business", desc: "Operasional bisnis" },
    { value: "family", icon: "ri-home-heart-line", label: "Family", desc: "Kebutuhan keluarga" },
    { value: "project", icon: "ri-kanban-view-2-line", label: "Project", desc: "Pos proyek atau event" },
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
    currencies: _currencies,
    activeMemberId,
    canManageShared = false,
}: Props) => {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEdit = Boolean(wallet);
    const isSystemWallet = Boolean(wallet?.is_system);
    const canManageScope = !isEdit || canManageShared || String(wallet?.owner_member_id) === String(activeMemberId);

    const buildFormState = (sourceWallet?: FinancePocket | null): WalletFormState => {
        if (sourceWallet) {
            return {
                name: sourceWallet.name || "",
                type: sourceWallet.is_system ? "personal" : (sourceWallet.type || "personal"),
                purpose_type: (sourceWallet.purpose_type as WalletFormState["purpose_type"]) || "spending",
                scope: sourceWallet.scope || "private",
                real_account_id: sourceWallet.real_account_id || sourceWallet.real_account?.id || "",
                owner_member_id: sourceWallet.owner_member_id ? String(sourceWallet.owner_member_id) : (activeMemberId ? String(activeMemberId) : ""),
                default_budget_id: sourceWallet.default_budget_id ? String(sourceWallet.default_budget_id) : "",
                default_budget_key: sourceWallet.default_budget_key ? String(sourceWallet.default_budget_key) : "",
                budget_lock_enabled: Boolean(sourceWallet.budget_lock_enabled),
                icon_key: sourceWallet.icon_key || "ri-wallet-3-line",
                notes: sourceWallet.notes || "",
                background_color: sourceWallet.background_color || "#fef08a",
                row_version: sourceWallet.row_version || 1,
                member_access: ((sourceWallet as any).member_access || (sourceWallet as any).memberAccess || []).map((m: any) => ({
                    id: String(m.id),
                    can_view: Boolean(m.pivot?.can_view),
                    can_use: Boolean(m.pivot?.can_use),
                    can_manage: Boolean(m.pivot?.can_manage),
                })),
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
            member_access: [],
        };
    };

    const [formData, setFormData] = useState<WalletFormState>(() => buildFormState(wallet));

    const selectedAccount = useMemo(
        () => accounts.find((account) => String(account.id) === String(formData.real_account_id)) || null,
        [accounts, formData.real_account_id]
    );
    const selectedAccountAllowsShared = selectedAccount?.scope === "shared";

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
        if (isSystemWallet) {
            setErrors({});

            return true;
        }

        const newErrors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 3) {
            newErrors.name = "Nama wallet minimal 3 karakter";
        }

        if (!formData.purpose_type || !["spending", "saving", "income"].includes(formData.purpose_type)) {
            newErrors.purpose_type = "Fungsi wallet wajib dipilih";
        }

        if (!formData.real_account_id) {
            newErrors.real_account_id = "Source account wajib dipilih";
        }

        if (formData.scope === "shared" && !selectedAccountAllowsShared) {
            newErrors.scope = "Wallet shared hanya bisa dibuat di account shared";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        if (isSystemWallet) {
            return true;
        }

        const newErrors: Record<string, string> = {};

        if (!formData.type || formData.type.trim().length < 2) {
            newErrors.type = "Konteks wallet minimal 2 karakter";
        }

        setErrors((prev) => ({ ...prev, ...newErrors }));

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
        if (!validateStep3()) {
            return;
        }

        await onSave(formData);
    };

    const handleModalHide = () => {
        setActiveStep(1);
        setErrors({});
        // Reset form data to initial values
        setFormData(buildFormState(wallet));
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
                        {/* STEP 1: Basic Information */}
                        <Tab.Pane eventKey="1">
                            <div className="mb-3">
                                <h6 className="fw-bold mb-1">
                                    <i className="ri-file-list-3-line text-primary me-2"></i>
                                    Informasi Dasar
                                </h6>
                                <p className="text-muted small mb-3">
                                    {isSystemWallet
                                        ? "Wallet utama mewarisi struktur penting dari account induknya. Pengaturan di halaman ini hanya untuk konfigurasi yang aman."
                                        : "Isi informasi dasar wallet yang akan dibuat"}
                                </p>
                            </div>

                            <div className="mb-3">
                                <Form.Label className="fw-semibold small text-uppercase text-muted">Nama Wallet</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    isInvalid={Boolean(errors.name)}
                                    placeholder="Contoh: Tabungan Liburan Bali"
                                    readOnly={isSystemWallet}
                                />
                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                {isSystemWallet && (
                                    <Form.Text className="text-muted">
                                        Nama wallet utama dikunci oleh sistem dan mengikuti account induknya.
                                    </Form.Text>
                                )}
                            </div>

                            {isSystemWallet ? (
                                <div className="row g-3">
                                    <div className="col-6">
                                        <Card className="border-0 bg-light h-100">
                                            <Card.Body className="p-3">
                                                <div className="small text-muted text-uppercase">Tipe</div>
                                                <div className="fw-semibold mt-1">Main System Wallet</div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                    <div className="col-6">
                                        <Card className="border-0 bg-light h-100">
                                            <Card.Body className="p-3">
                                                <div className="small text-muted text-uppercase">Scope</div>
                                                <div className="fw-semibold mt-1">{formData.scope === 'shared' ? 'Shared' : 'Private'}</div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                    <div className="col-6">
                                        <Card className="border-0 bg-light h-100">
                                            <Card.Body className="p-3">
                                                <div className="small text-muted text-uppercase">Fungsi</div>
                                                <div className="fw-semibold mt-1">Spending</div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                    <div className="col-6">
                                        <Card className="border-0 bg-light h-100">
                                            <Card.Body className="p-3">
                                                <div className="small text-muted text-uppercase">Source Account</div>
                                                <div className="fw-semibold mt-1">
                                                    {accounts.find((account) => String(account.id) === String(formData.real_account_id))?.name || '-'}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                    <div className="col-12">
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="p-3">
                                                <div className="small text-muted">
                                                    Wallet utama mengikuti account induknya untuk nama, akses anggota, owner, scope, status, dan account sumber.
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Source Account</Form.Label>
                                        <Form.Select
                                            value={formData.real_account_id}
                                            onChange={(e) => {
                                                const nextAccountId = e.target.value;
                                                const nextAccount = accounts.find((account) => String(account.id) === String(nextAccountId));
                                                updateField('real_account_id', nextAccountId);
                                                if (nextAccount?.scope !== 'shared' && formData.scope === 'shared') {
                                                    updateField('scope', 'private');
                                                }
                                            }}
                                            isInvalid={Boolean(errors.real_account_id)}
                                        >
                                            <option value="">Pilih account...</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>{account.name}</option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">{errors.real_account_id}</Form.Control.Feedback>
                                    </div>

                                    <div className="mb-3">
                                        <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Access Scope</Form.Label>
                                        <Row className="g-3">
                                            {[
                                                { value: 'private', icon: 'ri-lock-line', label: 'Private', desc: 'Hanya owner wallet yang memakai', disabled: false },
                                                { value: 'shared', icon: 'ri-community-line', label: 'Shared', desc: 'Mengikuti owner dan akses dari account', disabled: !selectedAccountAllowsShared || !canManageScope },
                                            ].map((option) => (
                                                <Col key={option.value} xs={6} className="d-flex">
                                                    <Card
                                                        onClick={() => {
                                                            if (option.disabled) return;
                                                            updateField('scope', option.value);
                                                        }}
                                                        className={`position-relative w-100 shadow-none border-2 ${option.disabled ? 'opacity-50' : ''}`}
                                                        style={{
                                                            cursor: option.disabled ? 'not-allowed' : 'pointer',
                                                            border: formData.scope === option.value ? '2px solid #10b981' : '1px solid #e2e8f0',
                                                            background: formData.scope === option.value ? 'rgba(16, 185, 129, 0.08)' : '#fff',
                                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            borderRadius: '16px'
                                                        }}
                                                    >
                                                        <Card.Body className="d-flex flex-column align-items-center text-center p-3">
                                                            <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ background: formData.scope === option.value ? '#10b981' : '#f1f5f9' }}>
                                                                <i className={`${option.icon} fs-4`} style={{ color: formData.scope === option.value ? '#fff' : '#94a3b8' }}></i>
                                                            </div>
                                                            <div className={`fw-bold mt-1 ${formData.scope === option.value ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>{option.label}</div>
                                                            <div className="text-muted mt-1 lh-sm" style={{ fontSize: '0.65rem' }}>{option.desc}</div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                        <Form.Text className="text-muted d-block mt-2">
                                            {selectedAccountAllowsShared
                                                ? "Wallet shared akan mengikuti owner dan member akses account induknya."
                                                : "Account sumber ini private, jadi wallet di bawahnya hanya boleh private."}
                                        </Form.Text>
                                        {errors.scope && <div className="text-danger small mt-2">{errors.scope}</div>}
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
                                </>
                            )}

                            {!isSystemWallet && formData.scope === 'shared' && (
                                <Card className="border-0 bg-light mt-4">
                                    <Card.Body className="p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <div className="avatar-xs bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                                <i className="ri-community-line text-info fs-5"></i>
                                            </div>
                                            <div className="fw-semibold">Akses anggota mengikuti account</div>
                                        </div>
                                        <div className="small text-muted">
                                            Wallet shared tidak memiliki daftar anggota sendiri. Owner dan member akses akan selalu mengikuti account sumber yang dipilih.
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
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
                                            Akan otomatis terpilih saat transaksi, tapi masih bisa diganti. Wallet shared hanya dapat memakai budget shared, sedangkan wallet private mengikuti semua budget aktif yang bisa Anda akses.
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
                            {!isSystemWallet && (
                                <div className="mb-4">
                                    <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Konteks Wallet</Form.Label>
                                    <Row className="g-2">
                                        {typeSuggestions.map((option) => (
                                            <Col key={option.value} xs={3} className="d-flex">
                                                <Card
                                                    onClick={() => {
                                                        updateField('type', option.value);
                                                    }}
                                                    className="position-relative w-100 shadow-none border-2"
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: formData.type === option.value ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                                        background: formData.type === option.value ? 'rgba(14, 165, 233, 0.08)' : '#fff',
                                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        borderRadius: '14px'
                                                    }}
                                                >
                                                    <Card.Body className="d-flex flex-column align-items-center text-center px-2 py-3">
                                                        <div className="avatar-xs rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: 34, height: 34, background: formData.type === option.value ? '#0ea5e9' : '#f1f5f9' }}>
                                                            <i className={`${option.icon}`} style={{ color: formData.type === option.value ? '#fff' : '#94a3b8', fontSize: '1rem' }}></i>
                                                        </div>
                                                        <div className={`fw-bold ${formData.type === option.value ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.72rem', lineHeight: 1.15 }}>{option.label}</div>
                                                        {formData.type === option.value && (
                                                            <div className="position-absolute top-0 end-0 m-1">
                                                                <i className="ri-checkbox-circle-fill text-success fs-6"></i>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Form.Control
                                        className="mt-3"
                                        list="wallet-type-suggestions"
                                        value={formData.type}
                                        onChange={(e) => updateField('type', e.target.value)}
                                        placeholder="Tulis konteks wallet. Mis. Travel, Operasional, Sekolah"
                                        isInvalid={Boolean(errors.type)}
                                        maxLength={50}
                                    />
                                    <datalist id="wallet-type-suggestions">
                                        {typeSuggestions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </datalist>
                                    <Form.Text className="text-muted">
                                        Konteks wallet bebas. Pilih salah satu kartu di atas atau tulis sendiri.
                                    </Form.Text>
                                    {errors.type && <div className="text-danger small mt-2">{errors.type}</div>}
                                </div>
                            )}

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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 28px)', gap: '10px', justifyContent: 'start' }}>
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className="position-relative border-0"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                background: color,
                                                border: formData.background_color === color ? '2px solid #2563eb' : '1.5px solid rgba(15,23,42,0.12)',
                                                borderRadius: '999px',
                                                transition: 'all 0.15s ease',
                                                transform: formData.background_color === color ? 'scale(1.08)' : 'scale(1)',
                                                boxShadow: formData.background_color === color ? '0 0 0 3px rgba(37, 99, 235, 0.16)' : 'none'
                                            }}
                                            onClick={() => updateField('background_color', color)}
                                            aria-label={`Pilih warna ${color}`}
                                            title={color}
                                        >
                                            {formData.background_color === color && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                                }}>✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!isSystemWallet && (
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
                            )}
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
