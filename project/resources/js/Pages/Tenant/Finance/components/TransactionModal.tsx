import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Accordion } from "react-bootstrap";
import Flatpickr from "react-flatpickr";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import TagsInput from "../../../../Components/Finance/TagsInput";
import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface TransactionModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (transaction?: any) => void;
    transaction?: any;
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    accounts: any[];
    budgets: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    initialType?: "pemasukan" | "pengeluaran";
}

type TransactionFormData = {
    type: "pemasukan" | "pengeluaran";
    owner_member_id: string;
    transaction_date: string;
    amount: string;
    currency_code: string;
    category_id: string;
    bank_account_id: string;
    budget_id: string;
    payment_method: string;
    description: string;
    tags: string[];
    exchange_rate: string;
    merchant_name: string;
    location: string;
    notes: string;
    reference_number: string;
    row_version: number;
};

const normalizeStringId = (value: unknown) => (value === null || value === undefined ? "" : String(value));
const formatLocalDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getCategoryOptionsForType = (categories: any[], type: "pemasukan" | "pengeluaran") =>
    categories.filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === type);

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) {
        return false;
    }

    if (item.scope === "shared") {
        return true;
    }

    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

const TransactionModal = ({
    show,
    onClose,
    onSuccess,
    transaction,
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    accounts,
    budgets,
    members,
    activeMemberId,
    canManageShared = false,
    initialType = "pengeluaran",
}: TransactionModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = !!transaction;

    const buildInitialFormData = React.useCallback((): TransactionFormData => {
        const defaultOwnerMemberId = activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "";
        const defaultAccount = accounts[0];
        const defaultCategory = getCategoryOptionsForType(categories, initialType)[0];

        return {
            type: initialType,
            owner_member_id: defaultOwnerMemberId,
            transaction_date: formatLocalDate(new Date()),
            amount: "",
            currency_code: defaultAccount?.currency_code ?? defaultCurrency,
            category_id: defaultCategory ? String(defaultCategory.id) : "",
            bank_account_id: defaultAccount ? String(defaultAccount.id) : "",
            budget_id: "",
            payment_method: "",
            description: "",
            tags: [],
            exchange_rate: "1.0",
            merchant_name: "",
            location: "",
            notes: "",
            reference_number: "",
            row_version: 1,
        };
    }, [accounts, activeMemberId, categories, defaultCurrency, initialType, members]);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>(buildInitialFormData);

    useEffect(() => {
        if (!show) {
            return;
        }

        if (transaction) {
            setFormData({
                type: transaction.type,
                owner_member_id: String(transaction.owner_member_id || activeMemberId || ""),
                transaction_date: transaction.transaction_date,
                amount: String(transaction.amount),
                currency_code: transaction.currency_code,
                category_id: normalizeStringId(transaction.category_id),
                bank_account_id: normalizeStringId(transaction.bank_account_id),
                budget_id: normalizeStringId(transaction.budget_id),
                payment_method: transaction.payment_method || "",
                description: transaction.description || "",
                tags: (transaction.tags || []).map((tag: any) => tag.name),
                exchange_rate: String(transaction.exchange_rate || "1.0"),
                merchant_name: transaction.merchant_name || "",
                location: transaction.location || "",
                notes: transaction.notes || "",
                reference_number: transaction.reference_number || "",
                row_version: transaction.row_version || 1,
            });
            return;
        }

        setFormData(buildInitialFormData());
    }, [show, transaction, activeMemberId, buildInitialFormData]);

    const selectedAccount = accounts.find((account) => String(account.id) === String(formData.bank_account_id));
    const selectedBudget = budgets.find((budget) => String(budget.id) === String(formData.budget_id));
    const budgetDelta = selectedBudget
        ? Number(selectedBudget.remaining_amount || 0) - (Number(formData.amount || 0) * Number(formData.exchange_rate || 1))
        : 0;

    const memberOptions = useMemo(() => members.map((member) => ({
        value: String(member.id),
        label: member.full_name,
    })), [members]);

    const visibleAccounts = useMemo(() => accounts.filter((account) => canUseForOwner(account, formData.owner_member_id)), [accounts, formData.owner_member_id]);

    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, formData.owner_member_id)), [budgets, formData.owner_member_id]);

    const accountOptions = useMemo(() => visibleAccounts.map((account) => ({
        label: `${account.name} · ${account.currency_code}`,
        value: String(account.id),
    })), [visibleAccounts]);

    const budgetOptions = useMemo(() => visibleBudgets.map((budget) => ({
        label: `${budget.name} · ${budget.period_month}`,
        value: String(budget.id),
    })), [visibleBudgets]);

    const categoryOptions = useMemo(() => getCategoryOptionsForType(categories, formData.type)
        .map((category) => ({
            label: category.name,
            value: String(category.id),
        })), [categories, formData.type]);

    const currencyOptions = useMemo(() => currencies.map((currency) => ({
        label: `${currency.code} - ${currency.name}`,
        value: currency.code,
    })), [currencies]);

    const paymentMethodOptions = useMemo(() => paymentMethods.map((method) => ({
        label: method.label,
        value: method.value,
    })), [paymentMethods]);

    useEffect(() => {
        if (!show) {
            return;
        }

        setFormData((prev) => {
            const next = { ...prev };

            const accountStillValid = accountOptions.some((option) => option.value === next.bank_account_id);
            if (!accountStillValid) {
                next.bank_account_id = accountOptions[0]?.value ?? "";
            }

            const categoryStillValid = categoryOptions.some((option) => option.value === next.category_id);
            if (!categoryStillValid) {
                next.category_id = categoryOptions[0]?.value ?? "";
            }

            const budgetStillValid = budgetOptions.some((option) => option.value === next.budget_id);
            if (!budgetStillValid) {
                next.budget_id = "";
            }

            if (!next.owner_member_id && memberOptions[0]) {
                next.owner_member_id = memberOptions[0].value;
            }

            const syncedAccount = accounts.find((account) => String(account.id) === String(next.bank_account_id));
            if (syncedAccount?.currency_code) {
                next.currency_code = syncedAccount.currency_code;
                if (syncedAccount.currency_code === defaultCurrency) {
                    next.exchange_rate = "1.0";
                }
            }

            return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        });
    }, [accountOptions, accounts, budgetOptions, categoryOptions, defaultCurrency, memberOptions, show]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.amount || !formData.transaction_date || !formData.bank_account_id) {
            notify.error(t("finance.notifications.missing_fields"));
            return;
        }

        setLoading(true);

        try {
            const payload: any = {
                ...formData,
                owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
                amount: parseFloat(formData.amount),
                exchange_rate: parseFloat(formData.exchange_rate || "1"),
                category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
                budget_id: formData.type === "pengeluaran" && formData.budget_id ? formData.budget_id : null,
                payment_method: formData.payment_method || null,
            };

            if (!isEdit) {
                delete payload.row_version;
            }

            const response = await axios({
                method: isEdit ? "patch" : "post",
                url: isEdit
                    ? tenantRoute.apiTo(`/finance/transactions/${transaction.id}`)
                    : tenantRoute.apiTo("/finance/transactions"),
                data: payload,
            });

            notify.success(t(isEdit ? "finance.messages.success_update" : "finance.messages.success_save"));
            onSuccess(response.data?.data?.transaction);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.notifications.transaction_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} fullscreen>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between">
                        <Modal.Title>{t(isEdit ? "finance.modals.transaction.edit_title" : "finance.modals.transaction.add_title")}</Modal.Title>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        {(["pengeluaran", "pemasukan"] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                className={`btn btn-sm flex-fill ${formData.type === type ? "btn-danger" : "btn-light"}`}
                                onClick={() => setFormData((prev) => ({
                                    ...prev,
                                    type,
                                    category_id: "",
                                    budget_id: "",
                                }))}
                                disabled={isEdit}
                            >
                                {t(`finance.transactions.types.${type}`)}
                            </button>
                        ))}
                    </div>
                </div>
                </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-3 bg-white" style={{ paddingBottom: 112 }} data-testid="finance-transaction-modal">
                    <div className="rounded-4 border bg-white overflow-hidden h-auto">
                        <div className="p-3">
                            <div className="small text-muted mb-2">{t("finance.modals.transaction.tabs.main")}</div>
                            <Row className="g-3">
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.date")}</Form.Label>
                                    <Flatpickr
                                        className="form-control"
                                        value={formData.transaction_date ? new Date(formData.transaction_date) : new Date()}
                                        onChange={([date]) => setFormData((prev) => ({ ...prev, transaction_date: formatLocalDate(date) }))}
                                        options={{ dateFormat: "Y-m-d" }}
                                    />
                                </Col>
                                {canManageShared && (
                                    <Col xs={12}>
                                        <Form.Label>{t("finance.modals.transaction.fields.owner_member")}</Form.Label>
                                        <Select
                                            options={memberOptions}
                                            value={memberOptions.find((option) => option.value === formData.owner_member_id)}
                                            onChange={(option: any) => setFormData((prev) => ({ ...prev, owner_member_id: option?.value ?? "" }))}
                                            classNamePrefix="react-select"
                                        />
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <Form.Label>{t("finance.modals.transaction.fields.account")}</Form.Label>
                                    <Select
                                        options={accountOptions}
                                        value={accountOptions.find((option) => option.value === formData.bank_account_id)}
                                        onChange={(option: any) => setFormData((prev) => ({ ...prev, bank_account_id: option?.value ?? "" }))}
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                <Col xs={5}>
                                    <Form.Label>{t("finance.modals.transaction.fields.currency")}</Form.Label>
                                    <Select
                                        options={currencyOptions}
                                        value={currencyOptions.find((option) => option.value === formData.currency_code)}
                                        onChange={(option: any) => setFormData((prev) => ({ ...prev, currency_code: option.value }))}
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                <Col xs={7}>
                                    <Form.Label>{t("finance.modals.transaction.fields.amount")}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                                        placeholder={t("finance.modals.transaction.placeholders.amount")}
                                        required
                                    />
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
                                        value={categoryOptions.find((option) => option.value === formData.category_id)}
                                        onChange={(option: any) => setFormData((prev) => ({ ...prev, category_id: option?.value || "" }))}
                                        isClearable
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                {formData.type === "pengeluaran" && (
                                    <Col xs={12}>
                                        <Form.Label>{t("finance.modals.transaction.fields.budget")}</Form.Label>
                                        <Select
                                            options={budgetOptions}
                                            value={budgetOptions.find((option) => option.value === formData.budget_id)}
                                            onChange={(option: any) => setFormData((prev) => ({ ...prev, budget_id: option?.value || "" }))}
                                            isClearable
                                            classNamePrefix="react-select"
                                        />
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
                        </div>

                        <div className="px-3 pb-3 bg-white">
                            <div className="small text-muted mb-2">{t("finance.modals.transaction.fields.notes")}</div>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder={t("finance.modals.transaction.placeholders.notes")}
                            />
                        </div>

                        <Accordion className="border-top bg-white mb-0">
                            <Accordion.Item eventKey="0" className="border-0 rounded-0 bg-white">
                                <Accordion.Header>{t("finance.pwa.detail.optional_details")}</Accordion.Header>
                                <Accordion.Body className="bg-white pt-0 pb-3">
                                    <Row className="g-3">
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.payment_method_optional")}</Form.Label>
                                            <Select
                                                options={paymentMethodOptions}
                                                value={paymentMethodOptions.find((option) => option.value === formData.payment_method)}
                                                onChange={(option: any) => setFormData((prev) => ({ ...prev, payment_method: option?.value || "" }))}
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.merchant_name")}</Form.Label>
                                            <Form.Control
                                                value={formData.merchant_name}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, merchant_name: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.merchant_name")}
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.location")}</Form.Label>
                                            <Form.Control
                                                value={formData.location}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.location")}
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.reference_number")}</Form.Label>
                                            <Form.Control
                                                value={formData.reference_number}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, reference_number: e.target.value }))}
                                                placeholder={t("finance.modals.transaction.placeholders.reference_number")}
                                            />
                                        </Col>
                                        <Col xs={12}>
                                            <Form.Label>{t("finance.modals.transaction.fields.tags")}</Form.Label>
                                            <TagsInput
                                                value={formData.tags}
                                                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                                                placeholder={t("finance.modals.transaction.placeholders.tags")}
                                            />
                                        </Col>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.modals.transaction.buttons.cancel")}</Button>
                    <Button variant="primary" type="submit" disabled={loading} data-testid="finance-transaction-save">
                        {loading ? t("finance.shared.processing") : t(isEdit ? "finance.modals.transaction.buttons.update" : "finance.modals.transaction.buttons.save")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default TransactionModal;
