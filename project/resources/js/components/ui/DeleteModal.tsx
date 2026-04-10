import React from "react";
import { Button, Modal } from "react-bootstrap";

interface DeleteModalProps {
    show: boolean;
    onDeleteClick: () => void;
    onCloseClick: () => void;
    loading?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    closeLabel?: string;
}

const DeleteModal = ({
    show,
    onDeleteClick,
    onCloseClick,
    loading,
    title = "Are you sure?",
    message = "Are you sure you want to delete this record? This action cannot be undone.",
    confirmLabel = "Yes, Delete It!",
    closeLabel = "Close",
}: DeleteModalProps) => {
    return (
        <Modal show={show} onHide={onCloseClick} centered style={{ zIndex: 1400 }} data-testid="confirm-delete-modal">
            <div className="modal-content">
                <Modal.Header className="pt-4 px-4 pb-2 border-0" closeButton />
                <Modal.Body className="text-center px-4 pb-4">
                    <div className="text-danger">
                        <i className="ri-delete-bin-line display-4" />
                    </div>
                    <div className="mt-4">
                        <h4 className="mb-2">{title}</h4>
                        <p className="text-muted fs-14 mb-4">{message}</p>
                        <div className="d-flex gap-2 justify-content-center">
                            <Button variant="light" className="w-sm" onClick={onCloseClick} disabled={loading}>
                                {closeLabel}
                            </Button>
                            <Button
                                variant="danger"
                                className="w-sm"
                                onClick={onDeleteClick}
                                disabled={loading}
                                data-testid="confirm-delete-action"
                            >
                                {loading ? "Deleting..." : confirmLabel}
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </div>
        </Modal>
    );
};

export default DeleteModal;
