import React from "react";
import { Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceSavingsGoal } from "../types";

import { formatAmount } from "./pwa/types";

type Props = {
    goals: FinanceSavingsGoal[];
    onOpenDetail: (goal: FinanceSavingsGoal) => void;
};

const FinanceGoalsTab = ({ goals, onOpenDetail }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {goals.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="ri-flag-2-line fs-1 d-block mb-2"></i>
                    {t("wallet.empty_goals")}
                </div>
            ) : goals.map((goal) => {
                const goalWallet = goal.wallet || goal.pocket || null;
                const progress = Math.min(100, (Number(goal.current_amount || 0) / Math.max(Number(goal.target_amount || 1), 1)) * 100);
                const currencyCode = goalWallet?.currency_code || "IDR";
                const accountName = goalWallet?.real_account?.name || goalWallet?.realAccount?.name || "-";

                return (
                    <button
                        key={goal.id}
                        type="button"
                        className="w-100 border-0 p-0 text-start position-relative overflow-hidden shadow-sm card"
                        onClick={() => onOpenDetail(goal)}
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240, 249, 255, 0.95) 100%)",
                            borderRadius: 20,
                            transition: "transform 0.2s ease",
                        }}
                    >
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                        style={{ width: 40, height: 40, background: "rgba(14, 165, 233, 0.08)", color: "#0284c7" }}
                                    >
                                        <i className="ri-flag-2-line fs-5" />
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                            <h6 className="mb-0 fw-bold fs-14">{goal.name}</h6>
                                            <Badge className={`${goal.status === "completed" ? "bg-success-subtle text-success" : goal.status === "paused" ? "bg-secondary-subtle text-secondary" : "bg-primary-subtle text-primary"} rounded-pill shadow-sm`} style={{ fontSize: "0.55rem" }}>
                                                {t(`wallet.goal_status.${goal.status}`)}
                                            </Badge>
                                        </div>
                                        <span className="small d-block mt-1" style={{ fontSize: "0.72rem", color: "#475569" }}>
                                            {goalWallet?.name || t("wallet.labels.unassigned_wallet")} · {accountName}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="small text-uppercase fw-semibold" style={{ color: "#64748b", fontSize: "0.6rem", letterSpacing: "0.5px" }}>
                                        Progress
                                    </div>
                                    <div className="fw-bold mt-1" style={{ fontSize: "1rem", color: "#0284c7" }}>
                                        {progress.toFixed(0)}%
                                    </div>
                                </div>
                            </div>

                            <div className="progress rounded-pill mb-2" style={{ height: 6, background: "rgba(148, 163, 184, 0.12)" }}>
                                <div
                                    className="progress-bar bg-info rounded-pill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="d-flex justify-content-between align-items-center small text-muted">
                                <span style={{ fontSize: "0.7rem" }}>
                                    Saved: <span className="fw-bold text-dark">{formatAmount(Number(goal.current_amount || 0), currencyCode)}</span>
                                </span>
                                <span style={{ fontSize: "0.7rem" }}>
                                    Target: <span className="fw-bold text-dark">{formatAmount(Number(goal.target_amount || 0), currencyCode)}</span>
                                </span>
                            </div>
                        </Card.Body>
                    </button>
                );
            })}
        </div>
    );
};

export default FinanceGoalsTab;
