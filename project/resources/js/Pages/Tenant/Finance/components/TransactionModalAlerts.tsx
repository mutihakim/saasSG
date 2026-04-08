import React from "react";
import { Alert } from "react-bootstrap";

import { LockedGroupMeta, TransactionDraftMeta } from "./transactionModalTypes";

type Props = {
    draftMeta?: TransactionDraftMeta;
    lockedGroupMeta?: LockedGroupMeta;
    sourceType?: string;
    sourceId?: string;
    merchantName?: string;
    setPreviewItem: React.Dispatch<React.SetStateAction<{ url: string; title?: string | null; mimeType?: string | null } | null>>;
    t: (key: string, options?: Record<string, unknown>) => string;
};

const TransactionModalAlerts = ({
    draftMeta,
    lockedGroupMeta,
    sourceType,
    sourceId,
    merchantName,
    setPreviewItem,
    t,
}: Props) => (
    <>
        {draftMeta?.source === "whatsapp" && (
            <Alert variant="info" className="rounded-4 border-0 mb-3">
                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <div>
                        <div className="fw-semibold">WhatsApp Draft</div>
                        <div className="small text-muted">
                            {draftMeta.confidenceScore !== null && draftMeta.confidenceScore !== undefined
                                ? `Confidence ${Math.round(draftMeta.confidenceScore * 100)}%`
                                : "Review detail transaksi sebelum submit."}
                        </div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        {(draftMeta.mediaItems && draftMeta.mediaItems.length > 0
                            ? draftMeta.mediaItems
                            : draftMeta.mediaPreviewUrl
                                ? [{ id: 0, preview_url: draftMeta.mediaPreviewUrl }]
                                : []
                        ).map((mediaItem, index) => (
                            <button
                                key={`${mediaItem.id}-${index}`}
                                type="button"
                                className="btn btn-sm btn-soft-primary"
                                onClick={() => setPreviewItem({
                                    url: mediaItem.preview_url,
                                    title: index === 0
                                        ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                        : `Lampiran ${index + 1}`,
                                    mimeType: mediaItem.mime_type || null,
                                })}
                            >
                                <i className={`${String(mediaItem.mime_type || "").startsWith("image/") ? "ri-image-line" : "ri-attachment-2"} me-1`} />
                                {index === 0
                                    ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                    : `Lampiran ${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            </Alert>
        )}
        {!!sourceType && !!sourceId && (
            <Alert variant="secondary" className="rounded-4 border-0 mb-3">
                <div className="fw-semibold">Bagian dari grup</div>
                <div className="small text-muted mt-1">
                    {lockedGroupMeta?.label || merchantName || "Bulk Entry"}
                </div>
            </Alert>
        )}
    </>
);

export default TransactionModalAlerts;
