import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinanceBudget, FinanceCategory, FinanceMember, FinanceReport } from "../types";

import LazyApexChart from "@/components/ui/LazyApexChart";
import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";


interface ReportsPanelProps {
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    categories: FinanceCategory[];
    members: FinanceMember[];
    compact?: boolean;
}

const ReportsPanel = ({ accounts, budgets, categories, members, compact = false }: ReportsPanelProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<FinanceReport | null>(null);
    const [filters, setFilters] = useState({
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        date_to: new Date().toISOString().slice(0, 10),
        group_by: "day",
        account_id: "",
        budget_id: "",
        category_id: "",
        owner_member_id: "",
    });

    const loadReport = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.get(tenantRoute.apiTo("/finance/reports"), { params: filters });
            setReport(response.data.data as FinanceReport);
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.reports.load_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    }, [filters, tenantRoute, t]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const trendOptions: ApexCharts.ApexOptions = useMemo(() => ({
        chart: { type: "area", toolbar: { show: false } },
        stroke: { curve: "smooth", width: 2 },
        xaxis: { categories: (report?.trend || []).map((item) => item.bucket) },
        dataLabels: { enabled: false },
        colors: ["#0ab39c", "#f06548", "#405189"],
        fill: { opacity: 0.2 },
        legend: { position: "top" },
    }), [report]);

    const trendSeries = useMemo(() => ([
        { name: t("finance.summary.income"), data: (report?.trend || []).map((item) => item.income) },
        { name: t("finance.summary.expense"), data: (report?.trend || []).map((item) => item.expense) },
        { name: t("finance.transactions.types.transfer"), data: (report?.trend || []).map((item) => item.transfer) },
    ]), [report, t]);

    const expensePie = useMemo(() => ({
        options: {
            chart: { type: "donut", toolbar: { show: false } },
            labels: (report?.expense_by_category || []).map((item) => item.name),
            legend: { position: "bottom" },
            dataLabels: { enabled: false },
        },
        series: (report?.expense_by_category || []).map((item) => item.amount),
    }), [report]);

    return (
        <div className={`d-flex flex-column gap-3 ${compact ? "pb-4" : ""}`}>
            <Card>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.from")}</Form.Label>
                            <Form.Control type="date" value={filters.date_from} onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))} />
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.to")}</Form.Label>
                            <Form.Control type="date" value={filters.date_to} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))} />
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.group_by")}</Form.Label>
                            <Form.Select value={filters.group_by} onChange={(e) => setFilters((prev) => ({ ...prev, group_by: e.target.value }))}>
                                <option value="day">{t("finance.reports.group.day")}</option>
                                <option value="week">{t("finance.reports.group.week")}</option>
                                <option value="month">{t("finance.reports.group.month")}</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.account")}</Form.Label>
                            <Form.Select value={filters.account_id} onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value }))}>
                                <option value="">{t("finance.pwa.filters.all")}</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.budget")}</Form.Label>
                            <Form.Select value={filters.budget_id} onChange={(e) => setFilters((prev) => ({ ...prev, budget_id: e.target.value }))}>
                                <option value="">{t("finance.pwa.filters.all")}</option>
                                {budgets.map((budget) => (
                                    <option key={budget.id} value={budget.id}>
                                        {budget.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button className="w-100" onClick={loadReport}>{t("finance.reports.actions.apply")}</Button>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-1">
                        <Col md={4}>
                            <Form.Label>{t("finance.reports.filters.category")}</Form.Label>
                            <Form.Select value={filters.category_id} onChange={(e) => setFilters((prev) => ({ ...prev, category_id: e.target.value }))}>
                                <option value="">{t("finance.pwa.filters.all")}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label>{t("finance.reports.filters.member")}</Form.Label>
                            <Form.Select value={filters.owner_member_id} onChange={(e) => setFilters((prev) => ({ ...prev, owner_member_id: e.target.value }))}>
                                <option value="">{t("finance.pwa.filters.all")}</option>
                                {members.map((member) => (
                                    <option key={member.id} value={String(member.id)}>
                                        {member.full_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <Row className="g-3">
                        <Col md={3}>
                            <Card><Card.Body><div className="text-muted small">{t("finance.summary.income")}</div><div className="fs-4 fw-semibold text-success">{Number(report?.totals?.income || 0).toLocaleString()}</div></Card.Body></Card>
                        </Col>
                        <Col md={3}>
                            <Card><Card.Body><div className="text-muted small">{t("finance.summary.expense")}</div><div className="fs-4 fw-semibold text-danger">{Number(report?.totals?.expense || 0).toLocaleString()}</div></Card.Body></Card>
                        </Col>
                        <Col md={3}>
                            <Card><Card.Body><div className="text-muted small">{t("finance.transactions.types.transfer")}</div><div className="fs-4 fw-semibold text-warning">{Number(report?.totals?.transfer || 0).toLocaleString()}</div></Card.Body></Card>
                        </Col>
                        <Col md={3}>
                            <Card><Card.Body><div className="text-muted small">{t("finance.reports.cards.count")}</div><div className="fs-4 fw-semibold">{Number(report?.totals?.count || 0).toLocaleString()}</div></Card.Body></Card>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col lg={compact ? 12 : 8}>
                            <Card>
                                <Card.Header><h5 className="card-title mb-0">{t("finance.reports.charts.trend")}</h5></Card.Header>
                                <Card.Body>
                                    <LazyApexChart options={trendOptions} series={trendSeries} type="area" height={compact ? 260 : 320} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={compact ? 12 : 4}>
                            <Card>
                                <Card.Header><h5 className="card-title mb-0">{t("finance.reports.charts.expense_by_category")}</h5></Card.Header>
                                <Card.Body>
                                    <LazyApexChart options={expensePie.options as any} series={expensePie.series} type="donut" height={compact ? 260 : 320} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    {!compact && (
                    <Row className="g-3">
                        <Col lg={6}>
                            <Card>
                                <Card.Header><h5 className="card-title mb-0">{t("finance.reports.tables.accounts")}</h5></Card.Header>
                                <Card.Body className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead><tr><th>{t("finance.accounts.title")}</th><th>{t("finance.summary.income")}</th><th>{t("finance.summary.expense")}</th><th>Net</th></tr></thead>
                                        <tbody>
                                                    {(report?.account_breakdown || []).map((item) => (
                                                <tr key={item.name}>
                                                    <td>{item.name}</td>
                                                    <td className="text-success">{Number(item.income).toLocaleString()}</td>
                                                    <td className="text-danger">{Number(item.expense).toLocaleString()}</td>
                                                    <td>{Number(item.net).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={6}>
                            <Card>
                                <Card.Header><h5 className="card-title mb-0">{t("finance.reports.tables.budgets")}</h5></Card.Header>
                                <Card.Body className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead><tr><th>{t("finance.budgets.title")}</th><th>{t("finance.budgets.fields.period")}</th><th>{t("finance.budgets.fields.allocated_amount")}</th><th>{t("finance.budgets.fields.remaining")}</th></tr></thead>
                                        <tbody>
                                            {(report?.budget_usage || []).map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.name}</td>
                                                    <td>{item.period_month}</td>
                                                    <td>{Number(item.allocated_amount).toLocaleString()}</td>
                                                    <td className={Number(item.remaining_amount) < 0 ? "text-danger" : ""}>{Number(item.remaining_amount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsPanel;
