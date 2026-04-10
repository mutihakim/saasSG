import axios from "axios";
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

interface TagModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag?: any;
}

const TagModal = ({
  show,
  onClose,
  onSuccess,
  tag
}: TagModalProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const isEdit = !!tag;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    color: "#677abd",
    row_version: 1
  });

  useEffect(() => {
    if (show) {
      if (tag) {
        setFormData({
          name: tag.name,
          color: tag.color || "#677abd",
          row_version: tag.row_version || 1
        });
      } else {
        setFormData({
          name: "",
          color: "#677abd",
          row_version: 1
        });
      }
      setError(null);
    }
  }, [show, tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit
      ? tenantRoute.apiTo(`/master/tags/${tag.id}`)
      : tenantRoute.apiTo("/master/tags");

    try {
      await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: formData
      });
      notify.success(t(isEdit ? "master.tags.messages.success_update" : "master.tags.messages.success_add"));
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

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? t("master.tags.modals.edit_title") : t("master.tags.modals.add_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>{t("master.tags.fields.name")}</Form.Label>
            <Form.Control
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. penting, liburan"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t("master.tags.fields.color")}</Form.Label>
            <Form.Control
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="form-control-color w-100"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} className="w-100">{t("master.tags.buttons.cancel")}</Button>
          <Button variant="primary" type="submit" disabled={loading} className="w-100">
            {loading ? t("master.tags.buttons.saving") : t("master.tags.buttons.save")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TagModal;
