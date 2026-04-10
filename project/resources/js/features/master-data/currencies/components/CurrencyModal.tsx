import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

interface CurrencyModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: any;
}

const CurrencyModal = ({
  show,
  onClose,
  onSuccess,
  currency,
}: CurrencyModalProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const isEdit = !!currency;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    symbol_position: "before",
    decimal_places: 2,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    if (show) {
      if (currency) {
        setFormData({
          code: currency.code || "",
          name: currency.name || "",
          symbol: currency.symbol || "",
          symbol_position: currency.symbol_position || "before",
          decimal_places: currency.decimal_places ?? 2,
          is_active: currency.is_active ?? true,
          sort_order: currency.sort_order ?? 0
        });
      } else {
        setFormData({
          code: "",
          name: "",
          symbol: "",
          symbol_position: "before",
          decimal_places: 2,
          is_active: true,
          sort_order: 0
        });
      }
      setError(null);
    }
  }, [show, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit
      ? tenantRoute.apiTo(`/master/currencies/${currency.id}`)
      : tenantRoute.apiTo("/master/currencies");

    try {
      await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: {
          ...formData,
          decimal_places: parseInt(String(formData.decimal_places)),
          sort_order: parseInt(String(formData.sort_order)),
          row_version: currency?.row_version
        }
      });
      notify.success(t(isEdit ? "master.currencies.messages.success_update" : "master.currencies.messages.success_add"));
      onSuccess();
      onClose();
    } catch (_err: any) {
      const parsed = parseApiError(_err, t("master.currencies.messages.error"));
      setError(parsed.detail || parsed.title);
      notify.error({
        title: parsed.title,
        detail: parsed.detail
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? t("master.currencies.modals.edit_title") : t("master.currencies.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.code")}</Form.Label>
                <Form.Control
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="IDR"
                  maxLength={3}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.name")}</Form.Label>
                <Form.Control
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rupiah"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.symbol")}</Form.Label>
                <Form.Control
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="Rp"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.position")}</Form.Label>
                <div className="d-flex gap-3 mt-2">
                  <Form.Check
                    type="radio"
                    id="position-before"
                    label={t("master.currencies.positions.before")}
                    name="symbol_position"
                    checked={formData.symbol_position === "before"}
                    onChange={() => setFormData({ ...formData, symbol_position: "before" })}
                  />
                  <Form.Check
                    type="radio"
                    id="position-after"
                    label={t("master.currencies.positions.after")}
                    name="symbol_position"
                    checked={formData.symbol_position === "after"}
                    onChange={() => setFormData({ ...formData, symbol_position: "after" })}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.decimal_places")}</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="4"
                  value={formData.decimal_places}
                  onChange={(e) => setFormData({ ...formData, decimal_places: parseInt(e.target.value) || 0 })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.currencies.fields.sort_order")}</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="is_active"
              label={t("master.currencies.fields.is_active")}
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={loading}>
            {t("master.currencies.buttons.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? t("master.currencies.buttons.saving") : t("master.currencies.buttons.save")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CurrencyModal;
