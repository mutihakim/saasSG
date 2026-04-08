import React from "react";
import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { notify } from "../../../../common/notify";
import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceLimits, FinanceMember } from "../types";

import ReportsPanel from "./ReportsPanel";
import { CARD_RADIUS, formatAmount } from "./pwa/types";

type MoreTabProps = {
    moreView: "menu" | "budgets" | "reports";
    budgets: FinanceBudget[];
    accounts: FinanceAccount[];
    categories: FinanceCategory[];
    members: FinanceMember[];
    defaultCurrency: string;
    activeMemberId?: number | null;
    permissions: {
        manageShared: boolean;
    };
    canManageFinanceStructures: boolean;
    budgetCreateDisabled: boolean;
    limits: FinanceLimits;
    onChangeView: (view: "menu" | "budgets" | "reports") => void;
    onCreateBudget: () => void;
    onEditBudget: (budget: FinanceBudget) => void;
};

const MoreTab = ({
    moreView,
    budgets,
    accounts,
    categories,
    members,
    defaultCurrency,
    activeMemberId,
    permissions,
    canManageFinanceStructures,
    budgetCreateDisabled,
    limits,
    onChangeView,
    onCreateBudget,
    onEditBudget,
}: MoreTabProps) => {
    const { t } = useTranslation();

    if (moreView === "reports") {
        return <ReportsPanel accounts={accounts} budgets={budgets} categories={categories} members={members} compact />;
    }

    if (moreView === "menu") {
        return (
            <div className="d-flex flex-column gap-3">
                <button type="button" className="btn text-start bg-white border-0 shadow-sm px-3 py-3" style={{ borderRadius: CARD_RADIUS }} onClick={() => onChangeView("budgets")}>
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <div className="fw-semibold text-dark">{t("finance.budgets.title")}</div>
                            <div className="small text-muted mt-1">{t("finance.pwa.more.budgets_hint")}</div>
                        </div>
                        <i className="ri-arrow-right-s-line fs-4 text-muted"></i>
                    </div>
                </button>
                <button type="button" className="btn text-start bg-white border-0 shadow-sm px-3 py-3" style={{ borderRadius: CARD_RADIUS }} onClick={() => onChangeView("reports")}>
                    <div className="d-flex align-items-center justify-content-between">
                        <div>
                            <div className="fw-semibold text-dark">{t("finance.reports.title")}</div>
                            <div className="small text-muted mt-1">{t("finance.pwa.more.reports_hint")}</div>
                        </div>
                        <i className="ri-arrow-right-s-line fs-4 text-muted"></i>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-3">
            {canManageFinanceStructures && (
                <div className="d-flex justify-content-between align-items-center gap-3">
                    <div className="small text-muted">
                        {limits.budgets.limit && limits.budgets.limit !== -1
                            ? `${budgets.filter((budget) => budget.is_active !== false).length}/${limits.budgets.limit} budgets`
                            : t("finance.shared.unlimited")}
                    </div>
                    <Button
                        variant={budgetCreateDisabled ? "light" : "primary"}
                        className="rounded-pill"
                        disabled={budgetCreateDisabled}
                        data-testid="finance-budget-add"
                        onClick={() => {
                            if (budgetCreateDisabled) {
                                notify.info("Plan quota reached for budgets. Upgrade to add more budgets.");
                                return;
                            }

                            onCreateBudget();
                        }}
                    >
                        {t("finance.budgets.modal.add_title")}
                    </Button>
                </div>
            )}
            {budgets.map((budget) => (
                <Card key={budget.id} className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }} data-testid={`finance-budget-card-${budget.id}`}>
                    <Card.Body className="p-3">
                        <div className="d-flex align-items-start justify-content-between gap-3">
                            <div>
                                <div className="fw-semibold text-dark">{budget.name}</div>
                                <div className="small text-muted mt-1">{budget.period_month} · {budget.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}</div>
                            </div>
                            {(permissions.manageShared || String(budget.owner_member_id || "") === String(activeMemberId || "")) && (
                                <button
                                    type="button"
                                    data-testid={`finance-budget-edit-${budget.id}`}
                                    className="btn btn-light rounded-circle border-0"
                                    onClick={() => onEditBudget(budget)}
                                >
                                    <i className="ri-pencil-line"></i>
                                </button>
                            )}
                        </div>
                        <div className="d-flex justify-content-between mt-3 small text-muted">
                            <span>{t("finance.budgets.fields.allocated_amount")}</span>
                            <span>{formatAmount(Number(budget.allocated_amount || 0), defaultCurrency)}</span>
                        </div>
                        <div className="d-flex justify-content-between mt-1 small text-muted">
                            <span>{t("finance.budgets.fields.remaining")}</span>
                            <span className={Number(budget.remaining_amount) < 0 ? "text-danger fw-semibold" : ""}>{formatAmount(Number(budget.remaining_amount || 0), defaultCurrency)}</span>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default MoreTab;
