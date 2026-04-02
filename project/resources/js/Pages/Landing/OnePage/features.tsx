import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

// Import Images
import img1 from "../../../../images/landing/features/img-1.png";
import img2 from "../../../../images/landing/features/img-2.png";
import img3 from "../../../../images/landing/features/img-3.png";

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
                                        <i className="ri-collage-line fs-36"></i>
                                    </div>
                                </div>
                                <h3 className="mb-3 fs-20">Satu Pusat Kendali (All-in-One)</h3>
                                <p className="mb-4 fs-16">Menghilangkan kebutuhan aplikasi pihak ketiga untuk urusan keluarga. Segalanya tersaji rapi, dari kalender, tugas, hingga fitur hiburan edukatif.</p>

                                <Row className="pt-3">
                                    <Col className="col-4">
                                        <div className="text-center">
                                            <h4>9+</h4>
                                            <p>Modul Cerdas</p>
                                        </div>
                                    </Col>
                                    <Col className="col-4">
                                        <div className="text-center">
                                            <h4>1</h4>
                                            <p>Aplikasi Terpadu</p>
                                        </div>
                                    </Col>
                                    <Col className="col-4">
                                        <div className="text-center">
                                            <h4>∞</h4>
                                            <p>Kemudahan</p>
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
                                <h4 className="text-white mb-0 fw-semibold">Mulai Kelola Keluarga Anda Lebih Baik dengan saasfamz</h4>
                            </div>
                        </Col>
                        <Col className="col-sm-auto">
                            <div>
                                <Link href="/register" className="btn bg-gradient btn-danger"><i className="ri-rocket-line align-middle me-1"></i> Mulai Sekarang</Link>
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
                                <h5 className="fs-12 text-uppercase text-success">Gamifikasi</h5>
                                <h4 className="mb-3">Tugas Harian Kini Lebih Seru</h4>
                                <p className="mb-4">Ubah rutinitas menjadi sistem penghargaan interaktif. Setiap penyelesaian tugas otomatis menghasilkan poin bagi anak, di mana mereka dapat menukarkannya dengan hadiah dan durasi bermain (Screen Time).</p>

                                <Row>
                                    <Col sm={5}>
                                        <div className="vstack gap-2">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div
                                                            className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Rutinitas Harian</h5>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div
                                                            className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Sistem Poin</h5>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div
                                                            className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Toko Hadiah Pribadi</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col sm={5}>
                                        <div className="vstack gap-2">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div
                                                            className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Manajemen Waktu Layar</h5>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 me-2">
                                                    <div className="avatar-xs icon-effect">
                                                        <div
                                                            className="avatar-title bg-transparent text-success rounded-circle h2">
                                                            <i className="ri-check-fill"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-0">Hadiah Khusus</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="mt-4">
                                    <Link href="/register" className="btn btn-primary">Coba Gamifikasi <i className="ri-arrow-right-line align-middle ms-1"></i></Link>
                                </div>
                            </div>
                        </Col>

                        <Col lg={6} sm={7} className="col-10 ms-auto order-1 order-lg-2">
                            <div>
                                <img src={img2} alt="" className="img-fluid" />
                            </div>
                        </Col>
                    </Row>

                    <Row className="align-items-center mt-5 pt-lg-5 gy-4">
                        <Col lg={6} sm={7} className="col-10 mx-auto">
                            <div>
                                <img src={img3} alt="" className="img-fluid" />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="text-muted ps-lg-5">
                                <h5 className="fs-12 text-uppercase text-success">Interaktivitas</h5>
                                <h4 className="mb-3">Aksesibilitas Cepat via WhatsApp</h4>
                                <p className="mb-4">Input dan output data secara instan melalui asisten cerdas WhatsApp. Tak perlu membuka aplikasi untuk sekadar mencatatkan pengeluaran atau menyelesaikan tugas.</p>

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
                                            <p className="mb-0">Pencatatan Keuangan via Chat</p>
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
                                            <p className="mb-0">Tautan Pintar (Deep Linking) Form</p>
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
                                            <p className="mb-0">Laporan Jadwal dan Rekap Harian</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Features;
