import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

interface UomModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: any;
  dimensionTypes: string[];
}

const UomModal = ({
  show,
  onClose,
  onSuccess,
  unit,
  dimensionTypes
}: UomModalProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const isEdit = !!unit;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    abbreviation: "",
    dimension_type: "jumlah",
    base_unit_code: "",
    base_factor: 1,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    if (show) {
      if (unit) {
        setFormData({
          code: unit.code || "",
          name: unit.name || "",
          abbreviation: unit.abbreviation || "",
          dimension_type: unit.dimension_type || "jumlah",
          base_unit_code: unit.base_unit_code || "",
          base_factor: unit.base_factor ?? 1,
          is_active: unit.is_active ?? true,
          sort_order: unit.sort_order ?? 0
        });
      } else {
        setFormData({
          code: "",
          name: "",
          abbreviation: "",
          dimension_type: "jumlah",
          base_unit_code: "",
          base_factor: 1,
          is_active: true,
          sort_order: 0
        });
      }
      setError(null);
    }
  }, [show, unit]);

  useEffect(() => {
    if (!show || !formData.dimension_type) {
      setAvailableUnits([]);
      return;
    }

    let isCancelled = false;

    const loadUnits = async () => {
      try {
        const response = await axios.get(tenantRoute.apiTo("/master/uom"), {
          params: {
            dimension_type: formData.dimension_type,
            per_page: "all",
          },
        });

        const items = Array.isArray(response.data?.data?.units) ? response.data.data.units : [];
        if (!isCancelled) {
          setAvailableUnits(items);
        }
      } catch {
        if (!isCancelled) {
          setAvailableUnits([]);
        }
      }
    };

    void loadUnits();

    return () => {
      isCancelled = true;
    };
  }, [formData.dimension_type, show, tenantRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit
      ? tenantRoute.apiTo(`/master/uom/${unit.id}`)
      : tenantRoute.apiTo("/master/uom");

    try {
      await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: {
          ...formData,
          base_factor: parseFloat(String(formData.base_factor)),
          sort_order: parseInt(String(formData.sort_order)),
          row_version: unit?.row_version
        }
      });
      notify.success(t(isEdit ? "master.uom.messages.success_update" : "master.uom.messages.success_add"));
      onSuccess();
      onClose();
    } catch (_err: any) {
      const parsed = parseApiError(_err, t("master.uom.messages.error"));
      setError(parsed.detail || parsed.title);
      notify.error({
        title: parsed.title,
        detail: parsed.detail
      });
    } finally {
      setLoading(false);
    }
  };

  const dimensionOptions = dimensionTypes.map(dt => ({
    label: t(`master.uom.dimension_types.${dt}`) || dt,
    value: dt
  }));

  // Only UOMs with base_unit_code === null can be selected as a Base Unit
  // This enforces a 1-level hierarchy.
  const baseUnitOptions = availableUnits
    .filter(u => u.dimension_type === formData.dimension_type && u.base_unit_code === null && (!unit || u.code !== unit.code))
    .map(u => ({
      label: `${u.name} (${u.abbreviation})`,
      value: u.code
    }));

  const handleBaseUnitChange = (opt: any) => {
    const newBaseUnitCode = opt?.value || "";
    setFormData({ 
        ...formData, 
        base_unit_code: newBaseUnitCode,
        // If base unit is cleared, reset factor to 1
        base_factor: newBaseUnitCode === "" ? 1 : formData.base_factor
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? t("master.uom.modals.edit_title") : t("master.uom.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.code")}</Form.Label>
                <Form.Control
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="KG"
                  maxLength={10}
                  data-testid="uom-code-input"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.name")}</Form.Label>
                <Form.Control
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kilogram"
                  data-testid="uom-name-input"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.abbreviation")}</Form.Label>
                <Form.Control
                  required
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="kg"
                  data-testid="uom-abbr-input"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.dimension")}</Form.Label>
                <Select
                  options={dimensionOptions}
                  value={dimensionOptions.find(o => o.value === formData.dimension_type)}
                  onChange={(opt: any) => setFormData({ ...formData, dimension_type: opt.value, base_unit_code: "", base_factor: 1 })}
                  classNamePrefix="react-select"
                  data-testid="uom-dimension-select"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.base_unit")}</Form.Label>
                <div data-testid="uom-base-unit-select">
                    <Select
                      options={baseUnitOptions}
                      value={baseUnitOptions.find(o => o.value === formData.base_unit_code)}
                      onChange={handleBaseUnitChange}
                      isClearable
                      placeholder={t("master.uom.fields.base_unit_placeholder")}
                      classNamePrefix="react-select"
                    />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.base_factor")}</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  min="0.0001"
                  value={formData.base_factor}
                  onChange={(e) => setFormData({ ...formData, base_factor: parseFloat(e.target.value) || 1 })}
                  placeholder="1"
                  disabled={!formData.base_unit_code}
                  data-testid="uom-factor-input"
                />
                <Form.Text className="text-muted">
                  {t("master.uom.fields.base_factor_help")}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.uom.fields.sort_order")}</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  data-testid="uom-sort-order-input"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="is_active"
                  label={t("master.uom.fields.is_active")}
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  data-testid="uom-active-switch"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={loading}>
            {t("master.uom.buttons.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={loading} data-testid="uom-submit-btn">
            {loading ? t("master.uom.buttons.saving") : t("master.uom.buttons.save")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UomModal;
