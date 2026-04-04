import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

interface ReportsPanelProps {
    accounts: any[];
    budgets: any[];
    categories: any[];
    members: any[];
    compact?: boolean;
}

const ReportsPanel = ({ accounts, budgets, categories, members, compact = false }: ReportsPanelProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
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
            setReport(response.data.data);
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
        xaxis: { categories: (report?.trend || []).map((item: any) => item.bucket) },
        dataLabels: { enabled: false },
        colors: ["#0ab39c", "#f06548", "#405189"],
        fill: { opacity: 0.2 },
        legend: { position: "top" },
    }), [report]);

    const trendSeries = useMemo(() => ([
        { name: t("finance.summary.income"), data: (report?.trend || []).map((item: any) => item.income) },
        { name: t("finance.summary.expense"), data: (report?.trend || []).map((item: any) => item.expense) },
        { name: t("finance.transactions.types.transfer"), data: (report?.trend || []).map((item: any) => item.transfer) },
    ]), [report, t]);

    const expensePie = useMemo(() => ({
        options: {
            chart: { type: "donut", toolbar: { show: false } },
            labels: (report?.expense_by_category || []).map((item: any) => item.name),
            legend: { position: "bottom" },
            dataLabels: { enabled: false },
        },
        series: (report?.expense_by_category || []).map((item: any) => item.amount),
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
                            <Select
                                options={[
                                    { value: "day", label: t("finance.reports.group.day") },
                                    { value: "week", label: t("finance.reports.group.week") },
                                    { value: "month", label: t("finance.reports.group.month") },
                                ]}
                                value={{
                                    value: filters.group_by,
                                    label: t(`finance.reports.group.${filters.group_by}`),
                                }}
                                onChange={(option: any) => setFilters((prev) => ({ ...prev, group_by: option.value }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.account")}</Form.Label>
                            <Select
                                options={accounts.map((account) => ({ value: account.id, label: account.name }))}
                                isClearable
                                value={accounts.find((account) => account.id === filters.account_id) ? { value: filters.account_id, label: accounts.find((account) => account.id === filters.account_id)?.name } : null}
                                onChange={(option: any) => setFilters((prev) => ({ ...prev, account_id: option?.value ?? "" }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label>{t("finance.reports.filters.budget")}</Form.Label>
                            <Select
                                options={budgets.map((budget) => ({ value: budget.id, label: budget.name }))}
                                isClearable
                                value={budgets.find((budget) => budget.id === filters.budget_id) ? { value: filters.budget_id, label: budgets.find((budget) => budget.id === filters.budget_id)?.name } : null}
                                onChange={(option: any) => setFilters((prev) => ({ ...prev, budget_id: option?.value ?? "" }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={2}>
                            <Button className="w-100" onClick={loadReport}>{t("finance.reports.actions.apply")}</Button>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-1">
                        <Col md={4}>
                            <Form.Label>{t("finance.reports.filters.category")}</Form.Label>
                            <Select
                                options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
                                isClearable
                                value={categories.find((category) => String(category.id) === filters.category_id) ? { value: filters.category_id, label: categories.find((category) => String(category.id) === filters.category_id)?.name } : null}
                                onChange={(option: any) => setFilters((prev) => ({ ...prev, category_id: option?.value ?? "" }))}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label>{t("finance.reports.filters.member")}</Form.Label>
                            <Select
                                options={members.map((member) => ({ value: String(member.id), label: member.full_name }))}
                                isClearable
                                value={members.find((member) => String(member.id) === filters.owner_member_id) ? { value: filters.owner_member_id, label: members.find((member) => String(member.id) === filters.owner_member_id)?.full_name } : null}
                                onChange={(option: any) => setFilters((prev) => ({ ...prev, owner_member_id: option?.value ?? "" }))}
                                classNamePrefix="react-select"
                            />
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
                                    <ReactApexChart options={trendOptions} series={trendSeries} type="area" height={compact ? 260 : 320} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={compact ? 12 : 4}>
                            <Card>
                                <Card.Header><h5 className="card-title mb-0">{t("finance.reports.charts.expense_by_category")}</h5></Card.Header>
                                <Card.Body>
                                    <ReactApexChart options={expensePie.options as any} series={expensePie.series} type="donut" height={compact ? 260 : 320} />
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
                                            {(report?.account_breakdown || []).map((item: any) => (
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
                                            {(report?.budget_usage || []).map((item: any) => (
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
