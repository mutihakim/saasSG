import { router } from "@inertiajs/react";
import React, { useMemo } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceBudget } from "../../types";

import { CARD_RADIUS, formatAmount } from "./types";

type Props = {
    show: boolean;
    budget: FinanceBudget | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    activeMemberId?: number | null;
    canManage?: boolean;
};

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

const BudgetDetailSheet = ({ show, budget, onClose, onEdit, onDelete, activeMemberId, canManage: propCanManage = false }: Props) => {
    const { t } = useTranslation();

    const accessList = useMemo(() => budget?.member_access || (budget as any)?.memberAccess || [], [budget]);
    
    const myAccess = useMemo(() => {
        if (!activeMemberId || !budget) return null;
        if (String(budget.owner_member_id) === String(activeMemberId)) {
            return { label: "Owner", color: "warning", icon: "ri-star-fill", can_manage: true };
        }
        const access = accessList.find((m: any) => String(m.id) === String(activeMemberId));
        if (access) {
            const pivot = access.pivot || access;
            if (pivot.can_manage) return { label: "Manager", color: "info", icon: "ri-shield-user-fill", can_manage: true };
            if (pivot.can_use) return { label: "Spender", color: "success", icon: "ri-check-double-line", can_manage: false };
            if (pivot.can_view) return { label: "Viewer", color: "secondary", icon: "ri-eye-line", can_manage: false };
        }
        return null;
    }, [activeMemberId, budget, accessList]);

    const canActuallyManage = myAccess?.can_manage || propCanManage;

    if (!show || !budget) {
        return null;
    }

    const currencyCode = (budget as any).currency_code || "IDR";
    const spentPercent = Math.min(100, (Number(budget.spent_amount || 0) / Math.max(Number(budget.allocated_amount || 1), 1)) * 100);
    const isOverBudget = Number(budget.remaining_amount || 0) < 0;

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
                    <div className="fw-bold text-dark">{t("finance.budgets.title", { defaultValue: "Budget Detail" })}</div>
                    <div className="d-flex align-items-center gap-2">
                        {canActuallyManage && (
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onEdit}>
                                <i className="ri-pencil-line fs-5"></i>
                            </button>
                        )}
                        {canActuallyManage && (
                            <button type="button" className="btn btn-danger-subtle text-danger rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDelete}>
                                <i className="ri-delete-bin-line fs-5"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto px-4 py-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                    <div 
                        className="card border-0 shadow-sm overflow-hidden mx-auto" 
                        style={{ 
                            borderRadius: CARD_RADIUS, 
                            background: "linear-gradient(135deg, #fff 0%, rgba(99, 102, 241, 0.05) 100%)" 
                        }}
                    >
                        <div className="card-body text-center p-4">
                            <div 
                                className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" 
                                style={{ 
                                    width: 72, 
                                    height: 72, 
                                    background: "#fff",
                                    border: `2px solid rgba(99, 102, 241, 0.15)`
                                }}
                            >
                                <i className={`ri-pie-chart-line fs-1 text-primary`}></i>
                            </div>

                            <div className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>{budget.period_month}</div>
                            <div className="fw-bold text-dark h4 mb-1" style={{ letterSpacing: '-0.5px' }}>{budget.name}</div>
                            
                            {myAccess && (
                                <div className="mb-3">
                                    <Badge bg={myAccess.color} className="rounded-pill px-2 py-1 shadow-sm small fw-medium text-uppercase" style={{ fontSize: '0.6rem' }}>
                                        <i className={`${myAccess.icon} me-1`}></i> {myAccess.label}
                                    </Badge>
                                </div>
                            )}
                            
                            <div className="fw-black text-dark mt-2" style={{ fontSize: "2.2rem", letterSpacing: "-1px" }}>
                                {formatAmount(Number(budget.allocated_amount || 0), currencyCode)}
                            </div>
                            <div className="small text-muted mb-3 text-uppercase fw-bold" style={{ letterSpacing: '0.5px', fontSize: '0.65rem' }}>TOTAL ALOKASI</div>

                            <div className="mt-4 text-start">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>Pemakaian Budget</span>
                                    <span className={`small fw-bold ${isOverBudget ? 'text-danger' : 'text-primary'}`}>{spentPercent.toFixed(1)}%</span>
                                </div>
                                <div className="progress rounded-pill" style={{ height: 10, background: "rgba(148, 163, 184, 0.18)" }}>
                                    <div 
                                        className={`progress-bar rounded-pill ${isOverBudget ? 'bg-danger' : 'bg-primary'}`} 
                                        style={{ width: `${spentPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-center gap-2 mt-4">
                                <Badge bg={budget.scope === "shared" ? "info-subtle" : "secondary-subtle"} text={budget.scope === "shared" ? "info" : "secondary"} className="rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                    <i className={budget.scope === "shared" ? "ri-community-line me-1" : "ri-lock-line me-1"}></i> 
                                    {budget.scope === "shared" ? t("wallet.scope.shared") : t("wallet.scope.private")}
                                </Badge>
                                {budget.wallet_id && (
                                    <Badge bg="warning-subtle" text="warning" className="rounded-pill px-3 py-2 border shadow-sm small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                        <i className="ri-wallet-3-line me-1"></i> Pocket Linked
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button 
                            type="button" 
                            className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4338ca' }}
                            onClick={() => {
                                onClose();
                                router.visit(`/finance/transactions?budget_id=${budget.id}`);
                            }}
                        >
                            <i className="ri-exchange-line fs-3"></i>
                            <span className="fw-bold" style={{ fontSize: '0.65rem' }}>LIHAT TRANSAKSI</span>
                        </button>
                    </div>

                    <SectionCard title="Ringkasan Budget" noPadding>
                        <MetricRowPill 
                            label="Terpakai" 
                            value={formatAmount(Number(budget.spent_amount || 0), currencyCode)} 
                            icon="ri-arrow-right-up-line" 
                            tone="danger" 
                        />
                        <MetricRowPill 
                            label="Sisa Budget" 
                            value={formatAmount(Number(budget.remaining_amount || 0), currencyCode)} 
                            icon="ri-safe-2-line" 
                            tone={isOverBudget ? "danger" : "success"} 
                        />
                        <div className="pb-2"></div>
                    </SectionCard>

                    {budget.scope === "shared" && accessList.length > 0 && (
                        <SectionCard title="Akses Member" noPadding>
                            <div className="py-2">
                                {accessList.map((m: any) => {
                                    const pivot = m.pivot || m;
                                    let roleLabel = "Viewer";
                                    let roleIcon = "ri-eye-line";
                                    let roleColor = "text-muted";

                                    if (String(m.id) === String(budget.owner_member_id)) {
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

                    <SectionCard title="Informasi Konfigurasi" noPadding>
                        <div className="pt-2">
                            <DetailRow label="Periode" value={budget.period_month} />
                            <DetailRow label="Wallet Terkait" value={(budget.wallet || budget.pocket)?.name || "Semua Wallet (Unallocated)"} />
                            <DetailRow label="Owner" value={(budget as any).owner_member?.full_name || (budget as any).ownerMember?.full_name || "-"} />
                            <DetailRow label="Status" value={budget.is_active ? "Aktif" : "Non-aktif"} />
                            
                            <div className="px-3">
                                <div className="my-3" style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.8)" }} />
                            </div>
                            
                            <div className="text-muted fw-bold mb-1 px-3" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>NOTES</div>
                            <p className="fw-medium text-dark mb-0 px-3 pb-3" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                                {budget.notes || "No notes set for this budget."}
                            </p>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailSheet;
