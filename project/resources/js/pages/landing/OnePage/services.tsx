import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

const Services = () => {
    return (
        <React.Fragment>
            <section className="section" id="services">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h1 className="mb-3 ff-secondary fw-bold lh-base">Modul Ekosistem Keluarga Terpadu</h1>
                                <p className="text-muted">saasfamz menyatukan seluruh aspek kehidupan rumah tangga ke dalam satu platform, menghilangkan kebutuhan aplikasi terpisah yang membingungkan.</p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-calendar-event-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Kalender & Waktu</h5>
                                    <p className="text-muted my-3">Tampilan jadwal terpadu dengan warna khusus anggota keluarga dan papan proyek visual.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-task-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Tugas & Gamifikasi</h5>
                                    <p className="text-muted my-3">Mesin tugas cerdas yang memberi poin atas penyelesaian rutinitas (khususnya anak) untuk ditukar hadiah.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-wallet-3-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Keuangan Keluarga</h5>
                                    <p className="text-muted my-3">Pelacak pemasukan, batas anggaran bulanan, dan kalkulator patungan untuk mengelola arus kas.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-restaurant-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Dapur & Belanja</h5>
                                    <p className="text-muted my-3">Rencana menu mingguan yang otomatis mengekstrak bahan ke daftar belanja sinkron waktu nyata.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-heart-pulse-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Kesehatan Terpadu</h5>
                                    <p className="text-muted my-3">Pantau tinggi & berat anak, kalender imunisasi, serta brankas penyimpanan rekam medis.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-safe-2-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Aset & Inventaris</h5>
                                    <p className="text-muted my-3">Simpan password Wi-Fi, kelola stok pakaian anak, hingga pencatatan dimensi area rumah.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-flight-takeoff-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Liburan & Rekreasi</h5>
                                    <p className="text-muted my-3">Susun rencana perjalanan, buat daftar destinasi bersama, dan kelola anggaran liburan keluarga.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-gamepad-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Permainan Edukatif</h5>
                                    <p className="text-muted my-3">Pusat permainan asah otak yang aman untuk anak, lengkap dengan Papan Peringkat Keluarga.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="d-flex p-3">
                                <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm icon-effect">
                                        <div className="avatar-title bg-transparent text-success rounded-circle">
                                            <i className="ri-whatsapp-line fs-36"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fs-18">Integrasi WhatsApp</h5>
                                    <p className="text-muted my-3">Bot asisten cerdas yang membalas pesan instan Anda ke formulir aplikasi tanpa pindah layar.</p>
                                    <div>
                                        <Link href="/landing#features" className="fs-13 fw-medium">Pelajari Lengkap <i className="ri-arrow-right-s-line align-bottom"></i></Link>
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

export default Services;
