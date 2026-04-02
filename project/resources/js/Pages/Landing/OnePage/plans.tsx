import { Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';

const Plans = () => {
    const [plan, setPlan] = useState<boolean>(true);
    const toggle = () => setPlan(!plan);
    return (
        <React.Fragment>
            <section className="section bg-light" id="plans">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-bold">Pilih Paket Sesuai Kebutuhan Keluarga Anda</h3>
                                <p className="text-muted mb-4">Investasi kecil untuk keharmonisan dan efisiensi waktu keluarga selamanya.</p>

                                <div className="d-flex justify-content-center align-items-center">
                                    <div>
                                        <h5 className="fs-14 mb-0">Bulanan</h5>
                                    </div>
                                    <div className="form-check form-switch fs-20 ms-3 " onClick={toggle} >
                                        <input className="form-check-input" type="checkbox" id="plan-switch" />
                                        <label className="form-check-label" htmlFor="plan-switch"></label>
                                    </div>
                                    <div>
                                        <h5 className="fs-14 mb-0">Tahunan <span className="badge bg-danger-subtle text-danger">Hemat 20%</span></h5>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="gy-4">
                        <Col lg={4}>
                            <Card className="plan-box mb-0">
                                <Card.Body className="p-4 m-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h5 className="mb-1 fw-bold">Keluarga Pemula</h5>
                                            <p className="text-muted mb-0">Dasar & Integrasi WA</p>
                                        </div>
                                        <div className="avatar-sm">
                                            <div className="avatar-title bg-light rounded-circle text-primary">
                                                <i className="ri-home-heart-line fs-20"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-4 text-center">
                                        {plan ? <h2 className="month"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">29k</span> <span
                                            className="fs-13 text-muted">/Bulan</span></h2> :
                                            <h2 className="annual"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">290k</span> <span
                                                className="fs-13 text-muted">/Tahun</span></h2>}
                                    </div>

                                    <div>
                                        <ul className="list-unstyled text-muted vstack gap-3">
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Kalender Bersama
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Mesin Tugas Dasar & Belanja
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Pelacak Keuangan & Anggaran
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <b>Dasar</b> Integrasi WhatsApp
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-danger me-1">
                                                        <i className="ri-close-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Modul Kesehatan Anak
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-danger me-1">
                                                        <i className="ri-close-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Gamifikasi & Toko Hadiah
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="mt-4">
                                            <Link href="/register" className="btn btn-soft-success w-100">Pilih Paket</Link>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* <!--end col--> */}
                        <Col lg={4}>
                            <Card className="plan-box mb-0 ribbon-box right">
                                <Card.Body className="p-4 m-2">
                                    <div className="ribbon-two ribbon-two-danger"><span>Popular</span></div>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h5 className="mb-1 fw-bold">Keluarga Aktif</h5>
                                            <p className="text-muted mb-0">Manajemen Rumah & Kesehatan</p>
                                        </div>
                                        <div className="avatar-sm">
                                            <div className="avatar-title bg-light rounded-circle text-primary">
                                                <i className="ri-medal-fill fs-20"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-4 text-center">
                                        {plan ? <h2 className="month"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">49k</span> <span
                                            className="fs-13 text-muted">/Bulan</span></h2> :
                                            <h2 className="annual"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">490k</span> <span
                                                className="fs-13 text-muted">/Tahun</span></h2>}
                                    </div>

                                    <div>
                                        <ul className="list-unstyled text-muted vstack gap-3">
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Semua Fitur <b>Keluarga Pemula</b>
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Meal Planner & Resep Dapur
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Kesehatan & Tumbuh Kembang Anak
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Papan Proyek Keluarga
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Brankas Dimensi & Data Penting
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-danger me-1">
                                                        <i className="ri-close-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Gamifikasi & Toko Hadiah
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="mt-4">
                                            <Link href="/register" className="btn btn-soft-success w-100">Pilih Paket</Link>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card className="plan-box mb-0">
                                <Card.Body className="p-4 m-2">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h5 className="mb-1 fw-bold">Keluarga Ultimate</h5>
                                            <p className="text-muted mb-0">Gamifikasi Anak & Liburan</p>
                                        </div>
                                        <div className="avatar-sm">
                                            <div className="avatar-title bg-light rounded-circle text-primary">
                                                <i className="ri-vip-diamond-line fs-20"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-4 text-center">
                                        {plan ? <h2 className="month"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">99k</span> <span
                                            className="fs-13 text-muted">/Bulan</span></h2> :
                                            <h2 className="annual"><sup><small>Rp</small></sup><span className="ff-secondary fw-bold">990k</span> <span
                                                className="fs-13 text-muted">/Tahun</span></h2>}
                                    </div>

                                    <div>
                                        <ul className="list-unstyled text-muted vstack gap-3">
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Semua Fitur <b>Keluarga Aktif</b>
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Sistem Poin Gamifikasi Penuh
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Toko Hadiah & Dompet Anak
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Perencana Liburan (Vacation Planner)
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Katalog Pakaian & Mainan
                                                    </div>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 text-success me-1">
                                                        <i className="ri-checkbox-circle-fill fs-15 align-middle"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        Pusat Permainan Edukatif (Game Center)
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="mt-4">
                                            <Link href="/register" className="btn btn-soft-success w-100">Pilih Paket</Link>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Plans;
