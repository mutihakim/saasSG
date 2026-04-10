import { router } from "@inertiajs/react";
import React, { useMemo } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS, formatAmount } from "./types";

type Props = {
    show: boolean;
    wallet: any | null;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
    onAddMoney: () => void;
    onMoveMoney: () => void;
    onPaySend: () => void;
};

const DottedDivider = () => <div className="my-3" style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.8)" }} />;

const SectionCard = ({ title, children, noPadding = false }: { title: string; children: React.ReactNode; noPadding?: boolean }) => (
    <div className="bg-white shadow-sm mt-4 overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
        <div className="fw-bold text-dark px-3 pt-3 pb-2 small text-uppercase" style={{ letterSpacing: '1px', opacity: 0.5, fontSize: '0.65rem' }}>{title}</div>
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
                <span className="small fw-semibold text-muted text-uppercase text-truncate" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>{label}</span>
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

const formatWalletType = (type?: string | null) => {
    if (!type) return "-";
    if (type === "main") return "Main";

    return type
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const FinanceWalletDetailSheet = ({
    show,
    wallet,
    onClose,
    onEdit,
    onDuplicate,
    onDelete,
    canEdit = false,
    canDelete = false,
    onAddMoney,
    onMoveMoney,
    onPaySend,
}: Props) => {
    const { t } = useTranslation();

    const accessList = useMemo(() => {
        const account = wallet?.real_account || wallet?.realAccount;
        return account?.member_access || account?.memberAccess || [];
    }, [wallet]);

    if (!show || !wallet) {
        return null;
    }

    const monthNet = Number(wallet.period_inflow || 0) - Number(wallet.period_outflow || 0);
    const purpose = wallet.purpose_type || "spending";
    const purposeRecord: Record<string, { label: string; tone: string; ribbon: string; gradient: string }> = {
        spending: { label: "Spending", tone: "danger", ribbon: "SPENDING", gradient: "linear-gradient(135deg, #fff 0%, rgba(239, 68, 68, 0.05) 100%)" },
        saving: { label: "Saving", tone: "warning", ribbon: "SAVING", gradient: "linear-gradient(135deg, #fff 0%, rgba(245, 158, 11, 0.05) 100%)" },
        income: { label: "Income", tone: "success", ribbon: "INCOME", gradient: "linear-gradient(135deg, #fff 0%, rgba(34, 197, 94, 0.05) 100%)" },
    };
    const activePurpose = purposeRecord[purpose] || purposeRecord.spending;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
                background: "rgba(15, 23, 42, 0.34)",
                zIndex: 1040,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)"
            }}
        >
            <div 
                className="position-absolute top-0 start-50 translate-middle-x bg-white shadow-lg d-flex flex-column" 
                style={{ 
                    width: "min(100%, 430px)", 
                    height: "100dvh", 
                    maxHeight: "100dvh" 
                }}
            >
                <div 
                    className="px-3 pt-3 pb-2 border-bottom d-flex align-items-center justify-content-between" 
                    style={{ 
                        paddingTop: "max(16px, env(safe-area-inset-top))", 
                        background: "rgba(255, 255, 255, 0.9)", 
                        backdropFilter: "blur(16px)", 
                        WebkitBackdropFilter: "blur(16px)" 
                    }}
                >
                    <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onClose}>
                        <i className="ri-arrow-left-line fs-5"></i>
                    </button>
                    <div className="fw-bold text-dark">{t("wallet.detail.wallet_title", { defaultValue: "Dompet Detail" })}</div>
                    <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDuplicate}>
                            <i className="ri-file-copy-line fs-5"></i>
                        </button>
                        {canEdit && (
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onEdit}>
                                <i className="ri-pencil-line fs-5"></i>
                            </button>
                        )}
                        {canDelete && !wallet.is_system && (
                            <button type="button" className="btn btn-danger-subtle text-danger rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDelete}>
                                <i className="ri-delete-bin-line fs-5"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto px-4 py-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                    <div className="card ribbon-box ribbon-fill right overflow-hidden border-0 shadow-sm mx-auto" style={{ borderRadius: CARD_RADIUS, background: activePurpose.gradient }}>
                        <div className="card-body text-center p-4">
                            <div className={`ribbon ribbon-${activePurpose.tone} ribbon-shape`}>
                                {activePurpose.ribbon}
                            </div>

                            <div 
                                className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" 
                                style={{ 
                                    width: 72, 
                                    height: 72, 
                                    background: "#fff",
                                    border: `2px solid rgba(var(--vz-${activePurpose.tone}-rgb), 0.2)`
                                }}
                            >
                                <i className={`${wallet.icon_key || "ri-wallet-3-line"} fs-1 text-${activePurpose.tone}`}></i>
                            </div>

                            <div className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>{wallet.real_account?.name || wallet.realAccount?.name || "-"}</div>
                            <div className="fw-bold text-dark h4 mb-3" style={{ letterSpacing: '-0.5px' }}>{wallet.name}</div>
                            
                            <div className="fw-black text-dark mt-2" style={{ fontSize: "2.4rem", letterSpacing: "-1px" }}>
                                {formatAmount(Number(wallet.current_balance || 0), wallet.currency_code || "IDR")}
                            </div>

                            <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
                                <Badge className="badge-soft-dark rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                    <i className="ri-flag-line me-1"></i> {activePurpose.label}
                                </Badge>
                                <Badge bg={wallet.scope === "shared" ? "info-subtle" : "secondary-subtle"} text={wallet.scope === "shared" ? "info" : "secondary"} className="rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                    <i className={wallet.scope === "shared" ? "ri-community-line me-1" : "ri-lock-line me-1"}></i> 
                                    {wallet.scope === "shared" ? t("wallet.scope.shared") : t("wallet.scope.private")}
                                </Badge>
                                {wallet.budget_lock_enabled && (
                                    <Badge bg="warning-subtle" text="warning" className="rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                        <i className="ri-lock-fill me-1"></i> Locked
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="row g-3 mt-1">
                        <div className="col-4">
                            <button 
                                type="button" 
                                className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#15803d' }}
                                onClick={onAddMoney}
                            >
                                <i className="ri-add-circle-line fs-3"></i>
                                <span className="fw-bold" style={{ fontSize: '0.65rem' }}>ADD MONEY</span>
                            </button>
                        </div>
                        <div className="col-4">
                            <button 
                                type="button" 
                                className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                                style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0369a1' }}
                                onClick={onMoveMoney}
                            >
                                <i className="ri-arrow-left-right-line fs-3"></i>
                                <span className="fw-bold" style={{ fontSize: '0.65rem' }}>MOVE MONEY</span>
                            </button>
                        </div>
                        <div className="col-4">
                            <button 
                                type="button" 
                                className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4338ca' }}
                                onClick={onPaySend}
                            >
                                <i className="ri-send-plane-2-line fs-3"></i>
                                <span className="fw-bold" style={{ fontSize: '0.65rem' }}>PAY/SEND</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button 
                            type="button" 
                            className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ background: 'rgba(15, 23, 42, 0.05)', color: '#1e293b' }}
                            onClick={() => {
                                onClose();
                                router.visit(`/finance/transactions?wallet_id=${wallet.id}`);
                            }}
                        >
                            <i className="ri-exchange-line fs-3"></i>
                            <span className="fw-bold" style={{ fontSize: '0.65rem' }}>LIHAT SEMUA TRANSAKSI</span>
                        </button>
                    </div>

                    <SectionCard title="Ringkasan Bulan Berjalan" noPadding>
                        <MetricRowPill 
                            label="Dana Goal Terkunci" 
                            value={formatAmount(Number(wallet.goal_reserved_total || 0), wallet.currency_code)} 
                            icon="ri-flag-2-line" 
                            tone="warning" 
                        />
                        <MetricRowPill 
                            label="Saldo Tersedia" 
                            value={formatAmount(Number((wallet.available_balance ?? wallet.current_balance) || 0), wallet.currency_code)} 
                            icon="ri-safe-2-line" 
                            tone="success" 
                        />
                        <MetricRowPill 
                            label="Total Inflow" 
                            value={formatAmount(Number(wallet.period_inflow), wallet.currency_code)} 
                            icon="ri-arrow-left-down-line" 
                            tone="info" 
                        />
                        <MetricRowPill 
                            label="Total Outflow" 
                            value={formatAmount(Number(wallet.period_outflow), wallet.currency_code)} 
                            icon="ri-arrow-right-up-line" 
                            tone="danger" 
                        />
                        <MetricRowPill 
                            label="Net Cashflow" 
                            value={formatAmount(Number(monthNet), wallet.currency_code)} 
                            icon="ri-funds-line" 
                            tone={monthNet >= 0 ? "success" : "warning"} 
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    {wallet.scope === "shared" && accessList.length > 0 && (
                        <SectionCard title="Akses Member" noPadding>
                            <div className="py-2">
                                {accessList.map((m: any) => {
                                    const pivot = m.pivot || m;
                                    let roleLabel = "Viewer";
                                    let roleIcon = "ri-eye-line";
                                    let roleColor = "text-muted";

                                    if (String(m.id) === String(wallet.owner_member_id)) {
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

                    <SectionCard title="Arus Kas Total" noPadding>
                        <MetricRowPill 
                            label="Arus Kas Masuk" 
                            value={formatAmount(Number(wallet.total_inflow), wallet.currency_code)} 
                            icon="ri-exchange-box-line" 
                            tone="success" 
                        />
                        <MetricRowPill 
                            label="Arus Kas Keluar" 
                            value={formatAmount(Number(wallet.total_outflow), wallet.currency_code)} 
                            icon="ri-hand-coin-line" 
                            tone="danger" 
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    <SectionCard title="Informasi Konfigurasi" noPadding>
                        <div className="pt-2">
                            <DetailRow label={t("wallet.fields.type")} value={formatWalletType(wallet.type)} />
                            <DetailRow label={t("wallet.fields.source_account")} value={wallet.real_account?.name || wallet.realAccount?.name || "-"} />
                            <DetailRow label={t("wallet.fields.owner")} value={wallet.owner_member?.full_name || wallet.ownerMember?.full_name || "-"} />
                            <DetailRow label="Tipe Dompet" value={activePurpose.label} />
                            <DetailRow label="Budget Default" value={wallet.default_budget?.name || t("finance.shared.not_set")} muted={!wallet.default_budget} />
                            <DetailRow label="Budget Mode" value={wallet.budget_lock_enabled ? "Locked (Mandatory)" : wallet.default_budget_key ? "Recommended" : "Flexible"} />
                            <DetailRow label={t("wallet.fields.status")} value={wallet.is_active ? t("finance.shared.active") : t("finance.shared.inactive")} />
                            
                            <div className="px-3">
                                <DottedDivider />
                            </div>
                            
                            <div className="text-muted fw-bold mb-1 px-3" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>NOTES</div>
                            <p className="fw-medium text-dark mb-0 px-3 pb-3" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                                {wallet.notes || "No notes set for this wallet."}
                            </p>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default FinanceWalletDetailSheet;
