import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { notify } from "../../../../../common/notify";
import { useTenantRoute } from "../../../../../common/tenantRoute";

interface CategoryModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any;
  module: string;
  parents: any[];
}

const CategoryModal = ({
  show,
  onClose,
  onSuccess,
  category,
  module,
  parents
}: CategoryModalProps) => {
  const { t } = useTranslation("master");
  const tenantRoute = useTenantRoute();
  const isEdit = !!category;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sub_type: "pengeluaran",
    parent_id: "",
    icon: "ri-apps-2-line",
    color: "primary",
    is_active: true
  });

  useEffect(() => {
    if (show) {
      if (category) {
        setFormData({
          name: category.name,
          sub_type: category.sub_type || "pengeluaran",
          parent_id: category.parent_id || "",
          icon: category.icon || "ri-apps-2-line",
          color: category.color || "primary",
          is_active: category.is_active ?? true
        });
      } else {
        setFormData({
          name: "",
          sub_type: "pengeluaran",
          parent_id: "",
          icon: "ri-apps-2-line",
          color: "primary",
          is_active: true
        });
      }
      setError(null);
    }
  }, [show, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit
      ? tenantRoute.apiTo(`/finance/categories/${category.id}`)
      : tenantRoute.apiTo("/finance/categories");

    try {
      await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: {
          ...formData,
          module,
          parent_id: formData.parent_id || null
        }
      });
      notify.success(t("master.categories.messages.success_update"));
      onSuccess();
      onClose();
    } catch (_err: any) {
        setError(_err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const parentOptions = parents
    .filter(p => !category || p.id !== category.id)
    .map(p => ({ label: p.name, value: p.id }));

  const colorOptions = [
    { label: "Primary", value: "primary" },
    { label: "Success", value: "success" },
    { label: "Danger", value: "danger" },
    { label: "Warning", value: "warning" },
    { label: "Info", value: "info" },
    { label: "Secondary", value: "secondary" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? t("master.categories.modals.edit_title") : t("master.categories.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>{t("master.categories.fields.name")}</Form.Label>
            <Form.Control
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Form.Group>

          {module === 'finance' && (
            <Form.Group className="mb-3">
              <Form.Label>{t("master.categories.fields.type")}</Form.Label>
              <div className="d-flex gap-3">
                {['pemasukan', 'pengeluaran'].map(type => (
                  <Form.Check
                    key={type}
                    type="radio"
                    id={`modal-type-${type}`}
                    label={type === 'pemasukan' ? "Pemasukan" : "Pengeluaran"}
                    name="modal-type"
                    checked={formData.sub_type === type}
                    onChange={() => setFormData({ ...formData, sub_type: type })}
                  />
                ))}
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>{t("master.categories.fields.parent")}</Form.Label>
            <Select
              options={parentOptions}
              value={parentOptions.find(o => o.value === formData.parent_id)}
              onChange={(opt: any) => setFormData({ ...formData, parent_id: opt?.value || "" })}
              isClearable
              classNamePrefix="react-select"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.icon")}</Form.Label>
                <div className="input-group">
                  <span className="input-group-text"><i className={formData.icon}></i></span>
                  <Form.Control
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="ri-apps-2-line"
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("master.categories.fields.color")}</Form.Label>
                <Select
                  options={colorOptions}
                  value={colorOptions.find(o => o.value === formData.color)}
                  onChange={(opt: any) => setFormData({ ...formData, color: opt.value })}
                  classNamePrefix="react-select"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
