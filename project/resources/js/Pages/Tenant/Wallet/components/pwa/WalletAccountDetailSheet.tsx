import React from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type Props = {
    show: boolean;
    account: any | null;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
};

const DetailRow = ({ label, value, muted = false }: { label: string; value: React.ReactNode; muted?: boolean }) => (
    <div className="d-flex justify-content-between gap-3 py-2">
        <span className="small text-muted">{label}</span>
        <span className={`text-end ${muted ? "text-muted small" : "fw-medium text-dark"}`}>{value || "-"}</span>
    </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white shadow-sm p-3 mt-4 rounded-4">
        <div className="fw-semibold text-dark mb-3">{title}</div>
        {children}
    </div>
);

const MetricCard = ({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: React.ReactNode;
    icon: string;
    tone: "info" | "danger" | "success";
}) => {
    const palette = {
        info: { bg: "rgba(14, 165, 233, 0.12)", text: "text-info" },
        danger: { bg: "rgba(239, 68, 68, 0.12)", text: "text-danger" },
        success: { bg: "rgba(34, 197, 94, 0.12)", text: "text-success" },
    }[tone];

    return (
        <div className="rounded-4 border h-100 p-3">
            <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                    <div className="small text-muted">{label}</div>
                    <div className="fw-semibold text-dark mt-2">{value}</div>
                </div>
                <div
                    className={`rounded-circle d-inline-flex align-items-center justify-content-center ${palette.text}`}
                    style={{ width: 40, height: 40, background: palette.bg }}
                >
                    <i className={`${icon} fs-5`}></i>
                </div>
            </div>
        </div>
    );
};

const formatMoney = (currencyCode: string | undefined, value: number | string | null | undefined) =>
    `${String(currencyCode || "IDR")} ${Number(value || 0).toLocaleString("id-ID")}`;

const WalletAccountDetailSheet = ({ show, account, onClose, onEdit, onDuplicate, onDelete, canEdit = false, canDelete = false }: Props) => {
    const { t } = useTranslation();

    if (!show || !account) {
        return null;
    }

    const periodNet = Number(account.period_inflow || 0) - Number(account.period_outflow || 0);

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(15, 23, 42, 0.34)", zIndex: 1100, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div className="position-absolute top-0 start-50 translate-middle-x bg-white shadow-lg d-flex flex-column" style={{ width: "min(100%, 430px)", height: "100dvh", maxHeight: "100dvh" }}>
                <div className="px-3 pt-3 pb-2 border-bottom d-flex align-items-center justify-content-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
                    <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onClose}>
                        <i className="ri-arrow-left-line fs-5"></i>
                    </button>
                    <div className="fw-semibold text-dark">{t("wallet.detail.account_title")}</div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDuplicate}>
                            <i className="ri-file-copy-line fs-5"></i>
                        </button>
                        {canEdit && (
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onEdit}>
                                <i className="ri-pencil-line fs-5"></i>
                            </button>
                        )}
                        {canDelete && (
                            <button type="button" className="btn btn-danger-subtle text-danger rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDelete}>
                                <i className="ri-delete-bin-line fs-5"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto px-4 py-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                    <div className="text-center">
                        <div className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 72, height: 72, background: "rgba(14, 165, 233, 0.12)" }}>
                            <i className="ri-bank-card-line fs-1 text-info"></i>
                        </div>
                        <div className="small text-muted">{t(`wallet.account_types.${account.type}`)}</div>
                        <div className="fw-semibold text-dark mt-1">{account.name}</div>
                        <div className="fw-bold display-6 mt-3 mb-2 text-dark">{formatMoney(account.currency_code, account.current_balance)}</div>
                        <Badge bg={account.scope === "shared" ? "info-subtle" : "secondary-subtle"} text={account.scope === "shared" ? "info" : "secondary"} className="rounded-pill px-3 py-2">
                            {account.scope === "shared" ? t("wallet.scope.shared") : t("wallet.scope.private")}
                        </Badge>
                    </div>

                    <SectionCard title="Ringkasan">
                        <div className="row g-3">
                            <div className="col-12">
                                <MetricCard label="Available" value={formatMoney(account.currency_code, account.current_balance)} icon="ri-bank-card-line" tone="info" />
                            </div>
                            <div className="col-6">
                                <MetricCard label="Allocated" value={formatMoney(account.currency_code, account.allocated_amount)} icon="ri-layout-grid-line" tone="success" />
                            </div>
                            <div className="col-6">
                                <MetricCard label="Unallocated" value={formatMoney(account.currency_code, account.unallocated_amount)} icon="ri-safe-line" tone="info" />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Bulan Berjalan">
                        <div className="row g-3">
                            <div className="col-4">
                                <MetricCard label="Inflow" value={formatMoney(account.currency_code, account.period_inflow)} icon="ri-arrow-left-down-line" tone="info" />
                            </div>
                            <div className="col-4">
                                <MetricCard label="Outflow" value={formatMoney(account.currency_code, account.period_outflow)} icon="ri-arrow-right-up-line" tone="danger" />
                            </div>
                            <div className="col-4">
                                <MetricCard label="Net" value={formatMoney(account.currency_code, periodNet)} icon="ri-exchange-dollar-line" tone={periodNet >= 0 ? "success" : "danger"} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Arus Kas Total">
                        <div className="row g-3">
                            <div className="col-6">
                                <MetricCard label="Total Inflow" value={formatMoney(account.currency_code, account.total_inflow)} icon="ri-funds-line" tone="info" />
                            </div>
                            <div className="col-6">
                                <MetricCard label="Total Outflow" value={formatMoney(account.currency_code, account.total_outflow)} icon="ri-money-dollar-circle-line" tone="danger" />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Konfigurasi">
                        <DetailRow label={t("finance.accounts.fields.type")} value={t(`wallet.account_types.${account.type}`)} />
                        <DetailRow label={t("finance.accounts.fields.currency")} value={account.currency_code || "-"} />
                        <DetailRow label={t("finance.accounts.fields.opening_balance")} value={formatMoney(account.currency_code, account.opening_balance)} />
                        <DetailRow label={t("finance.accounts.fields.owner")} value={account.owner_member?.full_name || account.ownerMember?.full_name || "-"} />
                        <DetailRow label={t("finance.accounts.fields.status")} value={account.is_active ? t("finance.shared.active") : t("finance.shared.inactive")} />
                        <DetailRow label="Wallet Mismatch" value={formatMoney(account.currency_code, account.wallet_mismatch_amount)} />
                        <div className="my-3" style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.8)" }} />
                        <DetailRow label={t("finance.accounts.fields.notes")} value={account.notes || t("finance.shared.not_set")} muted />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default WalletAccountDetailSheet;
