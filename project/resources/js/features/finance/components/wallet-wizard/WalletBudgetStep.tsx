import React from "react";
import { Card, Form } from "react-bootstrap";

import { FinanceBudget, FinanceWalletFormState } from "../../types";

type Props = {
    formData: FinanceWalletFormState;
    walletBudgetOptions: FinanceBudget[];
    updateField: (field: keyof FinanceWalletFormState, value: any) => void;
};

const WalletBudgetStep = ({ formData, walletBudgetOptions, updateField }: Props) => (
    <>
        {formData.purpose_type !== "spending" ? (
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
                            const selectedBudget = walletBudgetOptions.find((item) => String(item.budget_key || item.code || item.id) === e.target.value);
                            updateField("default_budget_key", e.target.value);
                            updateField("default_budget_id", selectedBudget?.id ? String(selectedBudget.id) : "");
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

                {formData.default_budget_key ? (
                    <div className="mb-4">
                        <Card
                            className="border-0"
                            style={{
                                background: formData.budget_lock_enabled ? "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(6, 182, 212, 0.05))" : "#fff",
                                border: formData.budget_lock_enabled ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                borderRadius: "12px",
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
                                        onChange={(e) => updateField("budget_lock_enabled", e.target.checked)}
                                        className="mb-0"
                                        style={{ transform: "scale(1.3)" }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ) : null}
            </>
        )}
    </>
);

export default WalletBudgetStep;
