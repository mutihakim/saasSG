import classnames from "classnames";
import React, { useState } from 'react';
import { Col, Container, Row, Collapse } from 'react-bootstrap';

const Faqs = () => {

    const [col1, setcol1] = useState<boolean>(true);
    const [col2, setcol2] = useState<boolean>(false);
    const [col3, setcol3] = useState<boolean>(false);
    const [col4, setcol4] = useState<boolean>(false);

    const [col9, setcol5] = useState<boolean>(false);
    const [col10, setcol6] = useState<boolean>(true);
    const [col11, setcol7] = useState<boolean>(false);
    const [col12, setcol8] = useState<boolean>(false);

    const t_col1 = () => {
        setcol1(!col1);
        setcol2(false);
        setcol3(false);
        setcol4(false);

    };

    const t_col2 = () => {
        setcol2(!col2);
        setcol1(false);
        setcol3(false);
        setcol4(false);

    };

    const t_col3 = () => {
        setcol3(!col3);
        setcol1(false);
        setcol2(false);
        setcol4(false);

    };

    const t_col4 = () => {
        setcol4(!col4);
        setcol1(false);
        setcol2(false);
        setcol3(false);
    };

    const t_col5 = () => {
        setcol5(!col9);
        setcol6(false);
        setcol7(false);
        setcol8(false);

    };

    const t_col6 = () => {
        setcol6(!col10);
        setcol7(false);
        setcol8(false);
        setcol5(false);

    };

    const t_col7 = () => {
        setcol7(!col11);
        setcol5(false);
        setcol6(false);
        setcol8(false);

    };

    const t_col8 = () => {
        setcol8(!col12);
        setcol5(false);
        setcol6(false);
        setcol7(false);
    };

    return (
        <React.Fragment>
            <section className="section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-bold">Pertanyaan yang Sering Diajukan</h3>
                                <p className="text-muted mb-4">Masih ragu untuk mulai menyatukan aplikasi keluarga Anda? Berikut jawaban atas pertanyaan umum sebelum Anda bergabung.</p>

                                <div>
                                    <a href="mailto:hello@saasfamz.com" className="btn btn-primary btn-label rounded-pill me-1"><i className="ri-mail-line label-icon align-middle rounded-pill fs-16 me-2"></i> Hubungi Kami</a>
                                    <a href="/register" className="btn btn-info btn-label rounded-pill"><i className="ri-rocket-line label-icon align-middle rounded-pill fs-16 me-2"></i> Mulai Percobaan</a>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-lg-5 g-4">
                        <Col lg={6}>
                            <div className="d-flex align-items-center mb-2">
                                <div className="flex-shrink-0 me-1">
                                    <i className="ri-question-line fs-24 align-middle text-success me-1"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="mb-0 fw-bold">Pertanyaan Umum</h5>
                                </div>
                            </div>
                            <div className="accordion custom-accordionwithicon custom-accordion-border accordion-border-box"
                                id="genques-accordion">
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="genques-headingOne">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col1 }
                                            )}
                                            type="button"
                                            onClick={t_col1}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Apa yang membedakan saasfamz dari aplikasi produktivitas lain?
                                        </button>
                                    </h2>
                                    <Collapse in={col1} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            saasfamz merangkum seluruh aspek keluarga—mulai dari kalender, tugas, belanja, hingga keuangan dan gamifikasi anak—dalam SATU tempat. Anda tidak perlu mengunduh 5 aplikasi berbeda untuk 5 kebutuhan.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="genques-headingTwo">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col2 }
                                            )}
                                            type="button"
                                            onClick={t_col2}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Bagaimana cara kerja fitur Gamifikasi untuk anak?
                                        </button>
                                    </h2>
                                    <Collapse in={col2} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Anda mengatur tugas harian/rutinitas (misal: "sikat gigi", "bereskan mainan") di Mesin Tugas Inti. Setiap tugas yang diselesaikan memberi anak poin. Poin tersebut lalu bisa ditukarkan anak dengan waktu main ekstra atau hadiah di Toko Hadiah Pribadi.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="genques-headingThree">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col3 }
                                            )}
                                            type="button"
                                            onClick={t_col3}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Bagaimana Asisten WhatsApp bekerja?
                                        </button>
                                    </h2>
                                    <Collapse in={col3} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Anda cukup mengirim pesan ke nomor bot kami seperti "Beli galon 20.000", dan sistem akan membalas dengan tautan sekali klik untuk memverifikasi pencatatan tersebut langsung ke modul Keuangan Anda tanpa perlu repot membuka menu aplikasi.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="genques-headingFour">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col4 }
                                            )}
                                            type="button"
                                            onClick={t_col4}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Bisakah seluruh keluarga menggunakan satu paket langganan?
                                        </button>
                                    </h2>
                                    <Collapse in={col4} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Ya! Setiap paket mencakup ruang keluarga untuk semua anggota. Anda cukup mengundang pasangan, anak usia sekolah, kakek, hingga nenek dalam satu dompet ruang keluarga.
                                        </div>
                                    </Collapse>
                                </div>
                            </div>
                        </Col>

                        <Col lg={6}>
                            <div className="d-flex align-items-center mb-2">
                                <div className="flex-shrink-0 me-1">
                                    <i className="ri-shield-keyhole-line fs-24 align-middle text-success me-1"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="mb-0 fw-bold">Privasi &amp; Keamanan Data Keluarga</h5>
                                </div>
                            </div>

                            <div className="accordion custom-accordionwithicon custom-accordion-border accordion-border-box"
                                id="privacy-accordion">
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="privacy-headingOne">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col9 }
                                            )}
                                            type="button"
                                            onClick={t_col5}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Apakah data medis dan informasi rahasia saya aman di Brankas Keluarga?
                                        </button>
                                    </h2>
                                    <Collapse in={col9} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Tentu. Kami mengenkripsi seluruh penyimpanan password Wi-Fi, rekaman medis, dan PIN rumah di dalam Brankas Informasi dengan standar keamanan end-to-end khusus setiap ruang tenant keluarga.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="privacy-headingTwo">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col10 }
                                            )}
                                            type="button"
                                            onClick={t_col6}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Apakah anak saya memiliki akses ke keuangan orang tua?
                                        </button>
                                    </h2>
                                    <Collapse in={col10} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Sama sekali tidak. saasfamz memiliki proteksi peran berlapis. Akun anak hanya dapat melihat tugas mereka, poin hadiah, dan game edukatif. Manajemen uang dan rumah hanya tersedia bagi pengguna dengan peran Orang Tua/Pengelola.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="privacy-headingThree">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col11 }
                                            )}
                                            type="button"
                                            onClick={t_col7}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Bagaimana jika nomor WhatsApp saya hilang?
                                        </button>
                                    </h2>
                                    <Collapse in={col11} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Identitas aplikasi tidak terikat mutlak pada WhatsApp. Anda selalu bisa mengelola aplikasi langsung menggunakan Email dan Password utama, kemudian mengatur ulang penautan nomor bot WA dari dalam dashboard.
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="privacy-headingFour">
                                        <button
                                            className={classnames(
                                                "accordion-button",
                                                "fw-semibold fs-14",
                                                { collapsed: !col12 }
                                            )}
                                            type="button"
                                            onClick={t_col8}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Apakah fitur permainan (Game Center) aman dan bebas iklan?
                                        </button>
                                    </h2>
                                    <Collapse in={col12} className="accordion-collapse">
                                        <div className="accordion-body ff-secondary">
                                            Ya! Seluruh Pusat Permainan Edukatif (Trivia, Tantangan Matematika, Catur) tersedia murni tanpa iklan eksternal apa pun untuk menjamin ruang aman yang terkendali dari layar gawai berlebih.
                                        </div>
                                    </Collapse>
                                </div>
                            </div>

                            {/* <!--end accordion--> */}
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Faqs;
