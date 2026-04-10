import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

import GuestLayout from '../../layouts/GuestLayout';


interface Props {
    tenantName: string;
    membersCount: number;
    auth?: {
        user: any;
    };
}

const Home: React.FC<Props> = ({ tenantName, membersCount, auth }) => {
    return (
        <GuestLayout>
            <Head title={`${tenantName} - Profil Keluarga`} />

            <div className="pt-5 pb-5 mt-n5" style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', minHeight: '80vh' }}>
                <Container className="pt-5">
                    <Row className="justify-content-center text-center">
                        <Col lg={8}>
                            <div className="mb-4">
                                <div className="display-4 fw-bold text-primary mb-3">
                                    <i className="ri-heart-fill me-2 text-danger" style={{ fontSize: "48px" }}></i> {tenantName}
                                </div>
                                <h2 className="text-muted mb-4">Selamat Datang di Ruang Digital Keluarga Kami</h2>
                                <p className="lead text-secondary mb-5">
                                    Tempat berkumpul, berbagi kenangan, dan mengelola urusan keluarga secara privat dan aman.
                                </p>
                            </div>

                            <Row className="g-4 mb-5">
                                <Col md={6}>
                                    <Card className="border-0 shadow-sm h-100 p-3">
                                        <Card.Body>
                                            <i className="ri-team-line text-primary mb-3" style={{ fontSize: "32px", display: "block" }}></i>
                                            <h4 className="fw-bold">{membersCount} Anggota</h4>
                                            <p className="text-muted small">Anggota keluarga yang sudah terdaftar dalam sistem ini.</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 shadow-sm h-100 p-3">
                                        <Card.Body>
                                            <i className="ri-shield-check-line text-success mb-3" style={{ fontSize: "32px", display: "block" }}></i>
                                            <h4 className="fw-bold">Privat & Aman</h4>
                                            <p className="text-muted small">Hanya anggota keluarga terdaftar yang dapat mengakses fitur lengkap.</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-center gap-3">
                                {auth?.user ? (
                                    <Link href={route('tenant.dashboard')}>
                                        <Button variant="primary" size="lg" className="px-5 py-3 rounded-pill shadow">
                                            Masuk ke Dashboard <i className="ri-arrow-right-line ms-2"></i>
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href={route('login')}>
                                        <Button variant="primary" size="lg" className="px-5 py-3 rounded-pill shadow">
                                            Login Anggota Keluarga <i className="ri-arrow-right-line ms-2"></i>
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .btn-primary { background-color: #405189; border-color: #405189; }
                .btn-primary:hover { background-color: #33416e; border-color: #33416e; }
                .text-primary { color: #405189 !important; }
            ` }} />
        </GuestLayout>
    );
};

export default Home;
