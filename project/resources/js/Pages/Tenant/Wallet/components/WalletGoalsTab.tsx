import React from "react";
import { Alert, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceSavingsGoal } from "../../Finance/types";

import { formatCurrency } from "./pwa/types";

type Props = {
    goals: FinanceSavingsGoal[];
    onOpenDetail: (goal: FinanceSavingsGoal) => void;
};

const WalletGoalsTab = ({ goals, onOpenDetail }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {goals.map((goal) => {
                const progress = Math.min(100, (Number(goal.current_amount || 0) / Math.max(Number(goal.target_amount || 1), 1)) * 100);
                const scopeLabel = goal.pocket?.scope === "shared" ? "Shared" : "Private";
                const currencyCode = goal.pocket?.currency_code || "IDR";
                const ownerName = goal.ownerMember?.full_name || goal.owner_member?.full_name || "-";
                const accountName = goal.pocket?.real_account?.name || goal.pocket?.realAccount?.name || "-";

                return (
                    <Card key={goal.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Card.Body className="p-0">
                            <button
                                type="button"
                                className="w-100 text-start border-0 bg-white p-4"
                                onClick={() => onOpenDetail(goal)}
                            >
                                <div className="d-flex justify-content-between align-items-start gap-3">
                                    <div className="d-flex gap-3 align-items-start">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 52, height: 52, background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(37,99,235,0.14))", color: "#0284c7" }}
                                        >
                                            <i className="ri-flag-2-line fs-4"></i>
                                        </div>
                                        <div>
                                            <div className="fw-semibold text-dark">{goal.name}</div>
                                            <div className="small text-muted mt-1">{goal.pocket?.name || t("wallet.labels.unassigned_wallet")} · {accountName}</div>
                                            <div className="small text-muted mt-1">Owner: {ownerName}</div>
                                            <div className="d-flex flex-wrap gap-2 mt-2">
                                                <Badge className={`rounded-pill ${goal.pocket?.scope === "shared" ? "bg-info-subtle text-info" : "bg-secondary-subtle text-secondary"}`}>{scopeLabel}</Badge>
                                                <Badge className={`${goal.status === "completed" ? "bg-success-subtle text-success" : goal.status === "paused" ? "bg-secondary-subtle text-secondary" : "bg-primary-subtle text-primary"} rounded-pill`}>
                                                    {t(`wallet.goal_status.${goal.status}`)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold text-dark">{progress.toFixed(0)}%</div>
                                        <div className="small text-muted">Progress</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="progress rounded-pill" style={{ height: 10, background: "rgba(148, 163, 184, 0.18)" }}>
                                        <div className="progress-bar bg-info rounded-pill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2 small text-muted">
                                        <span>{formatCurrency(goal.current_amount, currencyCode)}</span>
                                        <span>{formatCurrency(goal.target_amount, currencyCode)}</span>
                                    </div>
                                </div>
                                {goal.activities_count ? (
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                        <span className="badge rounded-pill bg-light text-dark border">{goal.activities_count} transaksi</span>
                                    </div>
                                ) : null}
                            </button>
                        </Card.Body>
                    </Card>
                );
            })}
            {goals.length === 0 && <Alert variant="light" className="rounded-4 border-0 shadow-sm">{t("wallet.empty_goals")}</Alert>}
        </div>
    );
};

export default WalletGoalsTab;
