import React from "react";
import { Button, Modal } from "react-bootstrap";

type PreviewItem = {
    url: string;
    title?: string | null;
    mimeType?: string | null;
};

interface AttachmentPreviewModalProps {
    show: boolean;
    item: PreviewItem | null;
    onClose: () => void;
}

const AttachmentPreviewModal = ({ show, item, onClose }: AttachmentPreviewModalProps) => {
    const mimeType = String(item?.mimeType || "");
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    return (
        <Modal show={show} onHide={onClose} centered size="lg" contentClassName="border-0 overflow-hidden" style={{ zIndex: 1500 }}>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fs-6">{item?.title || "Preview Lampiran"}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                {!item ? null : isImage ? (
                    <img
                        src={item.url}
                        alt={item.title || "Lampiran"}
                        className="img-fluid rounded-4 w-100"
                        style={{ maxHeight: "70vh", objectFit: "contain", background: "#f8fafc" }}
                    />
                ) : isPdf ? (
                    <iframe
                        src={item.url}
                        title={item.title || "Lampiran PDF"}
                        className="w-100 rounded-4 border"
                        style={{ minHeight: "70vh", background: "#fff" }}
                    />
                ) : (
                    <div className="text-center py-5">
                        <div className="text-muted mb-3">Preview tidak tersedia untuk file ini.</div>
                        <Button as="a" href={item.url} target="_blank" rel="noreferrer" variant="primary">
                            Buka File
                        </Button>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default AttachmentPreviewModal;
