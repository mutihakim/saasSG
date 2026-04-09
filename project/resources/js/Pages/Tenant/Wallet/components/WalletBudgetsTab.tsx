import React from "react";
import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceBudget } from "../../Finance/types";
import { CARD_RADIUS, formatAmount } from "../../Finance/components/pwa/types";

type Props = {
    budgets: FinanceBudget[];
    defaultCurrency: string;
    canManageFinanceStructures: boolean;
    budgetCreateDisabled: boolean;
    activeMemberId?: number | null;
    onCreateBudget: () => void;
    onEditBudget: (budget: FinanceBudget) => void;
};

const WalletBudgetsTab = ({
    budgets,
    defaultCurrency,
    canManageFinanceStructures,
    budgetCreateDisabled,
    activeMemberId,
    onCreateBudget,
    onEditBudget,
}: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {canManageFinanceStructures && (
                <div className="d-flex justify-content-end">
                    <Button
                        variant={budgetCreateDisabled ? "light" : "primary"}
                        className="rounded-pill"
                        disabled={budgetCreateDisabled}
                        onClick={onCreateBudget}
                    >
                        {t("finance.budgets.modal.add_title")}
                    </Button>
                </div>
            )}

            {budgets.length === 0 ? (
                <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                    <Card.Body className="p-4 text-center text-muted">
                        {t("finance.budgets.title")} belum ada untuk bulan ini.
                    </Card.Body>
                </Card>
            ) : budgets.map((budget) => {
                const canManage = String(budget.owner_member_id || "") === String(activeMemberId || "");

                return (
                    <Card key={budget.id} className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                    <div className="fw-semibold text-dark">{budget.name}</div>
                                    <div className="small text-muted mt-1">
                                        {budget.period_month} · {budget.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}
                                    </div>
                                </div>
                                {canManageFinanceStructures || canManage ? (
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-circle border-0"
                                        onClick={() => onEditBudget(budget)}
                                    >
                                        <i className="ri-pencil-line"></i>
                                    </button>
                                ) : null}
                            </div>
                            <div className="d-flex justify-content-between mt-3 small text-muted">
                                <span>{t("finance.budgets.fields.allocated_amount")}</span>
                                <span>{formatAmount(Number(budget.allocated_amount || 0), defaultCurrency)}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-1 small text-muted">
                                <span>{t("finance.budgets.fields.spent")}</span>
                                <span>{formatAmount(Number(budget.spent_amount || 0), defaultCurrency)}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-1 small text-muted">
                                <span>{t("finance.budgets.fields.remaining")}</span>
                                <span className={Number(budget.remaining_amount || 0) < 0 ? "text-danger fw-semibold" : ""}>
                                    {formatAmount(Number(budget.remaining_amount || 0), defaultCurrency)}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                );
            })}
        </div>
    );
};

export default WalletBudgetsTab;
