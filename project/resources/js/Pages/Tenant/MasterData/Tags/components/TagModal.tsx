import axios from "axios";
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { notify } from "../../../../../common/notify";
import { useTenantRoute } from "../../../../../common/tenantRoute";

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
  const { t } = useTranslation("master");
  const tenantRoute = useTenantRoute();
  const isEdit = !!tag;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    color: "#677abd"
  });

  useEffect(() => {
    if (show) {
      if (tag) {
        setFormData({
          name: tag.name,
          color: tag.color || "#677abd"
        });
      } else {
        setFormData({
          name: "",
          color: "#677abd"
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
      ? tenantRoute.apiTo(`/finance/tags/${tag.id}`)
      : tenantRoute.apiTo("/finance/tags");

    try {
      await axios({
        method: isEdit ? "patch" : "post",
        url,
        data: formData
      });
      notify.success(t(isEdit ? "messages.success_update" : "messages.success_add"));
      onSuccess();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? "Ubah Tagar" : "Tambah Tagar Baru"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nama Tagar</Form.Label>
            <Form.Control
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. penting, liburan"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Warna</Form.Label>
            <Form.Control
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="form-control-color w-100"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} className="w-100">Batal</Button>
          <Button variant="primary" type="submit" disabled={loading} className="w-100">
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TagModal;
