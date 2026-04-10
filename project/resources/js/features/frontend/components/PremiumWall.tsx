import React from 'react';
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap';

import PremiumStats from './PremiumStats';
import PremiumTeam from './PremiumTeam';

interface Props {
    demo: {
        type: string;
        stats: any[];
        projects: any[];
        team: any[];
        finance: any[];
        rewards: any[];
        agenda: any[];
    };
    tenantName: string;
}

const PremiumWall: React.FC<Props> = ({ demo, tenantName }) => {
    return (
        <section className="section py-5" id="premium-wall">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <div className="text-center mb-5">
                            <h3 className="mb-3 fw-bold">Dinding Kebanggaan {tenantName}</h3>
                            <p className="text-muted mb-4 fs-16">Transparansi dan pencapaian kolektif kita dalam membangun ekosistem yang harmonis.</p>
                        </div>
                    </Col>
                </Row>

                <div className="mb-5">
                    <PremiumStats stats={demo.stats} />
                </div>

                <Row className="g-4 mt-2">
                    <Col lg={7}>
                        <Card className="shadow-sm border-0 h-100">
                            <CardBody className="p-4">
                                <h5 className="fw-bold mb-4">Misi & Nilai Kami</h5>
                                <div className="vstack gap-3">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 avatar-xs">
                                            <div className="avatar-title bg-soft-primary text-primary rounded-circle fs-18">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-1 fw-semibold">Kolaborasi Aktif</h6>
                                            <p className="text-muted mb-0 fs-13">Setiap anggota berkontribusi melalui tugas dan proyek yang terukur.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 avatar-xs">
                                            <div className="avatar-title bg-soft-success text-success rounded-circle fs-18">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-1 fw-semibold">Transparansi Finansial</h6>
                                            <p className="text-muted mb-0 fs-13">Keterbukaan anggaran untuk memastikan masa depan yang lebih baik.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 avatar-xs">
                                            <div className="avatar-title bg-soft-warning text-warning rounded-circle fs-18">
                                                <i className="ri-check-line"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-1 fw-semibold">Penghargaan Positif</h6>
                                            <p className="text-muted mb-0 fs-13">Apresiasi poin untuk setiap kebaikan dan tanggung jawab yang diselesaikan.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-2">
                                    <button className="btn btn-primary w-100">Gabung Bersama Kami</button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg={5}>
                        <PremiumTeam team={demo.team.slice(0, 3)} />
                    </Col>
                </Row>

                <Row className="mt-5 pt-4">
                    <Col lg={12}>
                        <div className="text-center">
                            <h5 className="text-muted fs-14 text-uppercase fw-bold mb-4">Didukung Oleh Teknologi Cloud Terdepan</h5>
                            <Row className="justify-content-center gap-4 opacity-50">
                                <Col xs="auto"><h4 className="fw-bold">APPSAH</h4></Col>
                                <Col xs="auto"><h4 className="fw-bold">LARAVEL</h4></Col>
                                <Col xs="auto"><h4 className="fw-bold">REACT</h4></Col>
                                <Col xs="auto"><h4 className="fw-bold">WHATSAPP</h4></Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default PremiumWall;
