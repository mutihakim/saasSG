import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

import PremiumBlog from '@/features/frontend/components/PremiumBlog';
import PremiumCalendar from '@/features/frontend/components/PremiumCalendar';
import PremiumFileManager from '@/features/frontend/components/PremiumFileManager';
import PremiumFinance from '@/features/frontend/components/PremiumFinance';
import PremiumGallery from '@/features/frontend/components/PremiumGallery';
import PremiumGrowthTracker from '@/features/frontend/components/PremiumGrowthTracker';
import PremiumProjects from '@/features/frontend/components/PremiumProjects';
import PremiumRewards from '@/features/frontend/components/PremiumRewards';
import PremiumWAHub from '@/features/frontend/components/PremiumWAHub';
import PremiumWishlist from '@/features/frontend/components/PremiumWishlist';

interface Props {
    tenantName: string;
    member?: { user?: { name?: string } };
    demo: any;
}

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
    { id: 'calendar', label: 'Kalender', icon: 'ri-calendar-2-line' },
    { id: 'finance', label: 'Keuangan', icon: 'ri-wallet-3-line' },
    { id: 'projects', label: 'Proyek', icon: 'ri-kanban-view' },
    { id: 'rewards', label: 'Rewards', icon: 'ri-trophy-line' },
    { id: 'content', label: 'Konten', icon: 'ri-image-line' },
    { id: 'more', label: 'Lainnya', icon: 'ri-grid-line' },
];

const App: React.FC<Props> = ({ tenantName, member, demo }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [contentTab, setContentTab] = useState<'gallery' | 'blog' | 'wishlist'>('gallery');
    const [moreTab, setMoreTab] = useState<'growth' | 'files' | 'wa'>('growth');

    const memberName = member?.user?.name ?? 'Anggota';
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

    // Summary stats for dashboard
    const totalPoints = demo.leaderboard.reduce((s: number, l: any) => s + l.points, 0);
    const activeProjects = demo.projects.filter((p: any) => p.status === 'In Progress').length;
    const routinesDone = demo.routines.morning.filter((r: any) => r.done).length;
    const routinesTotal = demo.routines.morning.length + demo.routines.night.length;
    const upcomingEvents = demo.calendar.length;

    return (
        <>
            <Head title={`${tenantName} — Family Hub`} />
            <div style={{ minHeight: '100vh', background: '#f3f6f9', fontFamily: "'Inter', sans-serif" }}>
                {/* Top Bar */}
                <div style={{ background: 'linear-gradient(135deg, #405189 0%, #2e4fac 100%)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <Container fluid>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center"
                                    style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)' }}>
                                    <i className="ri-home-heart-line text-white fs-18"></i>
                                </div>
                                <div>
                                    <h6 className="text-white fw-bold mb-0">{tenantName}</h6>
                                    <p className="text-white-50 fs-11 mb-0">Family Hub · Member Dashboard</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-pill px-3 py-1">
                                    <i className="ri-star-fill text-warning fs-14"></i>
                                    <span className="text-white fw-semibold fs-13">{totalPoints.toLocaleString()} pts total</span>
                                </div>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                                    style={{ width: 36, height: 36 }}>
                                    <span className="text-primary fw-bold">{memberName.charAt(0)}</span>
                                </div>
                            </div>
                        </div>
                    </Container>
                </div>

                {/* Tab Navigation */}
                <div style={{ background: '#fff', borderBottom: '1px solid #e9ebec', position: 'sticky', top: 72, zIndex: 999 }}>
                    <Container fluid>
                        <div className="d-flex gap-1 overflow-auto" style={{ scrollbarWidth: 'none' }}>
                            {TABS.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`btn btn-sm rounded-0 px-3 py-3 border-0 border-bottom fw-medium fs-13 flex-shrink-0 ${activeTab === tab.id
                                        ? 'text-primary border-primary'
                                        : 'text-muted'}`}
                                    style={{ borderBottomWidth: activeTab === tab.id ? '2px' : '0', borderBottomStyle: 'solid' }}>
                                    <i className={`${tab.icon} me-2`}></i>{tab.label}
                                </button>
                            ))}
                        </div>
                    </Container>
                </div>

                <Container fluid className="py-4 px-3 px-md-4">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="mb-4">
                                <h4 className="fw-bold mb-1">{greeting}, {memberName}! 👋</h4>
                                <p className="text-muted">Berikut ringkasan aktivitas {tenantName} hari ini.</p>
                            </div>

                            {/* Quick stats */}
                            <Row className="g-3 mb-4">
                                {[
                                    { label: 'Total Poin Keluarga', val: totalPoints.toLocaleString(), icon: 'ri-star-fill', color: 'warning', sub: 'Akumulasi semua anggota' },
                                    { label: 'Proyek Aktif', val: activeProjects, icon: 'ri-kanban-view', color: 'primary', sub: `${demo.projects.length} total proyek` },
                                    { label: 'Rutinitas Hari Ini', val: `${routinesDone}/${routinesTotal}`, icon: 'ri-checkbox-circle-line', color: 'success', sub: 'Tugas selesai' },
                                    { label: 'Agenda Mendatang', val: upcomingEvents, icon: 'ri-calendar-2-line', color: 'info', sub: 'Event upcoming' },
                                ].map((s, i) => (
                                    <Col xs={12} sm={6} lg={3} key={i}>
                                        <Card className="border-0 shadow-sm h-100">
                                            <Card.Body className="p-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className={`rounded-3 d-flex align-items-center justify-content-center bg-${s.color}-subtle`}
                                                        style={{ width: 48, height: 48 }}>
                                                        <i className={`${s.icon} text-${s.color} fs-20`}></i>
                                                    </div>
                                                    <div className="text-end">
                                                        <h4 className={`mb-0 fw-bold text-${s.color}`}>{s.val}</h4>
                                                        <p className="text-muted fs-12 mb-0">{s.label}</p>
                                                    </div>
                                                </div>
                                                <p className="text-muted fs-11 mt-2 mb-0">{s.sub}</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Row className="g-3">
                                {/* Team */}
                                <Col lg={4}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                                            <h6 className="fw-semibold mb-0"><i className="ri-team-line me-2 text-primary"></i>Anggota Keluarga</h6>
                                        </Card.Header>
                                        <Card.Body className="pt-2">
                                            {demo.team.map((m: any, i: number) => (
                                                <div key={i} className="d-flex align-items-center gap-3 p-2 rounded-3 mb-1"
                                                    style={{ background: i === 0 ? '#f8f9fa' : 'transparent' }}>
                                                    <div className="position-relative">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #405189, #0ab39c)' }}>
                                                            <span className="text-white fw-bold">{m.avatar}</span>
                                                        </div>
                                                        <span className={`position-absolute bottom-0 end-0 rounded-circle border border-white ${m.status === 'online' ? 'bg-success' : 'bg-secondary'}`}
                                                            style={{ width: 10, height: 10 }}></span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <p className="mb-0 fw-semibold fs-13">{m.name}</p>
                                                        <p className="mb-0 text-muted fs-11">{m.designation}</p>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="d-flex align-items-center gap-1">
                                                            <i className="ri-star-fill text-warning fs-12"></i>
                                                            <span className="fw-bold fs-13">{m.points.toLocaleString()}</span>
                                                        </div>
                                                        <Badge bg={m.role === 'Owner' ? 'primary' : m.role === 'Admin' ? 'success' : 'secondary'} className="fs-11">{m.role}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Recent blog */}
                                <Col lg={4}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                                            <h6 className="fw-semibold mb-0"><i className="ri-article-line me-2 text-success"></i>Blog Terbaru</h6>
                                        </Card.Header>
                                        <Card.Body className="pt-2">
                                            {demo.blogs.slice(0, 3).map((b: any, i: number) => (
                                                <div key={i} className="d-flex gap-3 mb-3">
                                                    <img src={b.cover} alt={b.title} className="rounded-2 flex-shrink-0"
                                                        style={{ width: 56, height: 48, objectFit: 'cover' }} />
                                                    <div className="flex-grow-1">
                                                        <p className="fw-semibold fs-13 mb-1 text-truncate">{b.title}</p>
                                                        <div className="d-flex gap-2 text-muted fs-11">
                                                            <span><Badge bg="light" text="dark" className="border">{b.cat}</Badge></span>
                                                            <span>{b.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Upcoming events */}
                                <Col lg={4}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0 pt-3 pb-0">
                                            <h6 className="fw-semibold mb-0"><i className="ri-calendar-todo-line me-2 text-warning"></i>Agenda & Rutinitas</h6>
                                        </Card.Header>
                                        <Card.Body className="pt-2">
                                            {demo.calendar.slice(0, 3).map((e: any, i: number) => (
                                                <div key={i} className={`p-2 rounded-3 mb-2 ${e.className?.split(' ')[0] || 'bg-primary-subtle'}`}>
                                                    <p className="fw-semibold mb-0 fs-13">{e.title}</p>
                                                    <p className="text-muted fs-11 mb-0">{new Date(e.start).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            ))}
                                            <div className="mt-2">
                                                <p className="fw-semibold fs-12 text-muted mb-1">Rutinitas pagi hari ini:</p>
                                                {demo.routines.morning.slice(0, 3).map((r: any, i: number) => (
                                                    <div key={i} className="d-flex align-items-center gap-2 mb-1">
                                                        <i className={`${r.done ? 'ri-checkbox-circle-fill text-success' : 'ri-time-line text-muted'} fs-14`}></i>
                                                        <span className={`fs-12 ${r.done ? 'text-decoration-line-through text-muted' : 'fw-medium'}`}>{r.task}</span>
                                                        <span className="text-muted fs-11 ms-auto">+{r.points}pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}

                    {activeTab === 'calendar' && (
                        <PremiumCalendar calendar={demo.calendar} routines={demo.routines} menus={demo.menus} />
                    )}

                    {activeTab === 'finance' && (
                        <PremiumFinance finance={demo.finance} />
                    )}

                    {activeTab === 'projects' && (
                        <PremiumProjects projects={demo.projects} kanban={demo.kanban} shopping_list={demo.shopping_list} />
                    )}

                    {activeTab === 'rewards' && (
                        <PremiumRewards rewards={demo.rewards} leaderboard={demo.leaderboard} />
                    )}

                    {activeTab === 'content' && (
                        <>
                            <div className="d-flex gap-2 mb-4">
                                {(['gallery', 'blog', 'wishlist'] as const).map(ct => (
                                    <button key={ct} onClick={() => setContentTab(ct)}
                                        className={`btn ${contentTab === ct ? 'btn-primary' : 'btn-soft-secondary'}`}>
                                        {ct === 'gallery' ? '📸 Galeri' : ct === 'blog' ? '📝 Blog' : '❤️ Wishlist'}
                                    </button>
                                ))}
                            </div>
                            {contentTab === 'gallery' && <PremiumGallery gallery={demo.gallery} />}
                            {contentTab === 'blog' && <PremiumBlog blogs={demo.blogs} />}
                            {contentTab === 'wishlist' && <PremiumWishlist wishlists={demo.wishlists} />}
                        </>
                    )}

                    {activeTab === 'more' && (
                        <>
                            <div className="d-flex gap-2 mb-4">
                                {(['growth', 'files', 'wa'] as const).map(mt => (
                                    <button key={mt} onClick={() => setMoreTab(mt)}
                                        className={`btn ${moreTab === mt ? 'btn-primary' : 'btn-soft-secondary'}`}>
                                        {mt === 'growth' ? '📏 Tumbuh Kembang' : mt === 'files' ? '📁 File Manager' : '💬 WhatsApp'}
                                    </button>
                                ))}
                            </div>
                            {moreTab === 'growth' && <PremiumGrowthTracker growth_tracker={demo.growth_tracker} />}
                            {moreTab === 'files' && <PremiumFileManager files={demo.files} />}
                            {moreTab === 'wa' && <PremiumWAHub wa_logs={demo.wa_logs} wa_commands={demo.wa_commands} />}
                        </>
                    )}
                </Container>
            </div>
        </>
    );
};

export default App;
