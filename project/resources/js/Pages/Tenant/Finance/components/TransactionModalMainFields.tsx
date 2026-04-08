import React from "react";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Select from "react-select";

import { TransactionFormData, TransactionSelectOption } from "./transactionModalTypes";
import { FinanceBudget } from "../types";

type Props = {
    canManageShared: boolean;
    formData: TransactionFormData;
    defaultCurrency: string;
    memberOptions: TransactionSelectOption[];
    pocketOptions: TransactionSelectOption[];
    selectedAccount?: { name?: string | null; type?: string | null; currency_code?: string | null } | null;
    selectedPocket?: { name?: string | null; current_balance?: number | string | null } | null;
    currencyOptions: TransactionSelectOption[];
    categoryOptions: TransactionSelectOption[];
    budgetOptions: TransactionSelectOption[];
    selectedBudget?: FinanceBudget | null;
    budgetLocked: boolean;
    budgetDelta: number;
    setFormData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
    setShowCalculator: React.Dispatch<React.SetStateAction<boolean>>;
    showCalculator: boolean;
    t: (key: string, options?: Record<string, unknown>) => string;
};

const TransactionModalMainFields = ({
    canManageShared,
    formData,
    defaultCurrency,
    memberOptions,
    pocketOptions,
    selectedAccount,
    selectedPocket,
    currencyOptions,
    categoryOptions,
    budgetOptions,
    selectedBudget,
    budgetLocked,
    budgetDelta,
    setFormData,
    setShowCalculator,
    showCalculator,
    t,
}: Props) => (
    <>
        <div className="small text-muted mb-2">{t("finance.modals.transaction.tabs.main")}</div>
        <Row className="g-3">
            <Col xs={12}>
                <Form.Label>{t("finance.modals.transaction.fields.date")}</Form.Label>
                <Form.Control
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
                />
            </Col>
            {canManageShared && (
                <Col xs={12}>
                    <Form.Label>{t("finance.modals.transaction.fields.owner_member")}</Form.Label>
                    <Select
                        options={memberOptions}
                        value={memberOptions.find((option) => option.value === formData.owner_member_id) ?? null}
                        onChange={(option) => setFormData((prev) => ({ ...prev, owner_member_id: option?.value ?? "" }))}
                        classNamePrefix="react-select"
                    />
                </Col>
            )}
            <Col xs={12}>
                <Form.Label>{t("wallet.title", { defaultValue: "Wallet" })}</Form.Label>
                <Select
                    options={pocketOptions}
                    value={pocketOptions.find((option) => option.value === formData.pocket_id) ?? null}
                    onChange={(option) => setFormData((prev) => ({ ...prev, pocket_id: option?.value ?? "" }))}
                    classNamePrefix="react-select"
                />
                {(selectedPocket || selectedAccount) && (
                    <div className="mt-2">
                        {selectedPocket && (
                            <Form.Text className="text-muted d-block">
                                {t("wallet.fields.balance", { defaultValue: "Saldo" })}: {Number(selectedPocket.current_balance || 0).toLocaleString("id-ID")}
                            </Form.Text>
                        )}
                        {selectedAccount && (
                            <Form.Text className="text-muted d-block">
                                {t("finance.modals.transaction.fields.account", { defaultValue: "Akun" })}: {selectedAccount.name || ""}{selectedAccount.type ? ` · ${selectedAccount.type}` : ""}{selectedAccount.currency_code ? ` · ${selectedAccount.currency_code}` : ""}
                            </Form.Text>
                        )}
                    </div>
                )}
            </Col>
            <Col xs={5} className="d-flex flex-column justify-content-end">
                <Form.Label className="mb-2">{t("finance.modals.transaction.fields.currency")}</Form.Label>
                <div className="flex-grow-1 d-flex align-items-end">
                    <div className="w-100">
                        <Select
                            options={currencyOptions}
                            value={currencyOptions.find((option) => option.value === formData.currency_code) ?? null}
                            onChange={(option) => setFormData((prev) => ({ ...prev, currency_code: option?.value || prev.currency_code }))}
                            classNamePrefix="react-select"
                        />
                    </div>
                </div>
            </Col>
            <Col xs={7} className="d-flex flex-column justify-content-end">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <Form.Label className="mb-0">{t("finance.modals.transaction.fields.amount")}</Form.Label>
                    <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowCalculator(true)}>
                        {t("finance.calculator.open")}
                    </Button>
                </div>
                <div className="flex-grow-1 d-flex align-items-end">
                    <InputGroup>
                        <Form.Control
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                            placeholder={t("finance.modals.transaction.placeholders.amount")}
                            readOnly={showCalculator}
                            required
                        />
                        <Button type="button" variant="outline-secondary" onClick={() => setShowCalculator(true)}>
                            <i className="ri-calculator-line" aria-hidden="true" />
                        </Button>
                    </InputGroup>
                </div>
            </Col>
            {formData.currency_code !== defaultCurrency && (
                <Col xs={12}>
                    <div className="p-3 border rounded-4 bg-white">
                        <Form.Label>{t("finance.modals.transaction.fields.exchange_rate_hint", { currency: formData.currency_code, baseCurrency: defaultCurrency })}</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.000001"
                            value={formData.exchange_rate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, exchange_rate: e.target.value }))}
                            placeholder={t("finance.modals.transaction.placeholders.exchange_rate")}
                            required
                        />
                    </div>
                </Col>
            )}
            <Col xs={12}>
                <Form.Label>{t("finance.modals.transaction.fields.category")}</Form.Label>
                <Select
                    options={categoryOptions}
                    value={categoryOptions.find((option) => option.value === formData.category_id) ?? null}
                    onChange={(option) => setFormData((prev) => ({ ...prev, category_id: option?.value || "" }))}
                    isClearable
                    classNamePrefix="react-select"
                />
            </Col>
            {formData.type === "pengeluaran" && (
                <Col xs={12}>
                    <Form.Label>{t("finance.modals.transaction.fields.budget")}</Form.Label>
                    <Select
                        options={budgetOptions}
                        value={budgetOptions.find((option) => option.value === formData.budget_id) ?? null}
                        onChange={(option) => setFormData((prev) => ({ ...prev, budget_id: option?.value || "" }))}
                        isClearable
                        isDisabled={budgetLocked}
                        classNamePrefix="react-select"
                    />
                    {budgetLocked && selectedBudget && (
                        <Form.Text className="text-muted">
                            {t("finance.modals.transaction.budget_locked_hint", { defaultValue: "Budget dikunci oleh wallet ini dan tidak bisa diganti." })}
                        </Form.Text>
                    )}
                    {!formData.budget_id && (
                        <Form.Text className="text-muted">{t("finance.modals.transaction.budget_unset_hint")}</Form.Text>
                    )}
                    {selectedBudget && budgetDelta < 0 && (
                        <Alert variant="warning" className="mt-2 mb-0 rounded-4">
                            {t("finance.modals.transaction.budget_over_hint", {
                                remaining: Number(selectedBudget.remaining_amount || 0).toLocaleString(),
                            })}
                        </Alert>
                    )}
                </Col>
            )}
            <Col xs={12}>
                <Form.Label>{t("finance.modals.transaction.fields.description")}</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t("finance.modals.transaction.placeholders.description")}
                    required
                />
            </Col>
        </Row>
    </>
);

export default TransactionModalMainFields;
