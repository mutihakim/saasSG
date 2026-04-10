import React from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

import LazyApexChart from '@/components/ui/LazyApexChart';

interface Transaction { desc: string; date: string; amount: number; cat: string; }
interface FinanceData {
    balance: number;
    income: number;
    expense: number;
    savings: number;
    savings_goal: number;
    savings_label: string;
    kids_wallet: { name: string; balance: number; points: number; allowance: number; avatar: string }[];
    history: { month: string; income: number; expense: number }[];
    categories: { label: string; amount: number; pct: number; color: string }[];
    recent_transactions: Transaction[];
    alerts: { msg: string; type: string }[];
}

interface Props { finance: FinanceData; }

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const PremiumFinance: React.FC<Props> = ({ finance }) => {
    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'area', height: 200, toolbar: { show: false }, sparkline: { enabled: false } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
        xaxis: { categories: finance.history.map(h => h.month), labels: { style: { fontSize: '11px' } } },
        yaxis: { show: false },
        tooltip: { y: { formatter: (v) => fmt(v) } },
        legend: { show: true, position: 'top' },
        colors: ['#0ab39c', '#405189'],
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 3, borderColor: '#f3f6f9' },
    };

    const chartSeries = [
        { name: 'Pemasukan', data: finance.history.map(h => h.income) },
        { name: 'Pengeluaran', data: finance.history.map(h => h.expense) },
    ];

    const savingsPct = Math.round((finance.savings / finance.savings_goal) * 100);

    return (
        <Row className="g-4">
            {/* Main Finance Card */}
            <Col lg={8}>
                <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-wallet-3-line me-2 text-success"></i>
                            Ringkasan Keuangan
                        </h5>
                        <p className="text-muted fs-13 mb-0">Lacak pemasukan, pengeluaran dan tabungan keluarga</p>
                    </Card.Header>
                    <Card.Body>
                        {/* Alert banner */}
                        {finance.alerts.map((a, i) => (
                            <div key={i} className={`alert alert-${a.type} alert-dismissible py-2 mb-3`} role="alert">
                                <i className={`ri-${a.type === 'danger' ? 'error-warning' : 'information'}-line me-2`}></i>
                                <small>{a.msg}</small>
                            </div>
                        ))}

                        {/* Stats row */}
                        <Row className="g-3 mb-4">
                            {[
                                { label: 'Saldo Bersih', val: finance.balance, icon: 'ri-money-dollar-circle-line', color: 'primary' },
                                { label: 'Pemasukan', val: finance.income, icon: 'ri-arrow-up-circle-line', color: 'success' },
                                { label: 'Pengeluaran', val: finance.expense, icon: 'ri-arrow-down-circle-line', color: 'danger' },
                            ].map((s, i) => (
                                <Col md={4} key={i}>
                                    <div className={`p-3 rounded-3 bg-${s.color}-subtle border border-${s.color}-subtle`}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <i className={`${s.icon} text-${s.color} fs-18`}></i>
                                            <span className="text-muted fs-12">{s.label}</span>
                                        </div>
                                        <h5 className={`mb-0 fw-bold text-${s.color}`}>{fmt(s.val)}</h5>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        {/* Chart */}
                        <h6 className="fw-semibold mb-3">Tren 6 Bulan</h6>
                        <LazyApexChart options={chartOptions} series={chartSeries} type="area" height={200} />

                        {/* Category breakdown */}
                        <h6 className="fw-semibold mt-4 mb-3">Kategori Pengeluaran</h6>
                        {finance.categories.map((c, i) => (
                            <div key={i} className="mb-2">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="fs-12 text-muted">{c.label}</span>
                                    <span className="fs-12 fw-medium">{fmt(c.amount)}</span>
                                </div>
                                <ProgressBar now={c.pct} variant={c.color} style={{ height: 6 }} className="rounded-pill" />
                            </div>
                        ))}
                    </Card.Body>
                </Card>
            </Col>

            {/* Sidebar Cards */}
            <Col lg={4}>
                <div className="d-flex flex-column gap-4">
                    {/* Savings goal */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-semibold mb-3">Tabungan Target</h6>
                            <div className="p-3 bg-primary-subtle rounded-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <p className="mb-0 fw-semibold">{finance.savings_label}</p>
                                        <p className="text-muted fs-12 mb-0">{fmt(finance.savings)} / {fmt(finance.savings_goal)}</p>
                                    </div>
                                    <Badge bg="primary">{savingsPct}%</Badge>
                                </div>
                                <ProgressBar now={savingsPct} variant="primary" style={{ height: 8 }} className="rounded-pill" />
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Recent transactions */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                            <h6 className="fw-semibold mb-0">Transaksi Terakhir</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mt-n2">
                                {finance.recent_transactions.map((t, i) => (
                                    <div key={i} className="d-flex align-items-center py-3 border-bottom last-child-border-0">
                                        <div className={`flex-shrink-0 me-3 rounded-3 d-flex align-items-center justify-content-center`}
                                            style={{ width: 36, height: 36, background: t.amount > 0 ? '#d1fae5' : '#fee2e2' }}>
                                            <i className={`${t.amount > 0 ? 'ri-arrow-down-line text-success' : 'ri-arrow-up-line text-danger'} fs-14`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="mb-0 fw-medium fs-13 text-truncate" style={{maxWidth: '120px'}}>{t.desc}</p>
                                            <p className="mb-0 text-muted fs-11">{t.cat}</p>
                                        </div>
                                        <span className={`fw-bold fs-13 ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                                            {t.amount > 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </Col>
        </Row>
    );
};

export default PremiumFinance;
