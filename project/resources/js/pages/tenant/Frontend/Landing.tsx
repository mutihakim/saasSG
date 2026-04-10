import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';

import FamilyFooter from '@/features/frontend/layouts/FamilyFooter';
import FamilyNavbar from '@/features/frontend/layouts/FamilyNavbar';

interface Props {
    tenant: { name: string; display_name?: string; slug: string };
    members_count: number;
    demo: any;
}

const toTop = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};

const Landing: React.FC<Props> = ({ tenant, members_count, demo }) => {
    const tenantName = tenant.display_name ?? tenant.name;

    useEffect(() => {
        const el = document.getElementById('back-to-top');
        const handleScroll = () => {
            if (el) el.style.display = (document.documentElement.scrollTop > 100) ? 'block' : 'none';
        };
        window.onscroll = handleScroll;
    }, []);

    const features = [
        { icon: 'ri-calendar-2-line', title: 'Kalender Bersama', desc: 'Jadwal keluarga terpadu dengan kode warna per anggota', color: 'primary' },
        { icon: 'ri-trophy-line', title: 'Sistem Reward & Poin', desc: 'Gamifikasi rutinitas anak — toko hadiah terintegrasi', color: 'warning' },
        { icon: 'ri-wallet-3-line', title: 'Keuangan Keluarga', desc: 'Lacak pemasukan & pengeluaran dengan grafik otomatis', color: 'success' },
        { icon: 'ri-restaurant-2-line', title: 'Meal Planner', desc: 'Menu mingguan otomatis hasilkan daftar belanja keluarga', color: 'info' },
        { icon: 'ri-seedling-line', title: 'Growth Tracker', desc: 'Pemantauan tumbuh kembang & jadwal imunisasi anak', color: 'danger' },
        { icon: 'ri-earth-line', title: 'Wishlist & Vacation', desc: 'Impian wisata & kuliner keluarga dengan tabungan target', color: 'primary' },
        { icon: 'ri-gamepad-line', title: 'Game Center', desc: 'Mini-games edukatif yang aman untuk seluruh keluarga', color: 'info' },
        { icon: 'ri-whatsapp-line', title: 'WhatsApp Bot Pintar', desc: 'Kelola keluarga langsung dari pesan WhatsApp', color: 'success' },
    ];

    const catBlogColors: Record<string, string> = { Wisata: 'primary', Kuliner: 'warning', Parenting: 'success', Rumah: 'info' };

    return (
        <React.Fragment>
            <Head title={`${tenantName} — Family Hub`} />

            <div className="layout-wrapper landing">
                {/* NAVBAR */}
                <FamilyNavbar tenantName={tenantName} tenantSlug={tenant.slug} mode="public" />

                {/* ============================================================
                    SECTION 1: HERO
                ============================================================ */}
                <section className="section nft-hero" id="hero">
                    <div className="bg-overlay"></div>
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={8} sm={10}>
                                <div className="text-center">
                                    <Badge className="badge-gradient-primary px-3 py-2 mb-3 fs-13 rounded-pill" bg="">
                                        <i className="ri-home-heart-line me-2"></i>All-in-One Family Hub
                                    </Badge>
                                    <h1 className="display-4 fw-semibold mb-4 lh-base text-white">
                                        Selamat Datang di <span className="text-warning">{tenantName}</span>
                                    </h1>
                                    <p className="lead text-white-50 lh-base mb-4 pb-2">
                                        Satu platform untuk kalender keluarga, keuangan, tugas anak, reward, meal planner,
                                        growth tracker, blog, galeri, wishlist wisata, hingga game center — semua terintegrasi WhatsApp.
                                    </p>
                                    <div className="hstack gap-2 justify-content-center">
                                        <Link href="/login" className="btn btn-primary">
                                            Masuk ke Dashboard <i className="ri-arrow-right-line align-middle ms-1"></i>
                                        </Link>
                                        <a href="#fitur" className="btn btn-warning">
                                            Pelajari Fitur <i className="ri-arrow-down-line align-middle ms-1"></i>
                                        </a>
                                    </div>

                                    {/* Quick stats */}
                                    <Row className="g-3 mt-4 justify-content-center">
                                        {[
                                            { val: members_count, label: 'Anggota', icon: 'ri-group-line' },
                                            { val: demo.calendar.length, label: 'Event Mendatang', icon: 'ri-calendar-2-line' },
                                            { val: demo.leaderboard.reduce((s: number, l: any) => s + l.points, 0).toLocaleString(), label: 'Total Poin', icon: 'ri-star-fill' },
                                            { val: `${demo.blogs.length}+`, label: 'Artikel Blog', icon: 'ri-article-line' },
                                        ].map((s, i) => (
                                            <Col xs={6} sm={3} key={i}>
                                                <div className="p-3 rounded-4 border border-white border-opacity-25"
                                                    style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                                                    <i className={`${s.icon} text-warning fs-20 d-block mb-1`}></i>
                                                    <h5 className="text-white fw-bold mb-0">{s.val}</h5>
                                                    <p className="text-white-50 fs-12 mb-0">{s.label}</p>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 2: FITUR UNGGULAN
                ============================================================ */}
                <section className="section" id="fitur">
                    <Container>
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <div className="text-center mb-5">
                                    <h2 className="mb-3 fw-bold lh-base">14 Modul Lengkap untuk Keluarga Modern</h2>
                                    <p className="text-muted">
                                        Dari perencanaan hingga dokumentasi — semua kebutuhan keluarga dalam satu platform yang terintegrasi WhatsApp.
                                    </p>
                                </div>
                            </Col>
                        </Row>
                        <Row className="g-4">
                            {features.map((f, i) => (
                                <Col lg={3} md={4} sm={6} key={i}>
                                    <Card className="shadow-none border h-100">
                                        <Card.Body>
                                            <div className={`avatar-sm rounded-3 bg-${f.color}-subtle d-flex align-items-center justify-content-center mb-4`}
                                                style={{ width: 48, height: 48 }}>
                                                <i className={`${f.icon} text-${f.color} fs-22`}></i>
                                            </div>
                                            <h5 className="mt-0 fw-semibold">{f.title}</h5>
                                            <p className="text-muted fs-14">{f.desc}</p>
                                            <Link href="/login" className={`link-${f.color} fs-14`}>
                                                Buka Fitur <i className="ri-arrow-right-line align-bottom"></i>
                                            </Link>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 3: KALENDER & AGENDA
                ============================================================ */}
                <section className="section bg-light" id="kalender">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={5}>
                                <div>
                                    <Badge bg="primary-subtle" text="primary" className="mb-3">
                                        <i className="ri-calendar-2-line me-1"></i>PRD Modul A
                                    </Badge>
                                    <h2 className="fw-bold mb-3">Kalender Bersama & Proyek Keluarga</h2>
                                    <p className="text-muted lh-lg mb-4">
                                        Satu kalender untuk semua jadwal: agenda, rutinitas pagi/malam, menu makan mingguan, dan proyek keluarga berskala besar — semua berwarna dan terorganisir.
                                    </p>
                                    <div className="d-flex flex-column gap-3 mb-4">
                                        {[
                                            { text: 'Kalender dengan kode warna per anggota', icon: 'ri-palette-line' },
                                            { text: 'Routine engine — pagi, sore, malam', icon: 'ri-time-line' },
                                            { text: 'Menu makan mingguan otomatis', icon: 'ri-restaurant-2-line' },
                                            { text: 'Papan proyek dengan Kanban & milestone', icon: 'ri-kanban-view' },
                                        ].map((item, i) => (
                                            <div key={i} className="d-flex align-items-center gap-3">
                                                <div className="rounded-3 bg-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ width: 36, height: 36 }}>
                                                    <i className={`${item.icon} text-primary fs-16`}></i>
                                                </div>
                                                <p className="mb-0 fw-medium">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <Link href="/login" className="btn btn-primary">
                                        Buka Kalender <i className="ri-arrow-right-line ms-1"></i>
                                    </Link>
                                </div>
                            </Col>
                            <Col lg={7}>
                                <Row className="g-3">
                                    {demo.calendar.map((e: any) => (
                                        <Col sm={6} key={e.id}>
                                            <div className={`p-4 rounded-4 h-100 border ${e.className?.split(' ')[0] || 'bg-primary-subtle'}`}>
                                                <i className="ri-calendar-event-line fs-22 d-block mb-2"></i>
                                                <h6 className="fw-bold mb-1">{e.title}</h6>
                                                <p className="text-muted fs-13 mb-0">
                                                    {new Date(e.start).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 4: KEUANGAN
                ============================================================ */}
                <section className="section" id="keuangan">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={7}>
                                <Row className="g-3">
                                    <Col xs={12}>
                                        <Card className="border-0 shadow-sm">
                                            <Card.Body className="p-4">
                                                <div className="d-flex align-items-center justify-content-between mb-3">
                                                    <div>
                                                        <p className="text-muted fs-13 mb-0">Saldo Bersih Keluarga</p>
                                                        <h2 className="text-success fw-bold mb-0">Rp 12.500.000</h2>
                                                    </div>
                                                    <div className="rounded-3 bg-success-subtle d-flex align-items-center justify-content-center"
                                                        style={{ width: 56, height: 56 }}>
                                                        <i className="ri-bank-line text-success fs-24"></i>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-3">
                                                    {[
                                                        { label: 'Pemasukan', val: 'Rp 25jt', color: 'success', icon: 'ri-arrow-up-circle-line' },
                                                        { label: 'Pengeluaran', val: 'Rp 12.5jt', color: 'danger', icon: 'ri-arrow-down-circle-line' },
                                                        { label: 'Tabungan', val: 'Rp 5jt', color: 'primary', icon: 'ri-save-3-line' },
                                                    ].map((s, i) => (
                                                        <div key={i} className={`flex-grow-1 p-3 rounded-3 bg-${s.color}-subtle text-center`}>
                                                            <i className={`${s.icon} text-${s.color} fs-18 d-block mb-1`}></i>
                                                            <p className={`fw-bold mb-0 text-${s.color}`}>{s.val}</p>
                                                            <p className="text-muted fs-11 mb-0">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    {demo.finance.categories.map((c: any, i: number) => (
                                        <Col xs={12} key={i}>
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="text-muted fs-13 flex-shrink-0" style={{ width: 140 }}>{c.label}</span>
                                                <div className="flex-grow-1">
                                                    <ProgressBar now={c.pct} variant={c.color} style={{ height: 8 }} className="rounded-pill" />
                                                </div>
                                                <span className="fw-semibold fs-13 flex-shrink-0">{c.pct}%</span>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                            <Col lg={5}>
                                <Badge bg="success-subtle" text="success" className="mb-3">
                                    <i className="ri-money-dollar-circle-line me-1"></i>PRD Modul C
                                </Badge>
                                <h2 className="fw-bold mb-3">Keuangan Keluarga yang Transparan</h2>
                                <p className="text-muted lh-lg mb-4">
                                    Lacak setiap pemasukan dan pengeluaran, set batas anggaran per kategori, pantau tabungan target liburan, dan terima peringatan otomatis via WhatsApp.
                                </p>
                                <div className="d-flex flex-column gap-3 mb-4">
                                    {[
                                        { text: 'Grafik tren 6 bulan otomatis', icon: 'ri-bar-chart-line' },
                                        { text: 'Dompet Digital Anak per anggota', icon: 'ri-wallet-3-line' },
                                        { text: 'Alert budget mendekati batas via WA', icon: 'ri-alarm-warning-line' },
                                        { text: 'Kalkulator patungan keluarga besar', icon: 'ri-calculator-line' },
                                    ].map((item, i) => (
                                        <div key={i} className="d-flex align-items-center gap-3">
                                            <div className="rounded-3 bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: 36, height: 36 }}>
                                                <i className={`${item.icon} text-success fs-16`}></i>
                                            </div>
                                            <p className="mb-0 fw-medium">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/login" className="btn btn-success">
                                    Buka Keuangan <i className="ri-arrow-right-line ms-1"></i>
                                </Link>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 5: REWARD & LEADERBOARD
                ============================================================ */}
                <section className="section bg-light" id="reward">
                    <Container>
                        <Row className="justify-content-center mb-5">
                            <Col lg={7} className="text-center">
                                <Badge bg="warning-subtle" text="warning" className="mb-3">
                                    <i className="ri-trophy-line me-1"></i>PRD Modul B
                                </Badge>
                                <h2 className="fw-bold mb-3">Gamifikasi Kehidupan Sehari-hari</h2>
                                <p className="text-muted">Ubah rutinitas menjadi petualangan menyenangkan! Anak mendapat poin setiap menyelesaikan tugas, lalu tukar di Toko Hadiah.</p>
                            </Col>
                        </Row>
                        <Row className="g-4 align-items-center">
                            <Col lg={6}>
                                <div className="p-4 rounded-4"
                                    style={{ background: 'linear-gradient(135deg, #f7b84b 0%, #f7561a 100%)' }}>
                                    <h5 className="text-white fw-bold mb-4">🏆 Leaderboard Minggu Ini</h5>
                                    {demo.leaderboard.map((entry: any, i: number) => (
                                        <div key={i} className={`d-flex align-items-center p-3 rounded-3 mb-2 ${i === 0 ? 'bg-white' : 'bg-white bg-opacity-15'}`}>
                                            <span className="fw-bold me-3 fs-18">
                                                {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                            </span>
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                                style={{ width: 36, height: 36, background: i === 0 ? 'linear-gradient(135deg,#405189,#0ab39c)' : 'rgba(255,255,255,0.25)' }}>
                                                <span className={`fw-bold ${i === 0 ? 'text-white' : 'text-white'}`}>{entry.avatar}</span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className={`mb-0 fw-semibold ${i === 0 ? 'text-dark' : 'text-white'}`}>{entry.name}</p>
                                                <p className={`mb-0 fs-11 ${i === 0 ? 'text-muted' : 'text-white-50'}`}>+{entry.weekly_gain} pts minggu ini</p>
                                            </div>
                                            <span className={`fw-bold fs-16 ${i === 0 ? 'text-warning' : 'text-white'}`}>{entry.points.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                            <Col lg={6}>
                                <h5 className="fw-bold mb-4">🎁 Contoh Toko Hadiah</h5>
                                <Row className="g-3">
                                    {demo.rewards.slice(0, 4).map((r: any) => (
                                        <Col xs={6} key={r.id}>
                                            <div className={`p-3 rounded-3 border text-center bg-${r.color}-subtle border-${r.color}-subtle`}>
                                                <i className={`${r.icon} text-${r.color} fs-28 d-block mb-2`}></i>
                                                <p className="fw-semibold mb-1 fs-13">{r.title}</p>
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    <i className="ri-star-fill text-warning fs-13"></i>
                                                    <span className="fw-bold">{r.cost}</span>
                                                    <span className="text-muted fs-11">pts</span>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 6: GALERI
                ============================================================ */}
                <section className="section" id="galeri">
                    <Container>
                        <Row className="justify-content-center mb-4">
                            <Col lg={7} className="text-center">
                                <Badge bg="info-subtle" text="info" className="mb-3">
                                    <i className="ri-image-2-line me-1"></i>Galeri Keluarga
                                </Badge>
                                <h2 className="fw-bold mb-3">Abadikan Setiap Momen Berharga</h2>
                                <p className="text-muted">Galeri foto keluarga terorganisir berdasarkan album: wisata, kuliner, tumbuh kembang, dan momen istimewa.</p>
                            </Col>
                        </Row>
                        <Row className="g-3">
                            {demo.gallery.map((item: any, i: number) => (
                                <Col xs={12} sm={6} lg={4} key={item.id}>
                                    <div className="rounded-4 overflow-hidden position-relative"
                                        style={{ height: i % 3 === 0 ? 240 : 190, cursor: 'pointer' }}>
                                        <img src={item.img_url} alt={item.title} className="w-100 h-100"
                                            style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                        <div className="position-absolute bottom-0 start-0 end-0 p-3"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                                            <p className="text-white fw-semibold mb-0 fs-13">{item.title}</p>
                                            <div className="d-flex align-items-center gap-2 text-white-50 fs-11">
                                                <span>{item.author} · {item.date}</span>
                                                <span className="ms-auto"><i className="ri-heart-fill text-danger me-1"></i>{item.likes}</span>
                                            </div>
                                        </div>
                                        <Badge bg="dark" className="position-absolute top-0 end-0 m-2 opacity-75 fs-11">{item.cat}</Badge>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <div className="text-center mt-4">
                            <Link href="/login" className="btn btn-info">
                                Lihat Semua Foto <i className="ri-arrow-right-line ms-1"></i>
                            </Link>
                        </div>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 7: BLOG & DOKUMENTASI
                ============================================================ */}
                <section className="section bg-light" id="blog">
                    <Container>
                        <Row className="justify-content-center mb-4">
                            <Col lg={7} className="text-center">
                                <Badge bg="success-subtle" text="success" className="mb-3">
                                    <i className="ri-article-line me-1"></i>Blog Keluarga
                                </Badge>
                                <h2 className="fw-bold mb-3">Dokumentasi Wisata, Kuliner & Parenting</h2>
                                <p className="text-muted">Tulis, simpan, dan bagikan cerita perjalanan, review kuliner, resep favorit, dan catatan tumbuh kembang anak.</p>
                            </Col>
                        </Row>
                        <Row className="g-4">
                            {/* Featured */}
                            <Col lg={7}>
                                {demo.blogs[0] && (
                                    <div className="rounded-4 overflow-hidden position-relative border" style={{ cursor: 'pointer', height: 340 }}>
                                        <img src={demo.blogs[0].cover} alt={demo.blogs[0].title} className="w-100 h-100"
                                            style={{ objectFit: 'cover' }} />
                                        <div className="position-absolute bottom-0 start-0 end-0 p-4"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)' }}>
                                            <Badge bg={catBlogColors[demo.blogs[0].cat] || 'primary'} className="mb-2">{demo.blogs[0].cat}</Badge>
                                            <h4 className="text-white fw-bold mb-2">{demo.blogs[0].title}</h4>
                                            <p className="text-white-50 fs-13 mb-2">{demo.blogs[0].excerpt}</p>
                                            <div className="d-flex gap-3 text-white-50 fs-12">
                                                <span><i className="ri-user-line me-1"></i>{demo.blogs[0].author}</span>
                                                <span><i className="ri-time-line me-1"></i>{demo.blogs[0].read_time}</span>
                                                <span><i className="ri-heart-fill text-danger me-1"></i>{demo.blogs[0].likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Col>
                            <Col lg={5}>
                                {demo.blogs.slice(1, 4).map((post: any) => (
                                    <div key={post.id} className="d-flex gap-3 mb-3 border-bottom pb-3" style={{ cursor: 'pointer' }}>
                                        <img src={post.cover} alt={post.title} className="rounded-3 flex-shrink-0"
                                            style={{ width: 80, height: 72, objectFit: 'cover' }} />
                                        <div>
                                            <Badge bg={catBlogColors[post.cat] || 'primary'} className="mb-1 fs-11">{post.cat}</Badge>
                                            <h6 className="fw-semibold mb-1 fs-14">{post.title}</h6>
                                            <div className="d-flex gap-2 text-muted fs-11">
                                                <span>{post.author}</span>
                                                <span>·</span>
                                                <span>{post.read_time}</span>
                                                <span className="ms-auto"><i className="ri-heart-fill text-danger me-1"></i>{post.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/login" className="btn btn-success btn-sm mt-2">
                                    Baca Semua Artikel <i className="ri-arrow-right-line ms-1"></i>
                                </Link>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 8: WISHLIST
                ============================================================ */}
                <section className="section" id="wishlist">
                    <Container>
                        <Row className="justify-content-center mb-4">
                            <Col lg={7} className="text-center">
                                <Badge bg="danger-subtle" text="danger" className="mb-3">
                                    <i className="ri-heart-3-line me-1"></i>PRD Modul G
                                </Badge>
                                <h2 className="fw-bold mb-3">Wishlist & Vacation Planner</h2>
                                <p className="text-muted">Simpan impian wisata, restoran incaran, dan barang yang ingin dibeli. Dilengkapi progres tabungan dan voting keluarga.</p>
                            </Col>
                        </Row>
                        <Row className="g-3">
                            {demo.wishlists.slice(0, 3).map((item: any) => {
                                const pct = item.target > 0 ? Math.round((item.saved / item.target) * 100) : 0;
                                return (
                                    <Col md={4} key={item.id}>
                                        <div className="border rounded-4 overflow-hidden h-100" style={{ cursor: 'pointer' }}>
                                            <div className="position-relative overflow-hidden" style={{ height: 160 }}>
                                                <img src={item.img} alt={item.title} className="w-100 h-100"
                                                    style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                                <Badge bg={item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'secondary'}
                                                    className="position-absolute top-0 end-0 m-2 fs-11">{item.priority}</Badge>
                                            </div>
                                            <div className="p-3">
                                                <h6 className="fw-bold mb-1">{item.title}</h6>
                                                <p className="text-muted fs-12 mb-2">{item.notes}</p>
                                                {item.target > 0 && (
                                                    <>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="fs-12 text-muted">Tabungan</span>
                                                            <span className="fs-12 fw-semibold text-success">{pct}%</span>
                                                        </div>
                                                        <ProgressBar now={pct} variant="success" style={{ height: 6 }} className="rounded-pill" />
                                                    </>
                                                )}
                                                <div className="d-flex flex-wrap gap-1 mt-2">
                                                    {item.tags.map((tag: string, ti: number) => (
                                                        <Badge key={ti} bg="light" text="dark" className="border fs-11">{tag}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Container>
                </section>

                {/* ============================================================
                    SECTION 9: WHATSAPP CTA
                ============================================================ */}
                <section className="py-5 bg-primary position-relative" id="wa">
                    <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                    <Container style={{ position: 'relative' }}>
                        <Row className="align-items-center gy-4">
                            <Col lg={7}>
                                <div>
                                    <Badge bg="light" text="success" className="mb-3">
                                        <i className="ri-whatsapp-line me-1 text-success"></i>PRD Modul I
                                    </Badge>
                                    <h2 className="fw-bold text-white mb-3">
                                        Kelola Keluarga dari WhatsApp
                                    </h2>
                                    <p className="text-white-50 fs-16 lh-lg mb-4">
                                        Ketik perintah di WA — sistem otomatis catat keuangan, verifikasi tugas anak, kirim pengingat agenda, dan laporan mingguan langsung di chat.
                                    </p>
                                    <Row className="g-3">
                                        {demo.wa_commands.map((cmd: any, i: number) => (
                                            <Col sm={6} key={i}>
                                                <div className="p-3 rounded-3 border border-white border-opacity-25"
                                                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                                                    <code className="text-warning d-block mb-1 fs-12">{cmd.cmd}</code>
                                                    <p className="text-white-50 fs-12 mb-0">{cmd.desc}</p>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            </Col>
                            <Col lg={5} className="text-center">
                                <div className="p-4 rounded-4 border border-white border-opacity-25"
                                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                                    <i className="ri-whatsapp-line text-white" style={{ fontSize: 72 }}></i>
                                    <h5 className="text-white fw-bold mt-2 mb-2">Mulai Sekarang</h5>
                                    <p className="text-white-50 fs-13 mb-3">Masuk ke dashboard dan hubungkan WhatsApp keluarga Anda</p>
                                    <Link href="/login" className="btn btn-warning fw-bold px-4 rounded-pill">
                                        <i className="ri-login-box-line me-2"></i>Masuk & Hubungkan
                                    </Link>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* FOOTER */}
                <FamilyFooter tenantName={tenantName} tenantSlug={tenant.slug} />

                {/* Back to Top */}
                <button
                    onClick={toTop}
                    className="btn btn-danger btn-icon landing-back-top"
                    id="back-to-top"
                    style={{ display: 'none' }}
                >
                    <i className="ri-arrow-up-line"></i>
                </button>
            </div>
        </React.Fragment>
    );
};

export default Landing;
