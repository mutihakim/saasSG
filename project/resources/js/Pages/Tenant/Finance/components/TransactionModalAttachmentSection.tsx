import React from "react";
import { Button, Form } from "react-bootstrap";

import { TransactionAttachment } from "./transactionModalTypes";

type Props = {
    existingAttachments: TransactionAttachment[];
    pendingFiles: File[];
    transactionId?: string | number;
    attachmentPreviewUrl: (transactionId: string | number, attachmentId: string | number) => string;
    handleAttachmentPick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveExistingAttachment: (attachmentId: string | number) => void;
    handleRemovePendingFile: (index: number) => void;
};

const TransactionModalAttachmentSection = ({
    existingAttachments,
    pendingFiles,
    transactionId,
    attachmentPreviewUrl,
    handleAttachmentPick,
    handleRemoveExistingAttachment,
    handleRemovePendingFile,
}: Props) => (
    <div className="px-3 pb-3 bg-white">
        <div className="small text-muted mb-2">Lampiran</div>
        <Form.Control
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleAttachmentPick}
        />
        <Form.Text className="text-muted">
            Upload foto struk, resi, atau PDF. File akan disimpan setelah transaksi berhasil dibuat.
        </Form.Text>
        {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
            <div className="d-grid gap-2 mt-3">
                {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 rounded-4 border px-3 py-2">
                        <div className="overflow-hidden flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-medium text-dark text-truncate">{attachment.file_name || `Lampiran ${attachment.id}`}</div>
                            <div className="small text-muted">
                                {attachment.mime_type || "file"}
                                {attachment.file_size ? ` · ${(Number(attachment.file_size) / 1024).toFixed(0)} KB` : ""}
                                {attachment.status === "processing" ? " · sedang diproses" : ""}
                                {attachment.status === "failed" ? " · gagal diproses" : ""}
                            </div>
                        </div>
                        <div className="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">
                            {transactionId && attachment.status !== "processing" && attachment.status !== "failed" && (
                                <a
                                    className="btn btn-sm btn-light"
                                    href={attachment.preview_url || attachmentPreviewUrl(transactionId, attachment.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Lihat
                                </a>
                            )}
                            <Button type="button" size="sm" variant="outline-danger" onClick={() => handleRemoveExistingAttachment(attachment.id)}>
                                Hapus
                            </Button>
                        </div>
                    </div>
                ))}
                {pendingFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 rounded-4 border border-dashed px-3 py-2 bg-light">
                        <div className="overflow-hidden flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-medium text-dark text-truncate">{file.name}</div>
                            <div className="small text-muted">{(file.size / 1024).toFixed(0)} KB · menunggu upload</div>
                        </div>
                        <Button type="button" size="sm" variant="outline-secondary" className="align-self-end" onClick={() => handleRemovePendingFile(index)}>
                            Batal
                        </Button>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default TransactionModalAttachmentSection;
