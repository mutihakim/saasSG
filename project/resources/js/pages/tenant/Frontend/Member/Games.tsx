import { Link } from '@inertiajs/react';
import React from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: unknown;
    demo: unknown;
}

const GamesPage: React.FC<Props> = () => {
    return (
        <MemberPage title="Pusat Game Keluarga" parentLabel="Hiburan">
            <Row className="g-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center game-card__icon"
                                    >
                                        <i className="ri-calculator-line text-warning fs-3"></i>
                                    </div>
                                    <div>
                                        <h4 className="mb-1 fw-bold">Game Matematika</h4>
                                        <p className="text-muted mb-0">Latihan berhitung cepat dengan sistem streak dan mastered pair.</p>
                                    </div>
                                </div>
                                <Badge bg="success-subtle" text="success">Active</Badge>
                            </div>

                            <div className="bg-light rounded-3 p-3 mb-3">
                                <div className="fw-semibold mb-1">Fitur Utama</div>
                                <ul className="mb-0 text-muted">
                                    <li>Operator +, -, *, / dengan mode mencari hasil atau mencari angka.</li>
                                    <li>Timer per soal, score sesi, dan riwayat ringkas.</li>
                                    <li>Progress mastery per pasangan soal tersimpan per member.</li>
                                </ul>
                            </div>

                            <Link href="/games/math" className="btn btn-warning text-dark fw-semibold px-4">
                                Mulai Main
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-transparent border-0 pt-3">
                            <h5 className="fw-bold mb-0">Roadmap Game Lain</h5>
                        </Card.Header>
                        <Card.Body className="pt-2">
                            <div className="d-flex flex-column gap-3">
                                <div className="p-3 border rounded-3">
                                    <div className="fw-semibold">Belajar Kosakata</div>
                                    <div className="small text-muted">Mode flashcard dan kuis adaptif.</div>
                                    <Link href="/games/vocabulary" className="btn btn-sm btn-outline-primary mt-2">
                                        Buka Vocabulary
                                    </Link>
                                </div>
                                <div className="p-3 border rounded-3">
                                    <div className="fw-semibold">Kurikulum</div>
                                    <div className="small text-muted">Latihan soal pilihan ganda per unit pelajaran dengan history sesi.</div>
                                    <Link href="/games/curriculum" className="btn btn-sm btn-outline-primary mt-2">
                                        Buka Curriculum
                                    </Link>
                                </div>
                                <div className="p-3 border rounded-3">
                                    <div className="fw-semibold">Dongeng Teladan</div>
                                    <div className="small text-muted">Generator cerita dan slide interaktif.</div>
                                </div>
                                <div className="p-3 border rounded-3">
                                    <div className="fw-semibold">Alat Bantu Tahfiz</div>
                                    <div className="small text-muted">Pendamping hafalan dengan audio ayat.</div>
                                    <Link href="/games/tahfiz" className="btn btn-sm btn-outline-primary mt-2">
                                        Buka Tahfiz
                                    </Link>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </MemberPage>
    );
};

(GamesPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default GamesPage;
