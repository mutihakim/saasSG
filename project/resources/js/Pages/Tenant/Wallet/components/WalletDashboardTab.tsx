import React from "react";
import ReactApexChart from "react-apexcharts";
import { Badge, Card, Col, Placeholder, ProgressBar, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceSavingsGoal } from "../../Finance/types";
import { MonthlyReviewStatus, WalletWish, WalletSummary } from "../types";
import { formatCurrency } from "./pwa/types";

type Props = {
    summary: WalletSummary;
    monthlyReview: MonthlyReviewStatus;
    filteredGoals: FinanceSavingsGoal[];
    filteredWishes: WalletWish[];
    loading?: boolean;
    onOpenMonthlyReview: () => void;
};

const WalletDashboardTab = ({ summary, monthlyReview, filteredGoals, filteredWishes, loading = false, onOpenMonthlyReview }: Props) => {
    const { t } = useTranslation();
    const freeFunds = Number(summary.freeFunds || 0);
    const assetSeries = (summary.assetAllocation || []).map((item) => Number(item.value || 0));
    const assetOptions: ApexCharts.ApexOptions = {
        chart: { type: "donut", toolbar: { show: false } },
        labels: (summary.assetAllocation || []).map((item) => t(`wallet.account_types.${item.label}`, { defaultValue: item.label })),
        legend: { position: "bottom" },
        stroke: { width: 0 },
        dataLabels: { enabled: false },
        colors: ["#2563eb", "#16a34a", "#0891b2", "#7c3aed", "#f97316"],
        plotOptions: {
            pie: {
                donut: {
                    size: "68%",
                },
            },
        },
    };
    const debtOptions: ApexCharts.ApexOptions = {
        chart: { type: "radialBar", sparkline: { enabled: true } },
        plotOptions: {
            radialBar: {
                hollow: { size: "62%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 6,
                        fontSize: "22px",
                        fontWeight: 700,
                        formatter: (value) => `${Math.round(Number(value))}%`,
                    },
                },
            },
        },
        colors: [Number(summary.debtRatio || 0) > 30 ? "#f97316" : "#0f766e"],
    };
    const priorityWishes = filteredWishes
        .filter((wish) => wish.priority === "high" && wish.status !== "converted")
        .slice(0, 3);
    const quickWishes = (summary.wishlistQuickView || [])
        .map((quickWish) => filteredWishes.find((wish) => String(wish.id) === String(quickWish.id)))
        .filter(Boolean) as WalletWish[];

    if (loading) {
        return (
            <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((block) => (
                    <Card key={block} className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-3">
                            <Placeholder as="div" animation="glow">
                                <Placeholder xs={5} className="mb-3 rounded" />
                                <Placeholder xs={9} className="mb-2 rounded" />
                                <Placeholder xs={12} className="rounded" style={{ height: 160 }} />
                            </Placeholder>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-3">
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-3">
                    <div className="rounded-4 p-3 mb-3" style={{ background: "linear-gradient(135deg, rgba(14, 165, 233, 0.10), rgba(37, 99, 235, 0.12))" }}>
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                            <div>
                                <div className="text-uppercase small fw-semibold text-primary">{t("wallet.dashboard.monthly_review_title", { defaultValue: "Monthly Review" })}</div>
                                <div className="fw-bold mt-1" style={{ fontSize: "1.05rem" }}>
                                    {monthlyReview.suggested_period_month || monthlyReview.previous_month}
                                </div>
                                <div className="small text-muted mt-1">
                                    {monthlyReview.planning_blocked
                                        ? t("wallet.dashboard.monthly_review_blocked", { defaultValue: "Budget bulan ini dan transfer wallet masih dikunci sampai review bulan lalu selesai." })
                                        : t("wallet.dashboard.monthly_review_ready", { defaultValue: "Tutup buku, rapikan wallet sweep, lalu siapkan budget bulan berikutnya." })}
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Badge bg={monthlyReview.planning_blocked ? "warning" : "success"}>
                                    {monthlyReview.previous_month_status === "closed"
                                        ? t("wallet.dashboard.monthly_review_closed", { defaultValue: "Closed" })
                                        : monthlyReview.planning_blocked
                                            ? t("wallet.dashboard.monthly_review_action_needed", { defaultValue: "Action Needed" })
                                            : t("wallet.dashboard.monthly_review_open", { defaultValue: "Open" })}
                                </Badge>
                                <button
                                    type="button"
                                    className={`btn rounded-pill px-3 ${monthlyReview.previous_month_status === "closed" ? "btn-outline-primary" : "btn-primary"}`}
                                    onClick={onOpenMonthlyReview}
                                    disabled={!monthlyReview.suggested_period_month}
                                >
                                    {monthlyReview.previous_month_status === "closed"
                                        ? t("wallet.dashboard.monthly_review_view_button", { defaultValue: "View Review" })
                                        : t("wallet.dashboard.monthly_review_button", { defaultValue: "Open Review" })}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Row className="g-3 align-items-stretch">
                        <Col md={4}>
                            <div className="h-100 rounded-4 p-3" style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(20, 184, 166, 0.10))" }}>
                                <div className="text-muted small">{t("wallet.metrics.net_worth")}</div>
                                <div className="fw-bold mt-1" style={{ fontSize: "1.15rem" }}>{formatCurrency(summary.netWorth)}</div>
                                <div className="small text-muted mt-2">{t("wallet.dashboard.net_worth_hint")}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="h-100 rounded-4 p-3 bg-light">
                                <div className="text-muted small">{t("wallet.dashboard.liquidity_title")}</div>
                                <div className="fw-bold mt-1" style={{ fontSize: "1.15rem" }}>{formatCurrency(freeFunds)}</div>
                                <div className="small text-muted mt-2">
                                    {t("wallet.dashboard.liquidity_ratio_caption", { ratio: Number(summary.liquidityRatio || 0).toFixed(1) })}
                                </div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="h-100 rounded-4 p-3 bg-light">
                                <div className="text-muted small">{t("wallet.dashboard.debt_status")}</div>
                                <div className="fw-bold mt-1" style={{ fontSize: "1.15rem", color: Number(summary.debtRatio || 0) > 30 ? "#c2410c" : "#0f766e" }}>
                                    {formatCurrency(summary.debtStatusTotal || 0)}
                                </div>
                                <div className="small mt-2" style={{ color: Number(summary.debtRatio || 0) > 30 ? "#c2410c" : "#64748b" }}>
                                    {t("wallet.dashboard.debt_ratio_caption", { ratio: Number(summary.debtRatio || 0).toFixed(1) })}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="fw-semibold">{t("wallet.dashboard.cashflow_title")}</div>
                                <Badge bg="light" text="dark">{summary.periodMonth}</Badge>
                            </div>
                            <div className="d-grid gap-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="small text-muted">{t("wallet.dashboard.monthly_income")}</span>
                                    <span className="fw-semibold text-success">{formatCurrency(summary.monthlyIncome || 0)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="small text-muted">{t("wallet.dashboard.monthly_spending")}</span>
                                    <span className="fw-semibold" style={{ color: "#dc2626" }}>{formatCurrency(summary.monthlySpending || 0)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="small text-muted">{t("wallet.dashboard.saving_rate")}</span>
                                    <span className="fw-semibold">{Number(summary.savingRate || 0).toFixed(1)}%</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="small text-muted">{t("wallet.dashboard.monthly_saving")}</span>
                                    <span className="fw-semibold">{formatCurrency(summary.monthlySaving || 0)}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-3">
                            <div className="fw-semibold mb-3">{t("wallet.dashboard.asset_mix")}</div>
                            {assetSeries.length > 0 ? (
                                <ReactApexChart options={assetOptions} series={assetSeries} type="donut" height={280} />
                            ) : (
                                <div className="text-muted small py-5 text-center">{t("wallet.empty_goals")}</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-3">
                            <div className="fw-semibold mb-3">{t("wallet.dashboard.debt_ratio_title")}</div>
                            <ReactApexChart options={debtOptions} series={[Number(summary.debtRatio || 0)]} type="radialBar" height={250} />
                            {Number(summary.debtRatio || 0) > 30 && (
                                <div className="small text-warning mt-2">{t("wallet.dashboard.debt_warning")}</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-3">
                            <div className="fw-semibold mb-3">{t("wallet.dashboard.nearest_goals")}</div>
                            <div className="d-flex flex-column gap-2">
                                {filteredGoals.slice(0, 3).map((goal) => {
                                    const progress = Math.min(100, (Number(goal.current_amount || 0) / Math.max(Number(goal.target_amount || 1), 1)) * 100);
                                    return (
                                        <div key={goal.id} className="bg-light rounded-4 px-3 py-2">
                                            <div className="d-flex justify-content-between gap-2">
                                                <div className="fw-semibold">{goal.name}</div>
                                                <Badge bg="info-subtle" text="info">{Math.round(progress)}%</Badge>
                                            </div>
                                            <div className="small text-muted mt-1">
                                                {formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount || 0)}
                                            </div>
                                            <ProgressBar now={progress} className="mt-2" />
                                        </div>
                                    );
                                })}
                                {filteredGoals.length === 0 && <div className="text-muted small">{t("wallet.empty_goals")}</div>}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-3">
                            <div className="fw-semibold mb-3">{t("wallet.dashboard.wishlist_quick_view")}</div>
                            <div className="d-flex flex-column gap-2">
                                {quickWishes.map((wish) => (
                                    <div key={wish.id} className="bg-light rounded-4 px-3 py-2">
                                        <div className="d-flex justify-content-between gap-2">
                                            <div className="fw-semibold">{wish.title}</div>
                                            <Badge bg={wish.priority === "high" ? "warning" : "secondary"}>{t(`wallet.priority.${wish.priority}`)}</Badge>
                                        </div>
                                        <div className="small text-muted mt-1">{formatCurrency(wish.estimated_amount || 0)}</div>
                                    </div>
                                ))}
                                {quickWishes.length === 0 && priorityWishes.map((wish) => (
                                    <div key={wish.id} className="bg-light rounded-4 px-3 py-2">
                                        <div className="d-flex justify-content-between gap-2">
                                            <div className="fw-semibold">{wish.title}</div>
                                            <Badge bg="warning-subtle" text="warning">{t(`wallet.priority.${wish.priority}`)}</Badge>
                                        </div>
                                        <div className="small text-muted mt-1">{formatCurrency(wish.estimated_amount)}</div>
                                    </div>
                                ))}
                                {quickWishes.length === 0 && priorityWishes.length === 0 && <div className="text-muted small">{t("wallet.empty_wishes")}</div>}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default WalletDashboardTab;
