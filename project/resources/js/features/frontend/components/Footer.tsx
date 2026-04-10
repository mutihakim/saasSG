import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

import { SharedPageProps } from '@/types/page';

const Footer = () => {
    const { props } = usePage<SharedPageProps>();
    const tenant = props.currentTenant;

    return (
        <React.Fragment>
            <footer className="custom-footer bg-dark py-5 position-relative">
                <Container>
                    <Row>
                        <Col lg={4} className="mt-4">
                            <div>
                                <div>
                                    <span className="fw-bold fs-20 text-white">{tenant?.presentable_name || tenant?.name || 'appsah'}</span>
                                </div>
                                <div className="mt-4 fs-13 text-muted">
                                    <p>Platform Keluarga Digital</p>
                                    <p className="ff-secondary">Menghubungkan setiap anggota keluarga dalam satu wadah yang hangat, aman, dan personal untuk berbagi momen berharga.</p>
                                </div>
                            </div>
                        </Col>

                        <Col lg={7} className="ms-lg-auto">
                            <Row>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Navigasi</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            <li><Link href="#features">Fitur</Link></li>
                                            <li><Link href="#hero">Beranda</Link></li>
                                        </ul>
                                    </div>
                                </Col>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Akses</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            <li><Link href="/login">Login Anggota</Link></li>
                                            <li><Link href="/admin/login">Login Admin</Link></li>
                                        </ul>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row className="text-center text-sm-start align-items-center mt-5">
                        <Col sm={6}>
                            <div>
                                <p className="copy-rights mb-0 text-muted">
                                    {new Date().getFullYear()} (c) {tenant?.presentable_name || 'appsah'}
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </React.Fragment >
    );
};

export default Footer;
