import React, { useMemo, useState } from "react";
import { Button, Card, Col, Form, Modal, Row, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceWallet, FinanceSavingsGoal } from "../types";
import { FinanceGoalFormState } from "../types";

type Props = {
    show: boolean;
    onHide: () => void;
    onSave: (values: FinanceGoalFormState) => Promise<void>;
    saving: boolean;
    goal: FinanceSavingsGoal | null;
    wallets: FinanceWallet[];
};

const formatCurrency = (value: string | number | null | undefined, currency = "IDR") =>
    `${currency} ${Number(value || 0).toLocaleString("id-ID")}`;

const GoalFormWizard = ({ show, onHide, onSave, saving, goal, wallets }: Props) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEdit = Boolean(goal);

    const [formData, setFormData] = useState<FinanceGoalFormState>({
        wallet_id: goal?.wallet_id || wallets.find((wallet) => !wallet.is_system)?.id || wallets[0]?.id || "",
        name: goal?.name || "",
        target_amount: goal?.target_amount ? String(goal.target_amount) : "",
        target_date: goal?.target_date || "",
        status: goal?.status || "active",
        notes: goal?.notes || "",
        row_version: goal?.row_version || 1,
    });

    const selectedWallet = useMemo(
        () => wallets.find((wallet) => String(wallet.id) === String(formData.wallet_id)) ?? null,
        [formData.wallet_id, wallets],
    );

    const remainingAmount = Math.max(Number(formData.target_amount || 0) - Number(goal?.current_amount || 0), 0);

    const updateField = (field: keyof FinanceGoalFormState, value: FinanceGoalFormState[keyof FinanceGoalFormState]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }

            const next = { ...prev };
            delete next[field];

            return next;
        });
    };

    const validateStep1 = () => {
        const nextErrors: Record<string, string> = {};

        if (!formData.name || formData.name.trim().length < 3) {
            nextErrors.name = "Nama goal minimal 3 karakter";
        }

        if (!formData.wallet_id) {
            nextErrors.wallet_id = "Wallet induk goal wajib dipilih";
        }

        if (!formData.target_amount || Number(formData.target_amount) <= 0) {
            nextErrors.target_amount = "Target goal wajib lebih dari 0";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) {
            return;
        }

        setStep((prev) => Math.min(prev + 1, 3));
    };

    const handleSubmit = async () => {
        if (!validateStep1()) {
            setStep(1);
            return;
        }

        await onSave(formData);
    };

    const stepMeta = [
        { number: 1, icon: "ri-flag-2-line", label: "Goal" },
        { number: 2, icon: "ri-wallet-3-line", label: "Wallet" },
        { number: 3, icon: "ri-check-double-line", label: "Review" },
    ];

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 48, height: 48, background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9" }}
                    >
                        <i className="ri-flag-2-line fs-4"></i>
                    </div>
                    <div>
                        <div className="fw-semibold">{t(isEdit ? "wallet.modal.edit_goal" : "wallet.modal.add_goal", { defaultValue: isEdit ? "Edit Goal" : "Tambah Goal" })}</div>
                        <div className="small text-muted">Goal adalah alokasi dana di dalam wallet induk, bukan wallet baru.</div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-3">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-4">
                    {stepMeta.map((item) => {
                        const active = step === item.number;
                        const complete = step > item.number;

                        return (
                            <div key={item.number} className="flex-fill text-center position-relative">
                                <div
                                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2"
                                    style={{
                                        width: 46,
                                        height: 46,
                                        background: complete ? "linear-gradient(135deg, #0ea5e9, #2563eb)" : active ? "#fff" : "#f8fafc",
                                        border: active || complete ? "3px solid #0ea5e9" : "3px solid #e2e8f0",
                                        color: complete ? "#fff" : active ? "#0ea5e9" : "#94a3b8",
                                    }}
                                >
                                    <i className={`${complete ? "ri-check-line" : item.icon} fs-5`}></i>
                                </div>
                                <div className={`small fw-semibold ${active ? "text-primary" : complete ? "text-success" : "text-muted"}`}>{item.label}</div>
                            </div>
                        );
                    })}
                </div>

                <Tab.Container activeKey={String(step)}>
                    <Tab.Content>
                        <Tab.Pane eventKey="1">
                            <Row className="g-3">
                                <Col md={7}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Nama Goal</Form.Label>
                                        <Form.Control
                                            value={formData.name}
                                            onChange={(event) => updateField("name", event.target.value)}
                                            isInvalid={Boolean(errors.name)}
                                            placeholder="Contoh: Modal Cabang Kedua"
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Target Dana</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            inputMode="decimal"
                                            pattern="[0-9]*"
                                            value={formData.target_amount}
                                            onChange={(event) => updateField("target_amount", event.target.value)}
                                            isInvalid={Boolean(errors.target_amount)}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.target_amount}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={7}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Wallet Induk</Form.Label>
                                        <Form.Select
                                            value={formData.wallet_id}
                                            onChange={(event) => updateField("wallet_id", event.target.value)}
                                            isInvalid={Boolean(errors.wallet_id)}
                                        >
                                            <option value="">Pilih wallet</option>
                                            {wallets.map((wallet) => (
                                                <option key={wallet.id} value={wallet.id}>
                                                    {wallet.name} · {wallet.real_account?.name || wallet.realAccount?.name || wallet.currency_code}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">{errors.wallet_id}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Tanggal Target</Form.Label>
                                        <Form.Control type="date" value={formData.target_date} onChange={(event) => updateField("target_date", event.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small text-uppercase text-muted">Catatan</Form.Label>
                                        <Form.Control as="textarea" rows={3} value={formData.notes} onChange={(event) => updateField("notes", event.target.value)} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey="2">
                            <Row className="g-3">
                                <Col md={6}>
                                    <Card className="border-0 shadow-sm rounded-4 h-100">
                                        <Card.Body>
                                            <div className="small text-uppercase text-muted fw-semibold mb-2">Wallet Induk</div>
                                            <div className="fw-semibold text-dark mb-1">{selectedWallet?.name || "-"}</div>
                                            <div className="small text-muted mb-3">{selectedWallet?.real_account?.name || selectedWallet?.realAccount?.name || "-"}</div>
                                            <div className="d-flex flex-wrap gap-2">
                                                <span className={`badge rounded-pill ${selectedWallet?.scope === "shared" ? "bg-info-subtle text-info" : "bg-secondary-subtle text-secondary"}`}>
                                                    {selectedWallet?.scope === "shared" ? "Shared" : "Private"}
                                                </span>
                                                <span className="badge rounded-pill bg-warning-subtle text-warning">Reserved di wallet ini</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 shadow-sm rounded-4 h-100" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(37,99,235,0.08))" }}>
                                        <Card.Body>
                                            <div className="small text-uppercase text-muted fw-semibold mb-2">Implikasi Dana</div>
                                            <div className="small text-muted mb-3">
                                                Goal tidak memindahkan uang keluar dari account. Dana tetap di wallet induk dan akan ditandai sebagai reserved setelah di-top up.
                                            </div>
                                            <div className="fw-semibold text-dark">{formatCurrency(selectedWallet?.available_balance || selectedWallet?.current_balance || 0, selectedWallet?.currency_code || "IDR")}</div>
                                            <div className="small text-muted">Available balance wallet saat ini</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey="3">
                            <Card className="border-0 rounded-4 overflow-hidden shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="small text-uppercase text-muted fw-semibold mb-2">Review Goal</div>
                                    <div className="fw-bold text-dark h4 mb-1">{formData.name || "-"}</div>
                                    <div className="small text-muted mb-3">{selectedWallet?.name || "-"} · {selectedWallet?.real_account?.name || selectedWallet?.realAccount?.name || "-"}</div>
                                    <div className="d-flex flex-wrap gap-2 mb-4">
                                        <span className="badge rounded-pill bg-primary-subtle text-primary">Target {formatCurrency(formData.target_amount || 0, selectedWallet?.currency_code || "IDR")}</span>
                                        {formData.target_date && <span className="badge rounded-pill bg-light text-dark">Target {formData.target_date}</span>}
                                        <span className={`badge rounded-pill ${selectedWallet?.scope === "shared" ? "bg-info-subtle text-info" : "bg-secondary-subtle text-secondary"}`}>
                                            {selectedWallet?.scope === "shared" ? "Akses inherit dari wallet shared" : "Akses inherit dari wallet private"}
                                        </span>
                                    </div>
                                    {isEdit && (
                                        <div className="rounded-4 px-3 py-3" style={{ background: "rgba(148, 163, 184, 0.08)" }}>
                                            <div className="small text-muted mb-1">Reserved saat ini</div>
                                            <div className="fw-semibold text-dark">{formatCurrency(goal?.current_amount || 0, selectedWallet?.currency_code || "IDR")}</div>
                                            <div className="small text-muted mt-2">Sisa menuju target: {formatCurrency(remainingAmount, selectedWallet?.currency_code || "IDR")}</div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={step === 1 ? onHide : () => setStep((prev) => prev - 1)} disabled={saving}>
                    {step === 1 ? t("wallet.actions.cancel") : t("wallet.actions.back", { defaultValue: "Kembali" })}
                </Button>
                {step < 3 ? (
                    <Button variant="primary" onClick={handleNext}>
                        {t("wallet.actions.next", { defaultValue: "Lanjut" })}
                    </Button>
                ) : (
                    <Button variant="primary" onClick={() => void handleSubmit()} disabled={saving}>
                        {saving ? t("wallet.actions.saving") : t("wallet.actions.save_goal")}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default GoalFormWizard;
