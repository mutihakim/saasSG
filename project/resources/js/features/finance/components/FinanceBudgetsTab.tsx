import React from "react";
import { Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";


import { FinanceBudget } from "../types";

import { formatAmount } from "./pwa/types";

type Props = {
    budgets: FinanceBudget[];
    defaultCurrency: string;
    canManageFinanceStructures: boolean;
    activeMemberId?: number | null;
    onCreateBudget: () => void;
    onOpenDetail: (budget: FinanceBudget) => void;
};

const getAccessBadge = (entity: any, activeMemberId?: number | null) => {
    if (!activeMemberId || !entity) return null;
    if (String(entity.owner_member_id) === String(activeMemberId)) {
        return { label: "Owner", bg: "primary", icon: "ri-star-fill" };
    }
    const accessList = entity.member_access || entity.memberAccess || [];
    const myAccess = accessList.find((m: any) => String(m.id) === String(activeMemberId));
    if (myAccess) {
        if (myAccess.pivot?.can_manage || myAccess.can_manage) return { label: "Manage", bg: "warning", icon: "ri-shield-user-fill" };
        if (myAccess.pivot?.can_use || myAccess.can_use) return { label: "Use", bg: "success", icon: "ri-check-double-line" };
        if (myAccess.pivot?.can_view || myAccess.can_view) return { label: "View", bg: "secondary", icon: "ri-eye-line" };
    }
    return null;
};

const FinanceBudgetsTab = ({
    budgets,
    defaultCurrency,
    canManageFinanceStructures,
    activeMemberId,
    onCreateBudget,
    onOpenDetail,
}: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {budgets.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="ri-pie-chart-line fs-1 d-block mb-2"></i>
                    {t("finance.budgets.title")} belum ada untuk bulan ini.
                </div>
            ) : budgets.map((budget) => {
                const spentPercent = Math.min(100, (Number(budget.spent_amount || 0) / Math.max(Number(budget.allocated_amount || 1), 1)) * 100);
                const isOverBudget = Number(budget.remaining_amount || 0) < 0;

                return (
                    <button
                        key={budget.id}
                        type="button"
                        className="w-100 border-0 p-0 text-start position-relative overflow-hidden shadow-sm card"
                        onClick={() => onOpenDetail(budget)}
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
                            borderRadius: 20,
                            transition: "transform 0.2s ease",
                        }}
                    >
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                        style={{ width: 40, height: 40, background: "rgba(99, 102, 241, 0.08)", color: "#4338ca" }}
                                    >
                                        <i className="ri-pie-chart-line fs-5" />
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                            <h6 className="mb-0 fw-bold fs-14">{budget.name}</h6>
                                            {(() => {
                                                const badge = getAccessBadge(budget, activeMemberId);
                                                if (!badge) return null;
                                                return (
                                                    <Badge bg={badge.bg} className="rounded-pill shadow-sm" style={{ fontSize: "0.55rem" }}>
                                                        <i className={`${badge.icon} me-1`}></i>{badge.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                        <span className="small d-block mt-1" style={{ fontSize: "0.72rem", color: "#475569" }}>
                                            {budget.period_month} · {budget.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="small text-uppercase fw-semibold" style={{ color: "#64748b", fontSize: "0.6rem", letterSpacing: "0.5px" }}>
                                        Remaining
                                    </div>
                                    <div className="fw-bold mt-1" style={{ fontSize: "1rem", color: isOverBudget ? "#dc2626" : "#2563eb" }}>
                                        {formatAmount(Number(budget.remaining_amount || 0), defaultCurrency)}
                                    </div>
                                </div>
                            </div>

                            <div className="progress rounded-pill mb-2" style={{ height: 6, background: "rgba(148, 163, 184, 0.12)" }}>
                                <div
                                    className={`progress-bar rounded-pill ${isOverBudget ? "bg-danger" : "bg-primary"}`}
                                    style={{ width: `${spentPercent}%` }}
                                />
                            </div>

                            <div className="d-flex justify-content-between align-items-center small text-muted">
                                <span style={{ fontSize: "0.7rem" }}>
                                    Used: <span className="fw-bold text-dark">{spentPercent.toFixed(0)}%</span>
                                </span>
                                <span style={{ fontSize: "0.7rem" }}>
                                    Allocated: <span className="fw-bold text-dark">{formatAmount(Number(budget.allocated_amount || 0), defaultCurrency)}</span>
                                </span>
                            </div>
                        </Card.Body>
                    </button>
                );
            })}

            {canManageFinanceStructures && (
                <button
                    type="button"
                    className="w-100 border-0 p-3 text-center d-flex flex-column align-items-center justify-content-center gap-2"
                    onClick={onCreateBudget}
                    style={{
                        background: "rgba(15, 23, 42, 0.03)",
                        border: "2px dashed rgba(15, 23, 42, 0.08)",
                        borderRadius: 20,
                        minHeight: 80,
                        color: "#64748b",
                    }}
                >
                    <div
                        className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center"
                        style={{ width: 32, height: 32 }}
                    >
                        <i className="ri-add-line fs-5"></i>
                    </div>
                    <span className="fw-bold" style={{ fontSize: "0.75rem" }}>Tambah Budget</span>
                </button>
            )}
        </div>
    );
};

export default FinanceBudgetsTab;
