import { router } from "@inertiajs/react";
import React, { useMemo } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS } from "./types";

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

const DottedDivider = () => <div className="my-3" style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.8)" }} />;

const SectionCard = ({ title, children, noPadding = false }: { title: string; children: React.ReactNode; noPadding?: boolean }) => (
    <div className="bg-white shadow-sm mt-4 overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
        <div className="fw-bold text-dark px-3 pt-3 pb-2 small text-uppercase" style={{ letterSpacing: "1px", opacity: 0.5, fontSize: "0.65rem" }}>{title}</div>
        <div className={noPadding ? "" : "p-3 pt-0"}>
            {children}
        </div>
    </div>
);

const MetricRowPill = ({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: React.ReactNode;
    icon: string;
    tone: "info" | "danger" | "success" | "warning";
}) => {
    const palette = {
        info: { bg: "rgba(14, 165, 233, 0.08)", text: "text-info", border: "rgba(14, 165, 233, 0.2)" },
        danger: { bg: "rgba(239, 68, 68, 0.08)", text: "text-danger", border: "rgba(239, 68, 68, 0.2)" },
        success: { bg: "rgba(34, 197, 94, 0.08)", text: "text-success", border: "rgba(34, 197, 94, 0.2)" },
        warning: { bg: "rgba(245, 158, 11, 0.08)", text: "text-warning", border: "rgba(245, 158, 11, 0.2)" },
    }[tone];

    return (
        <div className="px-3 py-2 mb-2 d-flex align-items-center justify-content-between rounded-pill border mx-3 mt-1" style={{ background: palette.bg, borderColor: palette.border }}>
            <div className="d-flex align-items-center gap-2 overflow-hidden">
                <i className={`${icon} ${palette.text} fs-5 flex-shrink-0`}></i>
                <span className="small fw-semibold text-muted text-uppercase text-truncate" style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}>{label}</span>
            </div>
            <div className={`fw-bold ${palette.text} text-nowrap ms-2`}>{value}</div>
        </div>
    );
};

const DetailRow = ({ label, value, muted = false }: { label: string; value: React.ReactNode; muted?: boolean }) => (
    <div className="d-flex justify-content-between gap-3 py-2 px-3">
        <span className="small text-muted">{label}</span>
        <span className={`text-end ${muted ? "text-muted small" : "fw-medium text-dark"}`}>{value || "-"}</span>
    </div>
);

const formatMoney = (currencyCode: string | undefined, value: number | string | null | undefined) =>
    `${String(currencyCode || "IDR")} ${Number(value || 0).toLocaleString("id-ID")}`;

const getAccountProfile = (type?: string) => {
    switch (type) {
        case "cash":
            return {
                icon: "ri-coins-line",
                label: "Cash Account",
                ribbon: "CASH",
                tone: "success",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(34, 197, 94, 0.06) 100%)",
                border: "rgba(34, 197, 94, 0.22)",
            };
        case "bank":
            return {
                icon: "ri-bank-line",
                label: "Bank Account",
                ribbon: "BANK",
                tone: "info",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(14, 165, 233, 0.06) 100%)",
                border: "rgba(14, 165, 233, 0.22)",
            };
        case "ewallet":
            return {
                icon: "ri-wallet-3-line",
                label: "E-Wallet",
                ribbon: "E-WALLET",
                tone: "primary",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(59, 130, 246, 0.06) 100%)",
                border: "rgba(59, 130, 246, 0.22)",
            };
        case "credit_card":
            return {
                icon: "ri-bank-card-line",
                label: "Credit Card",
                ribbon: "CREDIT",
                tone: "warning",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(245, 158, 11, 0.06) 100%)",
                border: "rgba(245, 158, 11, 0.22)",
            };
        case "paylater":
            return {
                icon: "ri-secure-payment-line",
                label: "Paylater",
                ribbon: "PAYLATER",
                tone: "danger",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(239, 68, 68, 0.06) 100%)",
                border: "rgba(239, 68, 68, 0.22)",
            };
        default:
            return {
                icon: "ri-bank-card-line",
                label: "Account",
                ribbon: "ACCOUNT",
                tone: "info",
                gradient: "linear-gradient(135deg, #fff 0%, rgba(14, 165, 233, 0.06) 100%)",
                border: "rgba(14, 165, 233, 0.22)",
            };
    }
};

const FinanceAccountDetailSheet = ({ show, account, onClose, onEdit, onDuplicate, onDelete, canEdit = false, canDelete = false }: Props) => {
    const { t } = useTranslation();

    const accessList = useMemo(() => account?.member_access || (account as any)?.memberAccess || [], [account]);

    if (!show || !account) {
        return null;
    }

    const profile = getAccountProfile(account.type);
    const periodNet = Number(account.period_inflow || 0) - Number(account.period_outflow || 0);
    const goalLocked = Number(account.goal_reserved_total || 0);
    const available = Number(account.current_balance || 0) - goalLocked;
    const isInactive = account.is_active === false;

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(15, 23, 42, 0.34)", zIndex: 1100, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div className="position-absolute top-0 start-50 translate-middle-x bg-white shadow-lg d-flex flex-column" style={{ width: "min(100%, 430px)", height: "100dvh", maxHeight: "100dvh" }}>
                <div className="px-3 pt-3 pb-2 border-bottom d-flex align-items-center justify-content-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
                    <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onClose}>
                        <i className="ri-arrow-left-line fs-5"></i>
                    </button>
                    <div className="fw-bold text-dark">{t("wallet.detail.account_title")}</div>
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
                    <div className="card ribbon-box ribbon-fill right overflow-hidden border-0 shadow-sm mx-auto" style={{ borderRadius: CARD_RADIUS, background: profile.gradient }}>
                        <div className="card-body text-center p-4">
                            <div className={`ribbon ribbon-${profile.tone} ribbon-shape`}>
                                {profile.ribbon}
                            </div>

                            <div
                                className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                                style={{
                                    width: 72,
                                    height: 72,
                                    background: "#fff",
                                    border: `2px solid ${profile.border}`,
                                }}
                            >
                                <i className={`${profile.icon} fs-1 text-${profile.tone}`}></i>
                            </div>

                            <div className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>
                                {profile.label}
                            </div>
                            <div className="fw-bold text-dark h4 mb-2" style={{ letterSpacing: "-0.4px" }}>{account.name}</div>

                            <div className="fw-black text-dark mt-2" style={{ fontSize: "2.35rem", letterSpacing: "-1px" }}>
                                {formatMoney(account.currency_code, account.current_balance)}
                            </div>

                            <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
                                <Badge className={`rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase ${account.scope === "shared" ? "bg-info-subtle text-info" : "bg-secondary-subtle text-secondary"}`} style={{ letterSpacing: "0.5px" }}>
                                    <i className={`${account.scope === "shared" ? "ri-community-line" : "ri-lock-line"} me-1`}></i>
                                    {account.scope === "shared" ? t("wallet.scope.shared") : t("wallet.scope.private")}
                                </Badge>
                                <Badge className={`rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase ${isInactive ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"}`} style={{ letterSpacing: "0.5px" }}>
                                    <i className={`${isInactive ? "ri-forbid-line" : "ri-checkbox-circle-line"} me-1`}></i>
                                    {isInactive ? t("finance.shared.inactive") : t("finance.shared.active")}
                                </Badge>
                                <Badge className="badge-soft-dark rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: "0.5px" }}>
                                    <i className="ri-money-dollar-circle-line me-1"></i> {account.currency_code || "IDR"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mt-1">
                        <div className="col-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS, background: "rgba(245, 158, 11, 0.08)" }}>
                                <div className="card-body p-3">
                                    <div className="text-muted fw-bold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>GOAL LOCKED</div>
                                    <div className="fw-bold text-dark fs-5">{formatMoney(account.currency_code, goalLocked)}</div>
                                    <div className="small text-muted mt-1">Dana yang sedang dicadangkan untuk goal</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card border-0 shadow-sm h-100 text-white" style={{ borderRadius: CARD_RADIUS, background: periodNet >= 0 ? "#10b981" : "#ef4444" }}>
                                <div className="card-body p-3">
                                    <div className="text-white-50 fw-bold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>MONTH NET</div>
                                    <div className="fw-bold fs-5">{formatMoney(account.currency_code, periodNet)}</div>
                                    <div className="small text-white-50 mt-1">Selisih masuk dan keluar bulan berjalan</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button 
                            type="button" 
                            className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ background: 'rgba(15, 23, 42, 0.05)', color: '#1e293b' }}
                            onClick={() => {
                                onClose();
                                router.visit(`/finance/transactions?bank_account_id=${account.id}`);
                            }}
                        >
                            <i className="ri-exchange-line fs-3"></i>
                            <span className="fw-bold" style={{ fontSize: '0.65rem' }}>LIHAT SEMUA TRANSAKSI</span>
                        </button>
                    </div>

                    <SectionCard title="Ringkasan Bulan Berjalan" noPadding>
                        <MetricRowPill
                            label="Goal Locked"
                            value={formatMoney(account.currency_code, goalLocked)}
                            icon="ri-flag-2-line"
                            tone="warning"
                        />
                        <MetricRowPill
                            label="Available"
                            value={formatMoney(account.currency_code, available)}
                            icon="ri-wallet-2-line"
                            tone="success"
                        />
                        <MetricRowPill
                            label="Opening Balance"
                            value={formatMoney(account.currency_code, account.opening_balance)}
                            icon="ri-inbox-archive-line"
                            tone="info"
                        />
                        <MetricRowPill
                            label="Total Inflow"
                            value={formatMoney(account.currency_code, account.period_inflow)}
                            icon="ri-arrow-left-down-line"
                            tone="success"
                        />
                        <MetricRowPill
                            label="Total Outflow"
                            value={formatMoney(account.currency_code, account.period_outflow)}
                            icon="ri-arrow-right-up-line"
                            tone="danger"
                        />
                        <MetricRowPill
                            label="Net Cashflow"
                            value={formatMoney(account.currency_code, periodNet)}
                            icon="ri-exchange-dollar-line"
                            tone={periodNet >= 0 ? "success" : "warning"}
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    {account.scope === "shared" && accessList.length > 0 && (
                        <SectionCard title="Akses Member" noPadding>
                            <div className="py-2">
                                {accessList.map((m: any) => {
                                    const pivot = m.pivot || m;
                                    let roleLabel = "Viewer";
                                    let roleIcon = "ri-eye-line";
                                    let roleColor = "text-muted";

                                    if (String(m.id) === String(account.owner_member_id)) {
                                        roleLabel = "Owner";
                                        roleIcon = "ri-star-fill";
                                        roleColor = "text-warning";
                                    } else if (pivot.can_manage) {
                                        roleLabel = "Manager";
                                        roleIcon = "ri-shield-user-fill";
                                        roleColor = "text-info";
                                    } else if (pivot.can_use) {
                                        roleLabel = "Spender";
                                        roleIcon = "ri-check-double-line";
                                        roleColor = "text-success";
                                    }

                                    return (
                                        <div key={m.id} className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom last-border-0">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="avatar-xs bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                                                    {(m.full_name || "M").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="small fw-bold text-dark">{m.full_name}</div>
                                                </div>
                                            </div>
                                            <div className={`small fw-medium ${roleColor} d-flex align-items-center gap-1`} style={{ fontSize: '0.7rem' }}>
                                                <i className={roleIcon}></i> {roleLabel}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    )}

                    <SectionCard title="Struktur Wallet" noPadding>
                        <MetricRowPill
                            label="Allocated to Wallets"
                            value={formatMoney(account.currency_code, account.allocated_amount)}
                            icon="ri-layout-grid-line"
                            tone="success"
                        />
                        <MetricRowPill
                            label="Unallocated Pool"
                            value={formatMoney(account.currency_code, account.unallocated_amount)}
                            icon="ri-safe-line"
                            tone="info"
                        />
                        <MetricRowPill
                            label="Wallet Mismatch"
                            value={formatMoney(account.currency_code, account.wallet_mismatch_amount)}
                            icon="ri-error-warning-line"
                            tone={Number(account.wallet_mismatch_amount || 0) === 0 ? "success" : "danger"}
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    <SectionCard title="Arus Kas Total" noPadding>
                        <MetricRowPill
                            label="Lifetime Inflow"
                            value={formatMoney(account.currency_code, account.total_inflow)}
                            icon="ri-funds-line"
                            tone="success"
                        />
                        <MetricRowPill
                            label="Lifetime Outflow"
                            value={formatMoney(account.currency_code, account.total_outflow)}
                            icon="ri-money-dollar-circle-line"
                            tone="danger"
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    <SectionCard title="Kepemilikan & Konfigurasi" noPadding>
                        <div className="pt-2">
                            <DetailRow label={t("finance.accounts.fields.type")} value={t(`wallet.account_types.${account.type}`)} />
                            <DetailRow label={t("finance.accounts.fields.currency")} value={account.currency_code || "-"} />
                            <DetailRow label={t("finance.accounts.fields.owner")} value={account.owner_member?.full_name || account.ownerMember?.full_name || "-"} />
                            <DetailRow label={t("finance.accounts.fields.status")} value={account.is_active ? t("finance.shared.active") : t("finance.shared.inactive")} />
                            <DetailRow label="Access Scope" value={account.scope === "shared" ? t("wallet.scope.shared") : t("wallet.scope.private")} />
                            <DottedDivider />
                            <DetailRow label={t("finance.accounts.fields.notes")} value={account.notes || t("finance.shared.not_set")} muted />
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default FinanceAccountDetailSheet;
