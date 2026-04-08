import React from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS, formatAmount } from "../../../Finance/components/pwa/types";
import { FinanceSavingsGoal, FinanceTransaction } from "../../../Finance/types";

type Props = {
    show: boolean;
    goal: FinanceSavingsGoal | null;
    activities: FinanceTransaction[];
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onFund: () => void;
    onSpend: () => void;
    canManage?: boolean;
};

const GoalDetailSheet = ({ show, goal, activities, onClose, onEdit, onDelete, onFund, onSpend, canManage = false }: Props) => {
    const { t } = useTranslation();

    if (!show || !goal) {
        return null;
    }

    const progress = Math.min(100, (Number(goal.current_amount || 0) / Math.max(Number(goal.target_amount || 1), 1)) * 100);
    const remaining = Math.max(Number(goal.target_amount || 0) - Number(goal.current_amount || 0), 0);
    const currencyCode = goal.pocket?.currency_code || "IDR";

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(15, 23, 42, 0.34)", zIndex: 1040, backdropFilter: "blur(10px)" }}>
            <div className="position-absolute top-0 start-50 translate-middle-x bg-white shadow-lg d-flex flex-column" style={{ width: "min(100%, 430px)", height: "100dvh", maxHeight: "100dvh" }}>
                <div className="px-3 pt-3 pb-2 border-bottom d-flex align-items-center justify-content-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(16px)" }}>
                    <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onClose}>
                        <i className="ri-arrow-left-line fs-5"></i>
                    </button>
                    <div className="fw-bold text-dark">{t("wallet.modal.add_goal", { defaultValue: "Detail Goal" })}</div>
                    <div className="d-flex align-items-center gap-2">
                        {canManage && (
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onEdit}>
                                <i className="ri-pencil-line fs-5"></i>
                            </button>
                        )}
                        {canManage && (
                            <button type="button" className="btn btn-danger-subtle text-danger rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }} onClick={onDelete}>
                                <i className="ri-delete-bin-line fs-5"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto px-4 py-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                    <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: CARD_RADIUS, background: "linear-gradient(135deg, #fff 0%, rgba(14, 165, 233, 0.06) 100%)" }}>
                        <div className="card-body p-4 text-center">
                            <div className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" style={{ width: 72, height: 72, background: "#fff", border: "2px solid rgba(14, 165, 233, 0.15)" }}>
                                <i className="ri-flag-2-line fs-1 text-info"></i>
                            </div>
                            <div className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: "1px", fontSize: "0.7rem" }}>{goal.pocket?.name || "-"}</div>
                            <div className="fw-bold text-dark h4 mb-2">{goal.name}</div>
                            <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                                <Badge className={`rounded-pill px-3 py-2 ${goal.pocket?.scope === "shared" ? "bg-info-subtle text-info" : "bg-secondary-subtle text-secondary"}`}>
                                    <i className={`${goal.pocket?.scope === "shared" ? "ri-community-line" : "ri-lock-line"} me-1`}></i>
                                    {goal.pocket?.scope === "shared" ? "Shared wallet goal" : "Private wallet goal"}
                                </Badge>
                                <Badge className={`rounded-pill px-3 py-2 ${goal.status === "completed" ? "bg-success-subtle text-success" : goal.status === "paused" ? "bg-secondary-subtle text-secondary" : "bg-primary-subtle text-primary"}`}>
                                    {t(`wallet.goal_status.${goal.status}`)}
                                </Badge>
                            </div>
                            <div className="fw-black text-dark" style={{ fontSize: "2.15rem", letterSpacing: "-1px" }}>
                                {formatAmount(Number(goal.current_amount || 0), currencyCode)}
                            </div>
                            <div className="small text-muted">Dana goal yang sedang terkunci</div>
                            <div className="mt-4">
                                <div className="progress rounded-pill" style={{ height: 10, background: "rgba(148, 163, 184, 0.18)" }}>
                                    <div className="progress-bar bg-info rounded-pill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="d-flex justify-content-between mt-2 small text-muted">
                                    <span>{formatAmount(Number(goal.current_amount || 0), currencyCode)}</span>
                                    <span>{formatAmount(Number(goal.target_amount || 0), currencyCode)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mt-1">
                        <div className="col-6">
                            <button type="button" className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#15803d" }} onClick={onFund}>
                                <i className="ri-add-circle-line fs-3"></i>
                                <span className="fw-bold" style={{ fontSize: "0.65rem" }}>TOP UP</span>
                            </button>
                        </div>
                        <div className="col-6">
                            <button type="button" className="w-100 border-0 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2 shadow-sm" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#b91c1c" }} onClick={onSpend}>
                                <i className="ri-shopping-bag-3-line fs-3"></i>
                                <span className="fw-bold" style={{ fontSize: "0.65rem" }}>SPEND</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm mt-4 overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                        <div className="fw-bold text-dark px-3 pt-3 pb-2 small text-uppercase" style={{ letterSpacing: "1px", opacity: 0.5, fontSize: "0.65rem" }}>Ringkasan</div>
                        <div className="px-3 pb-3">
                            <div className="d-flex justify-content-between py-2">
                                <span className="small text-muted">Target Dana</span>
                                <span className="fw-semibold">{formatAmount(Number(goal.target_amount || 0), currencyCode)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="small text-muted">Sisa Menuju Target</span>
                                <span className="fw-semibold">{formatAmount(remaining, currencyCode)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="small text-muted">Wallet Available Balance</span>
                                <span className="fw-semibold">{formatAmount(Number(goal.pocket?.available_balance || goal.pocket?.current_balance || 0), currencyCode)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="small text-muted">Target Date</span>
                                <span className="fw-semibold">{goal.target_date || "-"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm mt-4 overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                        <div className="fw-bold text-dark px-3 pt-3 pb-2 small text-uppercase" style={{ letterSpacing: "1px", opacity: 0.5, fontSize: "0.65rem" }}>Riwayat Keuangan Goal</div>
                        <div className="px-3 pb-3 d-flex flex-column gap-3">
                            {activities.length === 0 && (
                                <div className="text-muted small py-3 text-center">Belum ada arus dana pada goal ini.</div>
                            )}
                            {activities.map((activity) => {
                                const isSpend = activity.type === "pengeluaran";
                                const isTransferIn = activity.type === "transfer" && activity.transfer_direction === "in";
                                const isTransferOut = activity.type === "transfer" && activity.transfer_direction === "out";
                                const tone = isSpend
                                    ? { icon: "ri-arrow-right-up-line", tone: "danger", label: "Dipakai" }
                                    : isTransferIn
                                        ? { icon: "ri-arrow-left-down-line", tone: "success", label: "Top up" }
                                        : isTransferOut
                                            ? { icon: "ri-arrow-right-up-line", tone: "warning", label: "Transfer keluar" }
                                            : { icon: "ri-time-line", tone: "secondary", label: activity.type };
                                const actorName = activity.ownerMember?.full_name || activity.owner_member?.full_name || "-";
                                const transactionTime = activity.transaction_date ? new Date(activity.transaction_date).toLocaleDateString("id-ID") : "-";
                                const sourceWalletName = activity.paired_transaction?.pocket?.name || "-";
                                return (
                                    <div key={activity.id} className="border rounded-4 px-3 py-3">
                                        <div className="d-flex align-items-start justify-content-between gap-3">
                                            <div className="d-flex gap-3">
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center bg-${tone.tone}-subtle text-${tone.tone}`} style={{ width: 40, height: 40 }}>
                                                    <i className={`${tone.icon} fs-5`}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold text-dark">{tone.label}</div>
                                                    <div className="small text-muted">{activity.description || "-"}</div>
                                                    {isTransferIn && (
                                                        <div className="small text-muted mt-1">Dari wallet: {sourceWalletName}</div>
                                                    )}
                                                    {isSpend && (
                                                        <div className="small text-muted mt-1">
                                                            Dipakai untuk: {activity.category?.name || "-"} · {activity.description || "-"}
                                                        </div>
                                                    )}
                                                    <div className="small text-muted mt-1">
                                                        {actorName} · {transactionTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`fw-bold text-${isSpend ? "danger" : "success"} text-end`}>
                                                {isSpend ? "-" : "+"}{formatAmount(Number(activity.amount || 0), currencyCode)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoalDetailSheet;
