import React, { useMemo, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

type Props = {
  show: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  title: string;
  entityLabel: string;
  entityName: string;
  message: string;
  warnings?: string[];
  confirmLabel?: string;
  closeLabel?: string;
};

const DangerDeleteModal = ({
  show,
  onConfirm,
  onClose,
  loading = false,
  title,
  entityLabel,
  entityName,
  message,
  warnings = [],
  confirmLabel = "Ya, Hapus",
  closeLabel = "Batal",
}: Props) => {
  const [confirmation, setConfirmation] = useState("");

  const normalizedEntityName = useMemo(() => entityName.trim(), [entityName]);
  const canConfirm = normalizedEntityName.length > 0 && confirmation.trim() === normalizedEntityName;

  return (
    <Modal show={show} onHide={onClose} centered style={{ zIndex: 1400 }}>
      <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 20 }}>
        <Modal.Header className="pt-4 px-4 pb-2 border-0" closeButton />
        <Modal.Body className="px-4 pb-4">
          <div className="text-center mb-4">
            <div
              className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: 72, height: 72, background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}
            >
              <i className="ri-error-warning-line display-6" />
            </div>
            <h4 className="mb-2">{title}</h4>
            <p className="text-muted mb-0">{message}</p>
          </div>

          <div className="rounded-4 border p-3 mb-3" style={{ background: "rgba(248, 250, 252, 0.9)" }}>
            <div className="small text-uppercase text-muted fw-bold mb-1" style={{ letterSpacing: "0.8px" }}>
              {entityLabel}
            </div>
            <div className="fw-bold text-dark">{entityName}</div>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-4 border p-3 mb-3" style={{ background: "rgba(254, 242, 242, 0.95)", borderColor: "rgba(248, 113, 113, 0.25)" }}>
              <div className="small text-uppercase text-danger fw-bold mb-2" style={{ letterSpacing: "0.8px" }}>
                Perhatian
              </div>
              <div className="d-flex flex-column gap-2">
                {warnings.map((warning) => (
                  <div key={warning} className="d-flex align-items-start gap-2 text-danger small">
                    <i className="ri-arrow-right-s-line mt-1" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold small text-uppercase text-muted">
              Ketik nama {entityLabel.toLowerCase()} untuk konfirmasi
            </Form.Label>
            <Form.Control
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={entityName}
              autoComplete="off"
            />
            <Form.Text className="text-muted">
              Tindakan ini tidak bisa dipulihkan dari UI.
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="light" onClick={onClose} disabled={loading}>
              {closeLabel}
            </Button>
            <Button variant="danger" onClick={onConfirm} disabled={loading || !canConfirm}>
              {loading ? "Menghapus..." : confirmLabel}
            </Button>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default DangerDeleteModal;
