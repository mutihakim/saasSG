import React, { useMemo } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceBudget, FinanceCategory, FinancePaymentMethodOption, FinancePocket, FinanceSavingsGoal } from "../../Finance/types";
import { GoalFundFormState, GoalSpendFormState } from "../types";

type FundProps = {
    mode: "fund";
    show: boolean;
    onHide: () => void;
    goal: FinanceSavingsGoal | null;
    wallets: FinancePocket[];
    form: GoalFundFormState;
    setForm: React.Dispatch<React.SetStateAction<GoalFundFormState>>;
    onSubmit: () => Promise<void>;
    loading: boolean;
};

type SpendProps = {
    mode: "spend";
    show: boolean;
    onHide: () => void;
    goal: FinanceSavingsGoal | null;
    wallets: FinancePocket[];
    budgets: FinanceBudget[];
    categories: FinanceCategory[];
    paymentMethods: FinancePaymentMethodOption[];
    form: GoalSpendFormState;
    setForm: React.Dispatch<React.SetStateAction<GoalSpendFormState>>;
    onSubmit: () => Promise<void>;
    loading: boolean;
};

type Props = FundProps | SpendProps;

const GoalActionModal = (props: Props) => {
    const { t } = useTranslation();
    const wallet = useMemo(
        () => props.wallets.find((item) => String(item.id) === String(props.goal?.pocket_id)) ?? null,
        [props.goal?.pocket_id, props.wallets],
    );

    const spendBudgetOptions = props.mode === "spend"
        ? props.budgets.filter((budget) => {
            if (budget.is_active === false) return false;
            if (!wallet) return true;
            if (wallet.scope === "shared") return budget.scope === "shared";
            return true;
        })
        : [];

    const spendCategoryOptions = props.mode === "spend"
        ? props.categories.filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === "pengeluaran")
        : [];

    const title = props.mode === "fund"
        ? t("wallet.actions.top_up", { defaultValue: "Top Up Goal" })
        : t("wallet.actions.spend_goal", { defaultValue: "Pakai Dana Goal" });

    return (
        <Modal show={props.show} onHide={props.onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="rounded-4 p-3 mb-3" style={{ background: "rgba(15, 23, 42, 0.04)" }}>
                    <div className="small text-uppercase text-muted fw-semibold mb-1">Goal</div>
                    <div className="fw-semibold text-dark">{props.goal?.name || "-"}</div>
                    <div className="small text-muted">{wallet?.name || "-"} · {wallet?.real_account?.name || wallet?.realAccount?.name || "-"}</div>
                </div>

                {props.mode === "fund" ? (
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Label>Wallet Sumber</Form.Label>
                            <Form.Select value={props.form.source_pocket_id} onChange={(event) => props.setForm((prev) => ({ ...prev, source_pocket_id: event.target.value }))}>
                                <option value="">Pilih wallet sumber</option>
                                {props.wallets.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} · {item.real_account?.name || item.realAccount?.name || item.currency_code}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Nominal</Form.Label>
                            <Form.Control type="number" step="0.01" inputMode="decimal" pattern="[0-9]*" value={props.form.amount} onChange={(event) => props.setForm((prev) => ({ ...prev, amount: event.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Tanggal</Form.Label>
                            <Form.Control type="date" value={props.form.transaction_date} onChange={(event) => props.setForm((prev) => ({ ...prev, transaction_date: event.target.value }))} />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Deskripsi</Form.Label>
                            <Form.Control value={props.form.description} onChange={(event) => props.setForm((prev) => ({ ...prev, description: event.target.value }))} />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Catatan</Form.Label>
                            <Form.Control as="textarea" rows={3} value={props.form.notes} onChange={(event) => props.setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                        </Col>
                    </Row>
                ) : (
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>Nominal</Form.Label>
                            <Form.Control type="number" step="0.01" inputMode="decimal" pattern="[0-9]*" value={props.form.amount} onChange={(event) => props.setForm((prev) => ({ ...prev, amount: event.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Tanggal</Form.Label>
                            <Form.Control type="date" value={props.form.transaction_date} onChange={(event) => props.setForm((prev) => ({ ...prev, transaction_date: event.target.value }))} />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Sumber Wallet</Form.Label>
                            <Form.Control value={wallet?.name || "-"} readOnly />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Kategori</Form.Label>
                            <Form.Select value={props.form.category_id} onChange={(event) => props.setForm((prev) => ({ ...prev, category_id: event.target.value }))}>
                                <option value="">Pilih kategori</option>
                                {spendCategoryOptions.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Budget</Form.Label>
                            <Form.Select value={props.form.budget_id} onChange={(event) => props.setForm((prev) => ({ ...prev, budget_id: event.target.value }))}>
                                <option value="">Tanpa budget</option>
                                {spendBudgetOptions.map((budget) => (
                                    <option key={budget.id} value={budget.id}>{budget.name} · {budget.period_month}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Dipakai Untuk Apa</Form.Label>
                            <Form.Control value={props.form.description} onChange={(event) => props.setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Contoh: DP sewa kios baru" />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Metode Pembayaran</Form.Label>
                            <Form.Select value={props.form.payment_method} onChange={(event) => props.setForm((prev) => ({ ...prev, payment_method: event.target.value }))}>
                                <option value="">Pilih metode</option>
                                {props.paymentMethods.map((method) => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Merchant / Toko</Form.Label>
                            <Form.Control value={props.form.merchant_name} onChange={(event) => props.setForm((prev) => ({ ...prev, merchant_name: event.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>No Referensi</Form.Label>
                            <Form.Control value={props.form.reference_number} onChange={(event) => props.setForm((prev) => ({ ...prev, reference_number: event.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Lokasi</Form.Label>
                            <Form.Control value={props.form.location} onChange={(event) => props.setForm((prev) => ({ ...prev, location: event.target.value }))} />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Catatan</Form.Label>
                            <Form.Control as="textarea" rows={3} value={props.form.notes} onChange={(event) => props.setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                        </Col>
                    </Row>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={props.onHide} disabled={props.loading}>{t("wallet.actions.cancel")}</Button>
                <Button variant="primary" onClick={() => void props.onSubmit()} disabled={props.loading}>
                    {props.loading
                        ? t("wallet.actions.saving")
                        : props.mode === "fund"
                            ? t("wallet.actions.top_up", { defaultValue: "Top Up" })
                            : t("wallet.actions.spend_goal", { defaultValue: "Pakai Dana" })}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GoalActionModal;
