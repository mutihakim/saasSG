import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

// Import Images
import processArrow from "../../../../images/landing/process-arrow-img.png";

const WorkProcess = () => {
    return (
        <React.Fragment>
            <section className="section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Cara Kerja saasfamz</h3>
                                <p className="text-muted mb-4 ff-secondary">Membangun ekosistem keluarga yang teratur semudah tiga langkah sederhana berikut.</p>
                            </div>
                        </Col>
                    </Row>


                    <Row className="text-center">
                        <Col lg={4}>
                            <div className="process-card mt-4">
                                <div className="process-arrow-img d-none d-lg-block">
                                    <img src={processArrow} alt="" className="img-fluid" />
                                </div>
                                <div className="avatar-sm icon-effect mx-auto mb-4">
                                    <div className="avatar-title bg-transparent text-success rounded-circle h1">
                                        <i className="ri-quill-pen-line"></i>
                                    </div>
                                </div>

                                <h5>Daftar & Undang Keluarga</h5>
                                <p className="text-muted ff-secondary">Buat akun keluarga dan undang pasangan serta anggota keluarga lainnya ke dalam satu ruang kendali.</p>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="process-card mt-4">
                                <div className="process-arrow-img d-none d-lg-block">
                                    <img src={processArrow} alt="" className="img-fluid" />
                                </div>
                                <div className="avatar-sm icon-effect mx-auto mb-4">
                                    <div className="avatar-title bg-transparent text-success rounded-circle h1">
                                        <i className="ri-user-follow-line"></i>
                                    </div>
                                </div>

                                <h5>Personalisasi Modul</h5>
                                <p className="text-muted ff-secondary">Pilih modul yang paling dibutuhkan keluarga Anda, mulai dari Kalender, Keuangan, hingga Modul Kesehatan.</p>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="process-card mt-4">
                                <div className="avatar-sm icon-effect mx-auto mb-4">
                                    <div className="avatar-title bg-transparent text-success rounded-circle h1">
                                        <i className="ri-book-mark-line"></i>
                                    </div>
                                </div>

                                <h5>Hubungkan WhatsApp</h5>
                                <p className="text-muted ff-secondary">Aktifkan asisten WhatsApp untuk interaksi instan tanpa perlu membuka aplikasi setiap saat.</p>
                            </div>
                        </Col>

                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default WorkProcess;