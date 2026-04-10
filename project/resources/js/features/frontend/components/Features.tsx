import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

import img1 from "../../../../images/landing/features/img-1.png";
import img2 from "../../../../images/landing/features/img-2.png";
// removed unused img3

const Features = () => {
    return (
        <React.Fragment>

            <section className="section bg-light py-5" id="features">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} sm={7} className="mx-auto">
                            <div>
                                <img src={img1} alt="" className="img-fluid mx-auto" />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="text-muted">
                                <div className="avatar-sm icon-effect mb-4">
                                    <div className="avatar-title bg-transparent rounded-circle text-success h1">
                                        <i className="ri-heart-line fs-36"></i>
                                    </div>
                                </div>
                                <h3 className="mb-3 fs-20">Modul Keluarga Terintegrasi</h3>
                                <p className="mb-4 fs-16">Platform kami dirancang untuk menyatukan keluarga dalam satu ruang digital yang aman. Kelola agenda bersama, bagikan pengumuman, dan simpan memori berharga tanpa gangguan.</p>

                                <Row className="pt-3">
                                    <Col className="col-4">
                                        <div className="text-center">
                                            <h4>3</h4>
                                            <p>Modul Inti</p>
                                        </div>
                                    </Col>
                                    <Col className="col-4">
                                        <div className="text-center">
                                            <h4>100%</h4>
                                            <p>Privasi</p>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="py-5 bg-primary position-relative">
                <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col className="col-sm">
                            <div>
                                <h4 className="text-white mb-0 fw-semibold">Jalin kedekatan keluarga lebih erat dengan platform kami</h4>
                            </div>
                        </Col>
                        <Col className="col-sm-auto">
                            <div>
                                <Link href="/login" className="btn bg-gradient btn-danger"><i className="ri-user-follow-line align-middle me-1"></i> Mulai Gabung</Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="section">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} className="order-2 order-lg-1">
                            <div className="text-muted">
                                <h5 className="fs-12 text-uppercase text-success">Interaksi</h5>
                                <h4 className="mb-3">Ruang Digital yang Hangat & Personal</h4>
                                <p className="mb-4">Setiap tenant keluarga memiliki ruang yang terisolasi sepenuhnya, memastikan data dan percakapan internal Anda tetap menjadi milik Anda.</p>

                                <Row>
                                    <Col sm={6}>
                                        <div className="vstack gap-2">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Agenda Keluarga</h5>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Galeri Momen</h5>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Pengumuman Internal</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="mt-4">
                                    <Link href="/login" className="btn btn-primary">Buka Dashboard Keluarga <i className="ri-arrow-right-line align-middle ms-1"></i></Link>
                                </div>
                            </div>
                        </Col>

                        <Col lg={6} sm={7} className="col-10 ms-auto order-1 order-lg-2">
                            <div>
                                <img src={img2} alt="" className="img-fluid" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Features;
