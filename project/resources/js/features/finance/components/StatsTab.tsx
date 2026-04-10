import React from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceMember } from "../types";

import ReportsPanel from "./ReportsPanel";
import { CARD_RADIUS } from "./pwa/types";

import LazyApexChart from "@/components/ui/LazyApexChart";

type StatsTabProps = {
    statsMetric: "expense" | "income";
    onMetricChange: (value: "expense" | "income") => void;
    categoryBreakdown: Array<{ name: string; amount: number }>;
    categoryChartOptions: ApexCharts.ApexOptions;
    categoryChartSeries: number[];
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    categories: FinanceCategory[];
    members: FinanceMember[];
};

const StatsTab = ({
    statsMetric,
    onMetricChange,
    categoryBreakdown,
    categoryChartOptions,
    categoryChartSeries,
    accounts,
    budgets,
    categories,
    members,
}: StatsTabProps) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex gap-2">
                {(["expense", "income"] as const).map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        className={`btn flex-fill rounded-pill ${statsMetric === mode ? "btn-danger" : "btn-light"}`}
                        onClick={() => onMetricChange(mode)}
                    >
                        {mode === "expense" ? t("finance.summary.expense") : t("finance.summary.income")}
                    </button>
                ))}
            </div>

            <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                <Card.Body>
                    {categoryBreakdown.length > 0 ? (
                        <LazyApexChart options={categoryChartOptions} series={categoryChartSeries} type="donut" height={280} />
                    ) : (
                        <div className="text-center text-muted py-5">{t("finance.pwa.empty.stats_body")}</div>
                    )}
                </Card.Body>
            </Card>

            <ReportsPanel accounts={accounts} budgets={budgets} categories={categories} members={members} compact />
        </div>
    );
};

export default StatsTab;
