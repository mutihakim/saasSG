import React from "react";
import { Accordion, Col, Form, Row } from "react-bootstrap";

import { TransactionFormData, TransactionSelectOption } from "./transactionModalTypes";

import TagsInput from "@/components/ui/TagsInput";


type Props = {
    formData: TransactionFormData;
    isEdit: boolean;
    lockedGroupMeta: { sourceType: string; sourceId: string; merchantName?: string | null; label?: string | null } | null;
    paymentMethodOptions: TransactionSelectOption[];
    setFormData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
    t: (key: string) => string;
};

const TransactionModalOptionalDetails = ({
    formData,
    isEdit,
    lockedGroupMeta,
    paymentMethodOptions,
    setFormData,
    t,
}: Props) => (
    <Accordion className="border-top bg-white mb-0">
        <Accordion.Item eventKey="0" className="border-0 rounded-0 bg-white">
            <Accordion.Header>{t("finance.pwa.detail.optional_details")}</Accordion.Header>
            <Accordion.Body className="bg-white pt-0 pb-3">
                <Row className="g-3">
                    <Col xs={12}>
                        <Form.Label>{t("finance.modals.transaction.fields.payment_method_optional")}</Form.Label>
                        <Form.Select
                            value={formData.payment_method}
                            onChange={(e) => setFormData((prev) => ({ ...prev, payment_method: e.target.value }))}
                        >
                            <option value="">Pilih metode</option>
                            {paymentMethodOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={12}>
                        <Form.Label>{t("finance.modals.transaction.fields.merchant_name")}</Form.Label>
                        <Form.Control
                            value={formData.merchant_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, merchant_name: e.target.value }))}
                            placeholder={t("finance.modals.transaction.placeholders.merchant_name")}
                            readOnly={!isEdit && !!lockedGroupMeta}
                        />
                        {!isEdit && !!lockedGroupMeta && (
                            <Form.Text className="text-muted">
                                Label grup dikunci agar item baru tetap masuk ke grup yang sama.
                            </Form.Text>
                        )}
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
);

export default TransactionModalOptionalDetails;
