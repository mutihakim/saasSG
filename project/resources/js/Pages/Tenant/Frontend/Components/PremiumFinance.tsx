import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

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
    const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'transactions'>('overview');

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
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-wallet-3-line me-2 text-success"></i>
                            Keuangan Keluarga
                        </h5>
                        <p className="text-muted fs-13 mb-0">Lacak pemasukan, pengeluaran dan tabungan</p>
                    </div>
                    <div className="d-flex gap-1">
                        {(['overview', 'wallet', 'transactions'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`btn btn-sm ${activeTab === tab ? 'btn-success' : 'btn-soft-secondary'}`}>
                                {tab === 'overview' ? 'Ringkasan' : tab === 'wallet' ? 'Dompet Anak' : 'Transaksi'}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {activeTab === 'overview' && (
                    <>
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

                        {/* Savings goal */}
                        <div className="p-3 bg-primary-subtle rounded-3 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <p className="mb-0 fw-semibold">{finance.savings_label}</p>
                                    <p className="text-muted fs-12 mb-0">{fmt(finance.savings)} dari {fmt(finance.savings_goal)}</p>
                                </div>
                                <Badge bg="primary">{savingsPct}%</Badge>
                            </div>
                            <ProgressBar now={savingsPct} variant="primary" style={{ height: 8 }} className="rounded-pill" />
                        </div>

                        {/* Chart */}
                        <h6 className="fw-semibold mb-3">Tren 6 Bulan</h6>
                        <ReactApexChart options={chartOptions} series={chartSeries} type="area" height={200} />

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
                    </>
                )}

                {activeTab === 'wallet' && (
                    <Row className="g-3">
                        {finance.kids_wallet.map((kid, i) => (
                            <Col md={6} key={i}>
                                <div className="p-4 rounded-4 border text-center" style={{ background: 'linear-gradient(135deg, #405189 0%, #0ab39c 100%)' }}>
                                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center mx-auto mb-3"
                                        style={{ width: 60, height: 60 }}>
                                        <span className="fw-bold text-primary fs-20">{kid.name.charAt(0)}</span>
                                    </div>
                                    <h5 className="text-white fw-bold mb-1">{kid.name}</h5>
                                    <h3 className="text-white mb-0">{fmt(kid.balance)}</h3>
                                    <p className="text-white-50 fs-12 mb-3">Saldo Uang Saku</p>
                                    <div className="d-flex gap-3 justify-content-center">
                                        <div className="text-center">
                                            <div className="fs-18 fw-bold text-white">{kid.points.toLocaleString()}</div>
                                            <div className="text-white-50 fs-11">Total Poin</div>
                                        </div>
                                        <div className="vr bg-white opacity-25"></div>
                                        <div className="text-center">
                                            <div className="fs-18 fw-bold text-white">{fmt(kid.allowance)}</div>
                                            <div className="text-white-50 fs-11">Uang Saku/Minggu</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                        <Col xs={12}>
                            <div className="p-3 bg-light rounded-3 text-center">
                                <i className="ri-whatsapp-line text-success fs-20 me-2"></i>
                                <span className="fs-13 text-muted">Ketik <code>poin [nama]</code> di WhatsApp untuk cek real-time</span>
                            </div>
                        </Col>
                    </Row>
                )}

                {activeTab === 'transactions' && (
                    <div>
                        {finance.recent_transactions.map((t, i) => (
                            <div key={i} className="d-flex align-items-center p-3 border-bottom">
                                <div className={`flex-shrink-0 me-3 rounded-3 d-flex align-items-center justify-content-center`}
                                    style={{ width: 42, height: 42, background: t.amount > 0 ? '#d1fae5' : '#fee2e2' }}>
                                    <i className={`${t.amount > 0 ? 'ri-arrow-down-line text-success' : 'ri-arrow-up-line text-danger'} fs-16`}></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 fw-medium fs-13">{t.desc}</p>
                                    <p className="mb-0 text-muted fs-11">{t.date} · {t.cat}</p>
                                </div>
                                <span className={`fw-bold fs-14 ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                                    {t.amount > 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumFinance;
