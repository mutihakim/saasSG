import axios from "axios";
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
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
    onSuccess: () => void;
    transaction?: any;
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
}

const TransactionModal = ({
    show,
    onClose,
    onSuccess,
    transaction,
    categories,
    currencies,
    defaultCurrency,
    paymentMethods
}: TransactionModalProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const isEdit = !!transaction;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "pengeluaran",  // Backend enum value (NOT "expense")
        transaction_date: new Date().toISOString(),
        amount: "",
        currency_code: defaultCurrency,
        category_id: "",
        payment_method: "tunai",  // Backend enum value
        description: "",
        tags: [] as string[],
        row_version: 1,
    });

    useEffect(() => {
        if (show) {
            if (transaction) {
                // Backend sends enum values directly (pemasukan/pengeluaran)
                // No mapping needed - use directly as form values
                setFormData({
                    type: transaction.type,  // Direct from backend
                    transaction_date: transaction.transaction_date,
                    amount: String(transaction.amount),
                    currency_code: transaction.currency_code,
                    category_id: String(transaction.category_id || ""),
                    payment_method: transaction.payment_method,  // Direct from backend
                    description: transaction.description || "",
                    tags: (transaction.tags || []).map((tag: any) => tag.name),
                    row_version: transaction.row_version || 1,
                });
            } else {
                setFormData({
                    type: "pengeluaran",  // Backend enum value
                    transaction_date: new Date().toISOString(),
                    amount: "",
                    currency_code: defaultCurrency,
                    category_id: "",
                    payment_method: "tunai",  // Backend enum value
                    description: "",
                    tags: [],
                    row_version: 1,
                });
            }
        }
    }, [show, transaction, defaultCurrency]);

    // Filter categories based on type (backend enum values)
    const getSubTypeForType = (type: string): string => {
        // Backend enum values are already in Indonesian
        // Just return as-is for category filtering
        return type === 'transfer' ? 'all' : type;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.transaction_date) {
            notify.error(t("finance.notifications.missing_fields"));
            return;
        }

        setLoading(true);
        const url = isEdit
            ? tenantRoute.apiTo(`/finance/transactions/${transaction.id}`)
            : tenantRoute.apiTo("/finance/transactions");

        try {
            const payload: any = {
                ...formData,
                amount: parseFloat(formData.amount),
            };
            
            // Only send row_version for update (edit) operations
            if (isEdit) {
                payload.row_version = formData.row_version;
            }

            await axios({
                method: isEdit ? "patch" : "post",
                url,
                data: payload
            });
            notify.success(t(isEdit ? "finance.messages.success_update" : "finance.messages.success_save"));
            onSuccess();
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.notifications.transaction_save_failed"));
            notify.error({
                title: parsed.title,
                detail: parsed.detail
            });
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = categories
        .filter(c => !c.sub_type || c.sub_type === 'all' || c.sub_type === getSubTypeForType(formData.type))
        .map(c => ({
            label: c.name,
            value: String(c.id),
            type: c.sub_type
        }));

    const currencyOptions = currencies.map(c => ({
        label: `${c.code} - ${c.name}`,
        value: c.code
    }));

    const paymentMethodOptions = paymentMethods.map(m => ({
        label: m.label,
        value: m.value
    }));

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{t(isEdit ? "finance.modals.transaction.edit_title" : "finance.modals.transaction.add_title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>{t("finance.modals.transaction.fields.type")}</Form.Label>
                            <div className="d-flex gap-3 mt-1">
                                {["pemasukan", "pengeluaran", "transfer"].map((type) => (
                                    <Form.Check
                                        key={type}
                                        type="radio"
                                        id={`type-${type}`}
                                        label={t(`finance.transactions.types.${type}`)}
                                        name="type"
                                        value={type}
                                        checked={formData.type === type}
                                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                                    />
                                ))}
                            </div>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.modals.transaction.fields.date")}</Form.Label>
                            <Flatpickr
                                className="form-control"
                                data-enable-time
                                value={formData.transaction_date ? new Date(formData.transaction_date) : new Date()}
                                onChange={([date]) => setFormData({ ...formData, transaction_date: date.toISOString() })}
                                options={{ dateFormat: "Y-m-d H:i" }}
                            />
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label>{t("finance.modals.transaction.fields.currency")}</Form.Label>
                            <Select
                                options={currencyOptions}
                                value={currencyOptions.find(o => o.value === formData.currency_code)}
                                onChange={(opt: any) => setFormData({ ...formData, currency_code: opt.value })}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={8}>
                            <Form.Label>{t("finance.modals.transaction.fields.amount")}</Form.Label>
                            <Form.Control
                                type="number"
                                step="any"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder={t("finance.modals.transaction.placeholders.amount")}
                                required
                            />
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>{t("finance.modals.transaction.fields.category")}</Form.Label>
                            <Select
                                options={categoryOptions}
                                value={categoryOptions.find(o => o.value === formData.category_id)}
                                onChange={(opt: any) => setFormData({ ...formData, category_id: opt?.value || "" })}
                                isClearable
                                placeholder={t("finance.modals.transaction.placeholders.category")}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("finance.modals.transaction.fields.payment_method")}</Form.Label>
                            <Select
                                options={paymentMethodOptions}
                                value={paymentMethodOptions.find(o => o.value === formData.payment_method)}
                                onChange={(opt: any) => setFormData({ ...formData, payment_method: opt.value })}
                                classNamePrefix="react-select"
                            />
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Label>{t("finance.modals.transaction.fields.description")}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t("finance.modals.transaction.placeholders.description")}
                            />
                        </Col>
                    </Row>

                    <Row className="mb-1">
                        <Col md={12}>
                            <Form.Label>{t("finance.modals.transaction.fields.tags")}</Form.Label>
                            <TagsInput
                                value={formData.tags}
                                onChange={(tags) => setFormData({ ...formData, tags })}
                                placeholder={t("finance.modals.transaction.placeholders.tags")}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onClose} disabled={loading}>{t("finance.modals.transaction.buttons.cancel")}</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? "Processing..." : t(isEdit ? "finance.modals.transaction.buttons.update" : "finance.modals.transaction.buttons.save")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default TransactionModal;
