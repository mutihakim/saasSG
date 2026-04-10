import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

import LazyApexChart from '@/components/ui/LazyApexChart';

interface Milestone { date: string; title: string; cat: string; }
interface GrowthPoint { month: string; height: number; weight: number; }
interface Immunization { vaccine: string; due: string; done: boolean; }

interface Child {
    name: string;
    dob: string;
    age: string;
    current: { height: number; weight: number; head_circ?: number };
    milestones: Milestone[];
    growth_history: GrowthPoint[];
    immunizations: Immunization[];
}

interface GrowthTracker { children: Child[] }
interface Props { growth_tracker: GrowthTracker }

const catColors: Record<string, string> = {
    Motorik: 'primary', Akademik: 'success', Skill: 'warning', Kognitif: 'info', Bahasa: 'danger'
};

const PremiumGrowthTracker: React.FC<Props> = ({ growth_tracker }) => {
    const [selectedChild, setSelectedChild] = useState(0);

    const child = growth_tracker.children[selectedChild];

    const chartOpts: ApexCharts.ApexOptions = {
        chart: { type: 'line', height: 160, toolbar: { show: false }, sparkline: { enabled: false } },
        stroke: { curve: 'smooth', width: [2, 2], dashArray: [0, 5] },
        xaxis: { categories: child.growth_history.map(g => g.month), labels: { style: { fontSize: '11px' } } },
        yaxis: [
            { title: { text: 'Tinggi (cm)', style: { fontSize: '11px' } } },
            { opposite: true, title: { text: 'Berat (kg)', style: { fontSize: '11px' } } },
        ],
        colors: ['#405189', '#0ab39c'],
        tooltip: { y: [{ formatter: v => `${v} cm` }, { formatter: v => `${v} kg` }] },
        legend: { show: true, position: 'top' },
        grid: { strokeDashArray: 3, borderColor: '#f3f6f9' },
        dataLabels: { enabled: false },
    };

    const chartSeries = [
        { name: 'Tinggi (cm)', data: child.growth_history.map(g => g.height) },
        { name: 'Berat (kg)', data: child.growth_history.map(g => g.weight) },
    ];

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-seedling-line me-2 text-success"></i>
                            Growth Tracker Anak
                        </h5>
                        <p className="text-muted fs-13 mb-0">Pantau tumbuh kembang dan milestone si kecil</p>
                    </div>
                    <div className="d-flex gap-1">
                        {growth_tracker.children.map((c, i) => (
                            <button key={i} onClick={() => setSelectedChild(i)}
                                className={`btn btn-sm ${selectedChild === i ? 'btn-success' : 'btn-soft-secondary'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {/* Current stats */}
                <Row className="g-3 mb-4">
                    <Col xs={12} md={4}>
                        <div className="p-4 rounded-4 text-center"
                            style={{ background: 'linear-gradient(135deg, #0ab39c 0%, #405189 100%)' }}>
                            <div className="rounded-circle bg-white mx-auto d-flex align-items-center justify-content-center mb-3"
                                style={{ width: 64, height: 64 }}>
                                <span className="fw-bold text-primary fs-24">{child.name.charAt(0)}</span>
                            </div>
                            <h5 className="text-white fw-bold mb-0">{child.name}</h5>
                            <p className="text-white-50 mb-3">{child.age}</p>
                            <Row className="g-2">
                                <Col xs={6}>
                                    <div className="bg-white bg-opacity-10 rounded-3 p-2">
                                        <div className="fw-bold text-white fs-18">{child.current.height}</div>
                                        <div className="text-white-50 fs-11">cm tinggi</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="bg-white bg-opacity-10 rounded-3 p-2">
                                        <div className="fw-bold text-white fs-18">{child.current.weight}</div>
                                        <div className="text-white-50 fs-11">kg berat</div>
                                    </div>
                                </Col>
                                {child.current.head_circ && (
                                    <Col xs={12}>
                                        <div className="bg-white bg-opacity-10 rounded-3 p-2">
                                            <div className="fw-bold text-white fs-18">{child.current.head_circ} cm</div>
                                            <div className="text-white-50 fs-11">lingkar kepala</div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </Col>
                    <Col xs={12} md={8}>
                        <h6 className="fw-semibold mb-2">Grafik Tumbuh Kembang</h6>
                        <LazyApexChart options={chartOpts} series={chartSeries} type="line" height={160} />
                    </Col>
                </Row>

                <Row className="g-3">
                    {/* Milestones */}
                    <Col md={7}>
                        <h6 className="fw-semibold mb-3">
                            <i className="ri-award-line text-warning me-2"></i>
                            Milestone Terbaru
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            {child.milestones.map((m, i) => (
                                <div key={i} className="d-flex align-items-start gap-3 p-3 border rounded-3">
                                    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 40, height: 40, background: `rgba(var(--bs-${catColors[m.cat] || 'primary'}-rgb), 0.1)` }}>
                                        <i className={`ri-star-line text-${catColors[m.cat] || 'primary'} fs-16`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="fw-semibold mb-1 fs-13">{m.title}</p>
                                        <div className="d-flex gap-2 align-items-center">
                                            <Badge bg={catColors[m.cat] || 'primary'} className="fs-11">{m.cat}</Badge>
                                            <span className="text-muted fs-11"><i className="ri-calendar-line me-1"></i>{m.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>

                    {/* Immunizations */}
                    <Col md={5}>
                        <h6 className="fw-semibold mb-3">
                            <i className="ri-medicine-bottle-line text-danger me-2"></i>
                            Jadwal Imunisasi
                        </h6>
                        {child.immunizations.map((imm, i) => (
                            <div key={i} className={`d-flex align-items-center p-3 mb-2 rounded-3 border ${imm.done ? 'bg-success-subtle border-success-subtle' : 'border-danger-subtle bg-danger-subtle'}`}>
                                <div className="flex-grow-1">
                                    <p className="fw-semibold mb-0 fs-13">{imm.vaccine}</p>
                                    <p className="text-muted fs-11 mb-0">Jadwal: {imm.due}</p>
                                </div>
                                <Badge bg={imm.done ? 'success' : 'danger'} className="fs-11">
                                    {imm.done ? '✓ Selesai' : '⏰ Segera'}
                                </Badge>
                            </div>
                        ))}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default PremiumGrowthTracker;
