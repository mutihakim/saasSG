import { Link } from '@inertiajs/react';
import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: { user?: { name?: string } };
    demo: any;
}

const Hub: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => {
    const memberName = member?.user?.name ?? 'Anggota';
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

    const totalPoints = (demo?.leaderboard || []).reduce((s: number, l: any) => s + (l.points || 0), 0);

    // All hrefs are relative — Inertia Link handles SPA navigation
    const modules = [
        { label: 'Kalender', desc: 'Jadwal & agenda', icon: 'ri-calendar-2-line', color: 'primary', href: '/calendar' },
        { label: 'Proyek', desc: 'Papan proyek Kanban', icon: 'ri-kanban-view', color: 'warning', href: '/projects' },
        { label: 'Tugas', desc: 'Rutinitas & to-do', icon: 'ri-checkbox-multiple-line', color: 'success', href: '/tasks' },
        { label: 'Reward', desc: 'Toko hadiah & poin', icon: 'ri-trophy-line', color: 'warning', href: '/rewards' },
        { label: 'Dompet Anak', desc: 'Saldo poin per anak', icon: 'ri-wallet-3-line', color: 'info', href: '/wallet' },
        { label: 'Keuangan', desc: 'Pemasukan & pengeluaran', icon: 'ri-money-dollar-circle-line', color: 'success', href: '/finance' },
        { label: 'Meal Planner', desc: 'Menu & belanja', icon: 'ri-restaurant-2-line', color: 'danger', href: '/kitchen' },
        { label: 'Growth Tracker', desc: 'Tumbuh kembang anak', icon: 'ri-seedling-line', color: 'success', href: '/health' },
        { label: 'Rekam Medis', desc: 'Imunisasi & dokumen', icon: 'ri-medicine-bottle-line', color: 'danger', href: '/medical' },
        { label: 'Inventaris', desc: 'Aset & info rumah', icon: 'ri-home-gear-line', color: 'primary', href: '/assets' },
        { label: 'Wishlist', desc: 'Wisata & kuliner impian', icon: 'ri-heart-3-line', color: 'danger', href: '/leisure' },
        { label: 'Vacation', desc: 'Itinerary & packing', icon: 'ri-suitcase-3-line', color: 'primary', href: '/vacation' },
        { label: 'Game Center', desc: 'Mini-games keluarga', icon: 'ri-gamepad-line', color: 'info', href: '/games' },
        { label: 'WhatsApp', desc: 'WA bot & perintah', icon: 'ri-whatsapp-line', color: 'success', href: '/whatsapp' },
        { label: 'Galeri', desc: 'Album foto keluarga', icon: 'ri-image-line', color: 'info', href: '/gallery' },
        { label: 'Blog', desc: 'Wisata & parenting', icon: 'ri-article-line', color: 'success', href: '/blog' },
        { label: 'File Manager', desc: 'Dokumen penting', icon: 'ri-folder-3-line', color: 'warning', href: '/files' },
    ];

    return (
        <MemberLayout title="Dashboard" tenantName={tenantName} tenantSlug={tenantSlug} memberName={memberName}>
            {/* ── Hero ── full-width gradient */}
            <div style={{
                background: 'linear-gradient(135deg, var(--vz-primary) 0%, #2e4fac 40%, #0ab39c 100%)',
                padding: '60px 0 40px',
            }}>
                <div className="container-fluid px-4">
                    <Row className="align-items-center g-4">
                        <Col lg={7}>
                            <Badge bg="light" text="primary" className="mb-3 px-3 py-2 fs-12 rounded-pill">
                                <i className="ri-home-heart-line me-1"></i>Family Hub · Dashboard
                            </Badge>
                            <h2 className="text-white fw-bold mb-2">{greeting}, {memberName}! 👋</h2>
                            <p className="text-white-50 mb-3">
                                Selamat datang di <strong className="text-white">{tenantName}</strong>.
                                Semua modul tersedia di menu atas atau pilih di bawah.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                {[
                                    { icon: 'ri-star-fill', val: totalPoints.toLocaleString(), label: 'Total Poin', color: 'warning' },
                                    { icon: 'ri-kanban-view', val: (demo?.projects || []).filter((p: any) => p.status === 'In Progress').length, label: 'Proyek Aktif', color: 'light' },
                                    { icon: 'ri-calendar-2-line', val: (demo?.calendar || []).length, label: 'Agenda', color: 'light' },
                                    { icon: 'ri-group-line', val: (demo?.team || []).length, label: 'Anggota', color: 'light' },
                                ].map((s: any, i: number) => (
                                    <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-white border-opacity-25"
                                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        <i className={`${s.icon} text-${s.color} fs-14`}></i>
                                        <span className="text-white fw-semibold">{s.val}</span>
                                        <span className="text-white-50 fs-12">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col lg={5}>
                            <Card className="border-0 shadow-lg">
                                <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                                    <h6 className="fw-bold mb-0"><i className="ri-trophy-fill text-warning me-2"></i>Leaderboard Keluarga</h6>
                                </Card.Header>
                                <Card.Body className="pt-2 pb-3">
                                    {(demo?.leaderboard || []).map((entry: any, i: number) => (
                                        <div key={i} className="d-flex align-items-center gap-2 mb-2">
                                            <span className="fs-16" style={{ width: 24 }}>{i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#405189,#0ab39c)' }}>
                                                <span className="text-white fw-bold fs-12">{entry.avatar}</span>
                                            </div>
                                            <span className="flex-grow-1 fw-medium fs-13">{entry.name}</span>
                                            <div className="d-flex align-items-center gap-1">
                                                <i className="ri-star-fill text-warning fs-12"></i>
                                                <span className="fw-bold fs-13">{entry.points.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* ── Module grid — uses Inertia Link, SPA navigation ── */}
            <section className="section">
                <div className="container-fluid px-4">
                    <h5 className="fw-bold mb-4">Semua Modul ({modules.length})</h5>
                    <Row className="g-3">
                        {(demo?.modules || modules).map((mod: any, i: number) => (
                            <Col xs={6} sm={4} md={3} lg={2} key={i}>
                                {/* Inertia Link → no refresh! */}
                                <Link href={mod.href} className="text-decoration-none">
                                    <Card className="border h-100"
                                        style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => {
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.transform = 'translateY(-4px)';
                                            el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={e => {
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.transform = '';
                                            el.style.boxShadow = '';
                                        }}>
                                        <Card.Body className="p-3 text-center">
                                            <div className={`rounded-3 mx-auto d-flex align-items-center justify-content-center mb-2 bg-${mod.color}-subtle`}
                                                style={{ width: 48, height: 48 }}>
                                                <i className={`${mod.icon} text-${mod.color} fs-20`}></i>
                                            </div>
                                            <h6 className="fw-semibold mb-0 fs-13">{mod.label}</h6>
                                            <p className="text-muted fs-11 mb-0 mt-1">{mod.desc}</p>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            {/* ── Quick overview ── */}
            <section className="section bg-light pt-0">
                <div className="container-fluid px-4">
                    <Row className="g-4">
                        {/* Upcoming events */}
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0"><i className="ri-calendar-todo-line text-primary me-2"></i>Agenda Mendatang</h6>
                                    {/* Inertia Link — SPA */}
                                    <Link href="/calendar" className="btn btn-soft-primary btn-sm">Lihat Semua</Link>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    {(demo?.calendar || []).map((e: any) => (
                                        <div key={e.id} className={`p-2 rounded-3 mb-2 ${e.className?.split(' ')[0] || 'bg-primary-subtle'}`}>
                                            <p className="fw-semibold mb-0 fs-13">{e.title}</p>
                                            <p className="text-muted fs-11 mb-0">
                                                {new Date(e.start).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Routines today */}
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0"><i className="ri-sun-line text-warning me-2"></i>Rutinitas Hari Ini</h6>
                                    <Link href="/tasks" className="btn btn-soft-warning btn-sm">Lihat Semua</Link>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    {[...demo.routines.morning.slice(0, 3), ...demo.routines.night.slice(0, 2)].map((r: any) => (
                                        <div key={r.id} className={`d-flex align-items-center gap-2 mb-2 p-2 rounded-3 ${r.done ? 'bg-success-subtle' : 'border'}`}>
                                            <i className={`${r.done ? 'ri-checkbox-circle-fill text-success' : 'ri-circle-line text-muted'} fs-16 flex-shrink-0`}></i>
                                            <div className="flex-grow-1">
                                                <p className={`mb-0 fs-13 ${r.done ? 'text-decoration-line-through text-muted' : 'fw-medium'}`}>{r.task}</p>
                                                <p className="mb-0 fs-11 text-muted">{r.time} · {r.assignee}</p>
                                            </div>
                                            <Badge bg="warning" className="fs-11">+{r.points}</Badge>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Recent blog */}
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0"><i className="ri-article-line text-success me-2"></i>Blog Terbaru</h6>
                                    <Link href="/blog" className="btn btn-soft-success btn-sm">Lihat Semua</Link>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    {demo.blogs.slice(0, 3).map((b: any) => (
                                        <div key={b.id} className="d-flex gap-3 mb-3">
                                            <img src={b.cover} alt={b.title} className="rounded-2 flex-shrink-0"
                                                style={{ width: 52, height: 44, objectFit: 'cover' }} />
                                            <div>
                                                <p className="fw-semibold fs-13 mb-0">{b.title}</p>
                                                <div className="d-flex gap-2 text-muted fs-11">
                                                    <Badge bg="light" text="dark" className="border fs-11">{b.cat}</Badge>
                                                    <span>{b.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>
        </MemberLayout>
    );
};

export default Hub;
