import React from "react";
import { Button, Modal } from "react-bootstrap";

export type MediaPreviewItem = {
    url: string;
    title?: string | null;
    mimeType?: string | null;
};

type MediaPreviewModalProps = {
    show: boolean;
    item: MediaPreviewItem | null;
    onClose: () => void;
    title?: string;
};

const MediaPreviewModal = ({ show, item, onClose, title = "Preview" }: MediaPreviewModalProps) => {
    const mimeType = String(item?.mimeType || "");
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    return (
        <Modal show={show} onHide={onClose} centered size="lg" contentClassName="border-0 overflow-hidden" style={{ zIndex: 1500 }}>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fs-6">{item?.title || title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                {!item ? null : isImage ? (
                    <img
                        src={item.url}
                        alt={item.title || "Attachment"}
                        className="img-fluid rounded-4 w-100"
                        style={{ maxHeight: "70vh", objectFit: "contain", background: "#f8fafc" }}
                    />
                ) : isPdf ? (
                    <iframe
                        src={item.url}
                        title={item.title || "PDF attachment"}
                        className="w-100 rounded-4 border"
                        style={{ minHeight: "70vh", background: "#fff" }}
                    />
                ) : (
                    <div className="text-center py-5">
                        <div className="text-muted mb-3">Preview is not available for this file.</div>
                        <Button as="a" href={item.url} target="_blank" rel="noreferrer" variant="primary">
                            Open File
                        </Button>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default MediaPreviewModal;
