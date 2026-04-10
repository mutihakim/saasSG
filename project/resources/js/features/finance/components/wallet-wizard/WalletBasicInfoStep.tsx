import React from "react";
import { Card, Col, Form, Row } from "react-bootstrap";

import { FinanceAccount, FinanceWalletFormState } from "../../types";

type Props = {
    isSystemWallet: boolean;
    canManageScope: boolean;
    formData: FinanceWalletFormState;
    errors: Record<string, string>;
    accounts: FinanceAccount[];
    selectedAccountAllowsShared: boolean;
    updateField: (field: keyof FinanceWalletFormState, value: any) => void;
};

const WalletBasicInfoStep = ({
    isSystemWallet,
    canManageScope,
    formData,
    errors,
    accounts,
    selectedAccountAllowsShared,
    updateField,
}: Props) => (
    <div>
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
                onChange={(e) => updateField("name", e.target.value)}
                isInvalid={Boolean(errors.name)}
                placeholder="Contoh: Tabungan Liburan Bali"
                readOnly={isSystemWallet}
            />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            {isSystemWallet ? (
                <Form.Text className="text-muted">Nama wallet utama dikunci oleh sistem dan mengikuti account induknya.</Form.Text>
            ) : null}
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
                            <div className="fw-semibold mt-1">{formData.scope === "shared" ? "Shared" : "Private"}</div>
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
                                {accounts.find((account) => String(account.id) === String(formData.real_account_id))?.name || "-"}
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
                            updateField("real_account_id", nextAccountId);
                            if (nextAccount?.scope !== "shared" && formData.scope === "shared") {
                                updateField("scope", "private");
                            }
                        }}
                        isInvalid={Boolean(errors.real_account_id)}
                    >
                        <option value="">Pilih account...</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.real_account_id}</Form.Control.Feedback>
                </div>

                <div className="mb-3">
                    <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Access Scope</Form.Label>
                    <Row className="g-3">
                        {[
                            { value: "private", icon: "ri-lock-line", label: "Private", desc: "Hanya owner wallet yang memakai", disabled: false },
                            {
                                value: "shared",
                                icon: "ri-community-line",
                                label: "Shared",
                                desc: "Mengikuti owner dan akses dari account",
                                disabled: !selectedAccountAllowsShared || !canManageScope,
                            },
                        ].map((option) => (
                            <Col key={option.value} xs={6} className="d-flex">
                                <Card
                                    onClick={() => {
                                        if (option.disabled) return;
                                        updateField("scope", option.value);
                                    }}
                                    className={`position-relative w-100 shadow-none border-2 ${option.disabled ? "opacity-50" : ""}`}
                                    style={{
                                        cursor: option.disabled ? "not-allowed" : "pointer",
                                        border: formData.scope === option.value ? "2px solid #10b981" : "1px solid #e2e8f0",
                                        background: formData.scope === option.value ? "rgba(16, 185, 129, 0.08)" : "#fff",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                        borderRadius: "16px",
                                    }}
                                >
                                    <Card.Body className="d-flex flex-column align-items-center text-center p-3">
                                        <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ background: formData.scope === option.value ? "#10b981" : "#f1f5f9" }}>
                                            <i className={`${option.icon} fs-4`} style={{ color: formData.scope === option.value ? "#fff" : "#94a3b8" }}></i>
                                        </div>
                                        <div className={`fw-bold mt-1 ${formData.scope === option.value ? "text-dark" : "text-muted"}`} style={{ fontSize: "0.85rem" }}>
                                            {option.label}
                                        </div>
                                        <div className="text-muted mt-1 lh-sm" style={{ fontSize: "0.65rem" }}>
                                            {option.desc}
                                        </div>
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
                    {errors.scope ? <div className="text-danger small mt-2">{errors.scope}</div> : null}
                </div>

                <div className="mb-4">
                    <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Fungsi Wallet</Form.Label>
                    <Row className="g-3">
                        {[
                            { value: "spending", icon: "ri-shopping-bag-line", label: "Spending", desc: "Pengeluaran Harian", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
                            { value: "saving", icon: "ri-safe-2-line", label: "Saving", desc: "Tabungan Jangka Panjang", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
                            { value: "income", icon: "ri-money-dollar-circle-line", label: "Income", desc: "Kotak Masuk Pendapatan", color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" },
                        ].map((option) => (
                            <Col key={option.value} xs={4} className="d-flex">
                                <Card
                                    onClick={() => {
                                        updateField("purpose_type", option.value);
                                        if (option.value !== "spending") {
                                            updateField("default_budget_key", "");
                                            updateField("default_budget_id", "");
                                            updateField("budget_lock_enabled", false);
                                        }
                                    }}
                                    className="position-relative w-100 shadow-none border-2"
                                    style={{
                                        cursor: "pointer",
                                        border: formData.purpose_type === option.value ? `2px solid ${option.color}` : "1px solid #e2e8f0",
                                        background: formData.purpose_type === option.value ? option.bg : "#fff",
                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                        borderRadius: "16px",
                                    }}
                                >
                                    <Card.Body className="d-flex flex-column align-items-center text-center p-3">
                                        <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ background: formData.purpose_type === option.value ? option.color : "#f1f5f9" }}>
                                            <i className={`${option.icon} fs-4`} style={{ color: formData.purpose_type === option.value ? "#fff" : "#94a3b8" }}></i>
                                        </div>
                                        <div className={`fw-bold mt-1 ${formData.purpose_type === option.value ? "text-dark" : "text-muted"}`} style={{ fontSize: "0.85rem" }}>
                                            {option.label}
                                        </div>
                                        <div className="text-muted mt-1 lh-sm" style={{ fontSize: "0.65rem" }}>
                                            {option.desc}
                                        </div>
                                        {formData.purpose_type === option.value ? (
                                            <div className="position-absolute top-0 end-0 m-2">
                                                <i className="ri-checkbox-circle-fill text-success fs-5"></i>
                                            </div>
                                        ) : null}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {errors.purpose_type ? <div className="text-danger small mt-2">{errors.purpose_type}</div> : null}
                </div>
            </>
        )}

        {!isSystemWallet && formData.scope === "shared" ? (
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
        ) : null}
    </div>
);

export default WalletBasicInfoStep;
