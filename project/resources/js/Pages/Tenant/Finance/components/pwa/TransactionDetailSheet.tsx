import React from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS, formatAmount, formatDateLabel } from "./types";

interface TransactionDetailSheetProps {
    show: boolean;
    transaction: any | null;
    defaultCurrency: string;
    onClose: () => void;
    onEdit: () => void;
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
    onDelete,
    canEdit = false,
    canDelete = false,
}: TransactionDetailSheetProps) => {
    const { t } = useTranslation();

    if (!transaction) {
        return null;
    }

    const incoming = transaction.type === "pemasukan" || transaction.transfer_direction === "in";
    const amountClass = incoming ? "text-info" : "text-danger";
    const prefix = incoming ? "+" : "-";
    const headerColor = transaction.type === "transfer" ? "text-primary" : amountClass;
    const headerIcon = transaction.category?.icon || (transaction.type === "pemasukan" ? "ri-arrow-down-circle-line" : transaction.type === "pengeluaran" ? "ri-arrow-up-circle-line" : "ri-loop-left-line");
    const budgetStatusLabel = transaction.budget_status ? t(`finance.budgets.status.${transaction.budget_status === "within_budget" ? "within" : transaction.budget_status === "over_budget" ? "over" : "unbudgeted"}`) : null;

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
                    <div className="text-center">
                        <div
                            className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                            style={{
                                width: 72,
                                height: 72,
                                background: incoming ? "rgba(14, 165, 233, 0.12)" : transaction.type === "transfer" ? "rgba(59, 130, 246, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            }}
                        >
                            <i className={`${headerIcon} fs-1 ${headerColor}`}></i>
                        </div>
                        <div className="small text-muted">{transaction.type === "transfer" ? t("finance.transactions.types.transfer") : transaction.category?.name || t("finance.shared.uncategorized")}</div>
                        <div className="fw-semibold text-dark mt-1">{transaction.description || transaction.category?.name || t("finance.shared.untitled")}</div>
                        <div className={`fw-bold display-6 mt-3 mb-2 ${amountClass}`}>
                            {prefix} {formatAmount(Number(transaction.amount || 0), transaction.currency_code || defaultCurrency)}
                        </div>
                        <div className="small text-muted">
                            {formatDateLabel(String(transaction.transaction_date).slice(0, 10))} · {formatTimeLabel(transaction.created_at)}
                        </div>
                        {transaction.budget_status === "over_budget" && (
                            <Badge bg="warning-subtle" text="warning" className="rounded-pill px-3 py-2">
                                {t("finance.budgets.status.over")}
                            </Badge>
                        )}
                    </div>

                    <div className="bg-white shadow-sm p-3 mt-4" style={{ borderRadius: CARD_RADIUS }}>
                        <DetailRow label={t("finance.modals.transaction.fields.type")} value={t(`finance.transactions.types.${transaction.type}`)} />
                        <DetailRow label={t("finance.modals.transaction.fields.date")} value={formatDateLabel(String(transaction.transaction_date).slice(0, 10))} />
                        <DetailRow label={t("finance.shared.time")} value={formatTimeLabel(transaction.created_at)} muted />
                        <DetailRow label={t("finance.modals.transaction.fields.category")} value={transaction.category?.name || t("finance.shared.uncategorized")} />
                        <DetailRow label={t("finance.modals.transaction.fields.account")} value={transaction.bank_account?.name || "-"} />
                        <DetailRow label={t("finance.modals.transaction.fields.owner_member")} value={transaction.owner_member?.full_name || "-"} />
                        {transaction.budget && (
                            <DetailRow
                                label={t("finance.modals.transaction.fields.budget")}
                                value={`${transaction.budget.name}${budgetStatusLabel ? ` · ${budgetStatusLabel}` : ""}`}
                            />
                        )}
                        {transaction.budget && transaction.budget_delta !== null && transaction.budget_delta !== undefined && (
                            <DetailRow
                                label={t("finance.budgets.labels.remaining")}
                                value={formatAmount(Number(transaction.budget.remaining_amount || 0), defaultCurrency)}
                                muted
                            />
                        )}
                        <DottedDivider />
                        <DetailRow label={t("finance.modals.transaction.fields.notes")} value={transaction.notes || t("finance.shared.not_set")} muted />
                        {transaction.merchant_name && <DetailRow label={t("finance.modals.transaction.fields.merchant_name")} value={transaction.merchant_name} muted />}
                        {transaction.location && <DetailRow label={t("finance.modals.transaction.fields.location")} value={transaction.location} muted />}
                        {transaction.reference_number && <DetailRow label={t("finance.modals.transaction.fields.reference_number")} value={transaction.reference_number} muted />}
                        {transaction.payment_method && <DetailRow label={t("finance.modals.transaction.fields.payment_method_optional")} value={transaction.payment_method} muted />}
                        {Array.isArray(transaction.tags) && transaction.tags.length > 0 && (
                            <DetailRow
                                label={t("finance.modals.transaction.fields.tags")}
                                value={transaction.tags.map((tag: any) => tag.name || tag).join(", ")}
                                muted
                            />
                        )}
                        <DottedDivider />
                        <DetailRow label={t("finance.shared.created_by")} value={transaction.created_by?.full_name || transaction.createdBy?.full_name || "-"} muted />
                        <DetailRow
                            label={t("finance.shared.created_at")}
                            value={transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
                            muted
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailSheet;
