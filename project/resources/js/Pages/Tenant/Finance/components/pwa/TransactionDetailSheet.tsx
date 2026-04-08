import React, { useEffect, useState } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { useTenantRoute } from "../../../../../common/tenantRoute";

import { CARD_RADIUS, formatAmount, formatDateLabel } from "./types";

interface TransactionDetailSheetProps {
    show: boolean;
    transaction: any | null;
    defaultCurrency: string;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onAddToGroup: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

const DetailRow = ({ label, value, muted = false }: { label: string; value: React.ReactNode; muted?: boolean }) => (
    <div className="d-flex justify-content-between gap-3 py-2">
        <span className="small text-muted">{label}</span>
        <span className={`text-end ${muted ? "text-muted small" : "fw-medium text-dark"}`}>{value || "-"}</span>
    </div>
);

const DottedDivider = () => <div className="my-3" style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.8)" }} />;

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white shadow-sm p-3 mt-4" style={{ borderRadius: CARD_RADIUS }}>
        <div className="fw-semibold text-dark mb-3">{title}</div>
        {children}
    </div>
);



const formatTimeLabel = (value?: string | null) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const TransactionDetailSheet = ({
    show,
    transaction,
    defaultCurrency,
    onClose,
    onEdit,
    onDuplicate,
    onAddToGroup,
    onDelete,
    canEdit = false,
    canDelete = false,
}: TransactionDetailSheetProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFailedImages({});
    }, [show, transaction?.id]);

    if (!transaction) {
        return null;
    }

    const incoming = transaction.type === "pemasukan" || transaction.transfer_direction === "in";
    const amountClass = incoming ? "text-info" : transaction.type === "transfer" ? "text-primary" : "text-danger";
    const prefix = incoming ? "+" : "-";
    const headerIcon = transaction.category?.icon || (transaction.type === "pemasukan" ? "ri-arrow-down-circle-line" : transaction.type === "pengeluaran" ? "ri-arrow-up-circle-line" : "ri-loop-left-line");
    const budgetStatusLabel = transaction.budget_status ? t(`finance.budgets.status.${transaction.budget_status === "within_budget" ? "within" : transaction.budget_status === "over_budget" ? "over" : "unbudgeted"}`) : null;
    const isGrouped = transaction.source_type === "finance_bulk" && !!transaction.source_id;
    const groupLabel = transaction.merchant_name || transaction.notes || transaction.description || "Bulk Entry";
    const pairedTransaction = transaction.paired_transaction || null;
    const sourceAccount = transaction.transfer_direction === "out" ? transaction.bank_account : pairedTransaction?.bank_account;
    const sourcePocket = transaction.transfer_direction === "out" ? transaction.pocket : pairedTransaction?.pocket;
    const targetAccount = transaction.transfer_direction === "in" ? transaction.bank_account : pairedTransaction?.bank_account;
    const targetPocket = transaction.transfer_direction === "in" ? transaction.pocket : pairedTransaction?.pocket;
    const allAttachments = Array.isArray(transaction.attachments) ? transaction.attachments : [];
    const imageAttachments = allAttachments.filter((attachment: any) => String(attachment.mime_type || "").startsWith("image/"));
    const fileAttachments = allAttachments.filter((attachment: any) => !String(attachment.mime_type || "").startsWith("image/"));
    const attachmentPreviewUrl = (attachmentId: string | number) => tenantRoute.apiTo(
        `/finance/transactions/${transaction.id}/attachments/${attachmentId}/preview`
    );
    const budgetMode = transaction.pocket?.budget_lock_enabled ? "Locked" : transaction.pocket?.default_budget_key || transaction.pocket?.default_budget_id ? "Recommended" : "Flexible";
    const activeBudget = transaction.budget || transaction.pocket?.default_budget || null;
    const budgetRemaining = transaction.budget?.remaining_amount ?? activeBudget?.remaining_amount ?? null;
    const tagLabel = Array.isArray(transaction.tags) && transaction.tags.length > 0
        ? transaction.tags.map((tag: any) => tag.name || tag).join(", ")
        : null;

    if (!show) {
        return null;
    }

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100"
            data-testid="finance-transaction-detail"
            style={{
                background: "rgba(15, 23, 42, 0.34)",
                zIndex: 1100,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            <div
                className="position-absolute top-0 start-50 translate-middle-x bg-white shadow-lg d-flex flex-column"
                style={{
                    width: "min(100%, 430px)",
                    height: "100dvh",
                    maxHeight: "100dvh",
                }}
            >
                <div
                    className="px-3 pt-3 pb-2 border-bottom d-flex align-items-center justify-content-between"
                    style={{
                        paddingTop: "max(16px, env(safe-area-inset-top))",
                        background: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                    }}
                >
                    <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onClose} data-testid="finance-detail-close">
                        <i className="ri-arrow-left-line fs-5"></i>
                    </button>
                    <div className="fw-semibold text-dark">{t("finance.pwa.detail.receipt")}</div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDuplicate} data-testid="finance-detail-duplicate">
                            <i className="ri-file-copy-line fs-5"></i>
                        </button>
                        {canEdit && transaction.type !== "transfer" && (
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onEdit} data-testid="finance-detail-edit">
                                <i className="ri-pencil-line fs-5"></i>
                            </button>
                        )}
                        {canDelete && (
                            <button type="button" className="btn btn-danger-subtle text-danger rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDelete} data-testid="finance-detail-delete">
                                <i className="ri-delete-bin-line fs-5"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto px-4 py-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                    {/* Top Hero Card */}
                    <div className="card ribbon-box ribbon-fill right overflow-hidden border-0 shadow-sm mx-auto mt-2" style={{ borderRadius: CARD_RADIUS }}>
                        <div className="card-body text-center p-4">
                            <div className="ribbon ribbon-success">
                                {incoming ? "RECORDED" : transaction.type === "transfer" ? "TRANSFER" : "SPENT"}
                            </div>

                            <div
                                className="mx-auto d-inline-flex align-items-center justify-content-center rounded-4 mb-3 shadow-sm"
                                style={{
                                    width: 72,
                                    height: 72,
                                    background: incoming ? "rgba(14, 165, 233, 0.05)" : transaction.type === "transfer" ? "rgba(59, 130, 246, 0.05)" : "rgba(239, 68, 68, 0.05)",
                                    border: `1px solid ${incoming ? "rgba(14, 165, 233, 0.2)" : transaction.type === "transfer" ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                                }}
                            >
                                <i className={`${headerIcon} fs-1 ${amountClass}`}></i>
                            </div>

                            <div className="fw-semibold text-dark mb-1" style={{ fontSize: "1.1rem" }}>
                                {transaction.description || transaction.category?.name || t("finance.shared.untitled")}
                            </div>

                            <div className="fw-bold text-dark" style={{ fontSize: "2rem", letterSpacing: "-0.5px" }}>
                                {prefix} {formatAmount(Number(transaction.amount || 0), transaction.currency_code || defaultCurrency)}
                            </div>

                            <div className="small mt-2" style={{ color: "#94a3b8" }}>
                                <span className="badge bg-light text-dark rounded-pill border px-3 py-1 fw-normal text-muted">
                                    {formatDateLabel(String(transaction.transaction_date).slice(0, 10))} • {formatTimeLabel(transaction.created_at)}
                                </span>
                            </div>

                            <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
                                <div className="badge bg-dark rounded-pill px-3 py-2 d-flex align-items-center gap-1 shadow-sm">
                                    <i className="ri-user-line"></i> {transaction.owner_member?.full_name || "Member"}
                                </div>
                                <div className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 shadow-sm text-white" style={{ background: '#f59e0b' }}>
                                    <i className="ri-bank-card-line"></i> {transaction.type === "transfer" ? (sourceAccount?.name || "-") : (transaction.bank_account?.name || "Account")}
                                </div>
                                <div className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 shadow-sm text-white" style={{ background: '#3b82f6' }}>
                                    <i className="ri-wallet-3-line"></i> {transaction.type === "transfer" ? (sourcePocket?.name || "-") : (transaction.pocket?.name || "Wallet")}
                                </div>
                                {isGrouped && (
                                    <div className="badge bg-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-1 shadow-sm">
                                        <i className="ri-links-line"></i> Grouped
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Cards */}
                    <div className="row g-3 mt-1">
                        <div className="col-6">
                            <div className="card border shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}>
                                <div className="card-body p-3 position-relative overflow-hidden">
                                    <div className="text-muted fw-bold mb-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>BUDGET</div>
                                    <div className="fw-bold fs-5 text-dark" style={{ zIndex: 1, position: 'relative' }}>{activeBudget?.name || t("finance.shared.not_set")}</div>
                                    <div className="small text-muted mt-1" style={{ zIndex: 1, position: 'relative' }}>
                                        {budgetRemaining !== null && budgetRemaining !== undefined
                                            ? `Remaining: ${formatAmount(Number(budgetRemaining || 0), defaultCurrency)}`
                                            : `Status: ${budgetStatusLabel || "Not set"}`
                                        }
                                    </div>
                                    
                                    <div className="position-absolute" style={{ right: '-10px', bottom: '-10px', opacity: 0.05, zIndex: 0 }}>
                                        <i className="ri-focus-3-line" style={{ fontSize: '5rem' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div className="card border-0 shadow-sm h-100 text-white" style={{ borderRadius: CARD_RADIUS, background: transaction.type === "transfer" ? "#3b82f6" : incoming ? "#10b981" : "#ef4444" }}>
                                <div className="card-body p-3 position-relative overflow-hidden">
                                    <div className="text-white-50 fw-bold mb-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>TYPE</div>
                                    <div className="fw-bold fs-5 text-white" style={{ zIndex: 1, position: 'relative' }}>{t(`finance.transactions.types.${transaction.type}`)}</div>
                                    <div className="small text-white-50 mt-1" style={{ fontSize: '0.75rem', zIndex: 1, position: 'relative' }}>{transaction.category?.name || t("finance.shared.uncategorized")}</div>
                                    
                                    <div className="position-absolute" style={{ right: '0', bottom: '0', background: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderTopLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={`${transaction.type === "transfer" ? "ri-arrow-left-right-line" : incoming ? "ri-arrow-right-up-line" : "ri-arrow-right-down-line"} fs-4`}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan */}
                    <div className="card shadow-sm mt-3 border-0" style={{ borderRadius: CARD_RADIUS }}>
                        <div className="card-body p-4">
                            <div className="text-muted fw-bold mb-3" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>RINGKASAN</div>

                            <div className="d-flex flex-column gap-2 mb-0">
                                <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                    <span className="text-uppercase">{t("finance.modals.transaction.fields.category")}</span>
                                    <span className="d-flex align-items-center gap-1"><i className="ri-price-tag-3-line"></i> {transaction.category?.name || t("finance.shared.uncategorized")}</span>
                                </div>
                                {transaction.type === "transfer" ? (
                                    <>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.transfers.fields.from_account")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-bank-card-line"></i> {sourceAccount?.name || "-"}</span>
                                        </div>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.transfers.fields.from_wallet")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-wallet-3-line"></i> {sourcePocket?.name || "-"}</span>
                                        </div>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.transfers.fields.to_account")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-bank-card-fill"></i> {targetAccount?.name || "-"}</span>
                                        </div>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.transfers.fields.to_wallet")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-wallet-3-line"></i> {targetPocket?.name || "-"}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.modals.transaction.fields.account")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-bank-card-line"></i> {transaction.bank_account?.name || "-"}</span>
                                        </div>
                                        <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                            <span className="text-uppercase">{t("finance.pwa.filters.wallet")}</span>
                                            <span className="d-flex align-items-center gap-1"><i className="ri-wallet-3-line"></i> {transaction.pocket?.name || "-"}</span>
                                        </div>
                                    </>
                                )}
                                <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                    <span className="text-uppercase">{t("finance.modals.transaction.fields.budget")}</span>
                                    <span className="d-flex align-items-center gap-1"><i className="ri-focus-3-line"></i> {activeBudget?.name || t("finance.shared.not_set")}</span>
                                </div>
                                <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                    <span className="text-uppercase">Budget Mode</span>
                                    <span className="d-flex align-items-center gap-1"><i className="ri-lock-2-line"></i> {budgetMode}</span>
                                </div>
                                {tagLabel && (
                                    <div className="border border-success rounded-pill px-3 py-2 d-flex justify-content-between text-success fw-medium small" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                                        <span className="text-uppercase">{t("finance.modals.transaction.fields.tags")}</span>
                                        <span className="d-flex align-items-center gap-1"><i className="ri-price-tag-3-line"></i> {tagLabel}</span>
                                    </div>
                                )}
                            </div>
                            {transaction.notes && (
                                <>
                                    <DottedDivider />
                                    <div className="text-muted fw-bold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>NOTES</div>
                                    <p className="fw-medium text-dark mb-0" style={{ fontSize: '0.9rem' }}>
                                        {transaction.notes}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <SectionCard title="Metadata">
                        <DetailRow label={t("finance.shared.time")} value={formatTimeLabel(transaction.created_at)} muted />
                        <DetailRow label={t("finance.modals.transaction.fields.owner_member")} value={transaction.owner_member?.full_name || "-"} />
                        <DetailRow label={t("finance.modals.transaction.fields.merchant_name")} value={transaction.merchant_name || t("finance.shared.not_set")} muted={!transaction.merchant_name} />
                        <DetailRow label={t("finance.modals.transaction.fields.location")} value={transaction.location || t("finance.shared.not_set")} muted={!transaction.location} />
                        <DetailRow label={t("finance.modals.transaction.fields.reference_number")} value={transaction.reference_number || t("finance.shared.not_set")} muted={!transaction.reference_number} />
                        <DetailRow label={t("finance.modals.transaction.fields.payment_method_optional")} value={transaction.payment_method || t("finance.shared.not_set")} muted={!transaction.payment_method} />
                        <DetailRow label={t("finance.shared.created_by")} value={transaction.createdBy?.full_name || transaction.created_by?.full_name || "-"} muted />
                        <DetailRow label={t("finance.shared.created_at")} value={transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"} muted />
                        {transaction.row_version ? <DetailRow label="Row Version" value={`v${transaction.row_version}`} muted /> : null}
                        {isGrouped && (
                            <>
                                <DottedDivider />
                                <DetailRow label="Grouped As" value={groupLabel} muted />
                                <div className="d-grid gap-2 mt-3">
                                    <button type="button" className="btn btn-light rounded-pill" onClick={onAddToGroup}>
                                        <i className="ri-add-line me-1"></i>
                                        Tambah Item ke Grup Ini
                                    </button>
                                </div>
                            </>
                        )}
                    </SectionCard>

                    <SectionCard title="Lampiran">
                        {(imageAttachments.length > 0 || fileAttachments.length > 0) ? (
                            <div className="py-2">
                                <div className="d-grid gap-3">
                                    {imageAttachments.map((attachment: any) => {
                                        const attachmentStatus = attachment.status || "ready";
                                        const previewUrl = attachment.preview_url || attachmentPreviewUrl(attachment.id);
                                        const imageStateKey = `${String(transaction.id)}:${String(attachment.id)}`;
                                        const failed = attachmentStatus === "failed" || failedImages[imageStateKey] || !previewUrl;
                                        const processing = attachmentStatus === "processing";

                                        return (
                                            <div key={attachment.id} className="rounded-4 border overflow-hidden bg-light">
                                                {processing ? (
                                                    <div className="px-3 py-4 text-center">
                                                        <Badge bg="info-subtle" text="info" className="rounded-pill px-3 py-2">
                                                            Sedang diproses
                                                        </Badge>
                                                    </div>
                                                ) : failed ? (
                                                    <div className="px-3 py-4 text-center">
                                                        <div className="small text-muted">{attachment.processing_error || "Gagal memuat gambar"}</div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={previewUrl}
                                                        alt={attachment.file_name || `Lampiran ${attachment.id}`}
                                                        className="w-100 d-block"
                                                        style={{ maxHeight: 280, objectFit: "cover", background: "#f8fafc" }}
                                                        onError={() => setFailedImages((prev) => ({ ...prev, [imageStateKey]: true }))}
                                                    />
                                                )}
                                                <div className="px-3 py-2 bg-white border-top">
                                                    <div className="fw-medium text-dark text-truncate">{attachment.file_name || `Lampiran ${attachment.id}`}</div>
                                                    <div className="small text-muted">
                                                        {attachment.mime_type || "image"}
                                                        {attachment.file_size ? ` · ${(Number(attachment.file_size) / 1024).toFixed(0)} KB` : ""}
                                                        {processing ? " · sedang diproses" : ""}
                                                        {attachmentStatus === "failed" ? " · gagal diproses" : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {fileAttachments.length > 0 && (
                                        <div className="d-grid gap-2">
                                            {fileAttachments.map((attachment: any) => (
                                                <a
                                                    key={attachment.id}
                                                    href={attachment.preview_url || attachmentPreviewUrl(attachment.id) || "#"}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`btn btn-light text-start rounded-4 border px-3 py-2${attachment.status === "processing" || attachment.status === "failed" ? " disabled" : ""}`}
                                                    aria-disabled={attachment.status === "processing" || attachment.status === "failed"}
                                                    onClick={(event) => {
                                                        if (attachment.status === "processing" || attachment.status === "failed") {
                                                            event.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between gap-3">
                                                        <div className="overflow-hidden">
                                                            <div className="fw-medium text-dark text-truncate">{attachment.file_name || `Lampiran ${attachment.id}`}</div>
                                                            <div className="small text-muted">
                                                                {attachment.mime_type || "file"}
                                                                {attachment.file_size ? ` · ${(Number(attachment.file_size) / 1024).toFixed(0)} KB` : ""}
                                                                {attachment.status === "processing" ? " · sedang diproses" : ""}
                                                                {attachment.status === "failed" ? " · gagal diproses" : ""}
                                                            </div>
                                                        </div>
                                                        <i className="ri-attachment-2 fs-5 text-muted"></i>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="small text-muted">Belum ada attachment.</div>
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailSheet;
