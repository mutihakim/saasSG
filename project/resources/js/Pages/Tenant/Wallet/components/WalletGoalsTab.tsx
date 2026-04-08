import React from "react";
import { Alert, Badge, Button, Card, ProgressBar } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceSavingsGoal } from "../../Finance/types";
import { formatCurrency } from "./pwa/types";

type Props = {
    goals: FinanceSavingsGoal[];
    financeHref: string;
    onEdit: (goal: FinanceSavingsGoal) => void;
    onDelete: (goal: FinanceSavingsGoal) => void;
};

const WalletGoalsTab = ({ goals, financeHref, onEdit, onDelete }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {goals.map((goal) => {
                const progress = Math.min(100, (Number(goal.current_amount || 0) / Math.max(Number(goal.target_amount || 1), 1)) * 100);

                return (
                    <Card key={goal.id} className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between gap-3">
                                <div>
                                    <div className="fw-semibold">{goal.name}</div>
                                    <div className="small text-muted mt-1">{goal.pocket?.name || t("wallet.labels.unassigned_wallet")}</div>
                                </div>
                                <Badge bg={goal.status === "completed" ? "success" : goal.status === "paused" ? "secondary" : "info"}>
                                    {t(`wallet.goal_status.${goal.status}`)}
                                </Badge>
                            </div>
                            <div className="mt-3">
                                <ProgressBar now={progress} />
                            </div>
                            <div className="d-flex justify-content-between mt-2 small text-muted">
                                <span>{formatCurrency(goal.current_amount)}</span>
                                <span>{formatCurrency(goal.target_amount)}</span>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mt-3">
                                <Button size="sm" variant="light" className="rounded-pill" href={financeHref}>{t("wallet.actions.top_up")}</Button>
                                <Button size="sm" variant="light" className="rounded-pill" onClick={() => onEdit(goal)}>{t("wallet.actions.edit")}</Button>
                                <Button size="sm" variant="outline-danger" className="rounded-pill" onClick={() => onDelete(goal)}>{t("wallet.actions.delete")}</Button>
                            </div>
                        </Card.Body>
                    </Card>
                );
            })}
            {goals.length === 0 && <Alert variant="light" className="rounded-4 border-0 shadow-sm">{t("wallet.empty_goals")}</Alert>}
        </div>
    );
};

export default WalletGoalsTab;
