import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Modal, ProgressBar } from 'react-bootstrap';

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: { user?: { name?: string } };
    demo: any;
}

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const PWA_INSTALL_DISMISSED_KEY = 'hub-pwa-install-fab-dismissed-v2';

const Hub: React.FC<Props> = ({ tenantName, member, demo: _demo }) => {
    const { props } = usePage<any>();
    const memberName = member?.user?.name ?? 'Anggota';
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const entitlements = props.entitlements?.modules ?? {};
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [installBannerClosed, setInstallBannerClosed] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [showInstallHelp, setShowInstallHelp] = useState(false);
    const [isIosSafari, setIsIosSafari] = useState(false);
    const modules = [
        { label: 'Finance', desc: 'Cashflow, budget, transfer', icon: 'ri-wallet-3-line', tone: '#27c3d9', href: '/finance', enabled: entitlements.finance !== false },
        { label: 'Calendar', desc: 'Agenda keluarga', icon: 'ri-calendar-event-line', tone: '#6f7cff', href: '/calendar', enabled: true },
        { label: 'Shopping', desc: 'Belanja & pantry', icon: 'ri-shopping-bag-3-line', tone: '#ff8a65', href: '/shopping', enabled: true },
        { label: 'Tasks', desc: 'Rutinitas harian', icon: 'ri-checkbox-circle-line', tone: '#5bc58f', href: '/tasks', enabled: true },
        { label: 'Rewards', desc: 'Poin & hadiah', icon: 'ri-gift-2-line', tone: '#ffbe55', href: '/rewards', enabled: true },
        { label: 'Files', desc: 'Dokumen penting', icon: 'ri-folder-3-line', tone: '#70a5ff', href: '/files', enabled: true },
        { label: 'WhatsApp', desc: 'Bot keluarga', icon: 'ri-whatsapp-line', tone: '#37c971', href: '/whatsapp', enabled: true },
        { label: 'More', desc: 'Modul tambahan', icon: 'ri-more-2-fill', tone: '#a6aec1', href: '/hub#more', enabled: true },
    ];

    const activityItems = [
        { title: 'Tagihan internet jatuh tempo 5 hari lagi', meta: 'Finance · Shared budget', tone: 'warning' },
        { title: 'Belanja dapur minggu ini belum lengkap', meta: 'Shopping · 7 item pending', tone: 'info' },
        { title: 'Rutinitas pagi anak sudah 80%', meta: 'Tasks · Hari ini', tone: 'success' },
    ];

    const teaserCards = [
        { title: 'Family Savings Sprint', body: 'Naik 12% dari bulan lalu. Pertahankan ritme minggu ini.', action: 'Buka Finance', href: '/finance' },
        { title: 'Weekend Plan', body: 'Ada 3 agenda dan 1 wishlist yang cocok untuk akhir pekan ini.', action: 'Lihat Kalender', href: '/calendar' },
    ];

    const progress = 75;
    const showInstallFab = useMemo(
        () => !installBannerClosed && !isInstalled,
        [installBannerClosed, isInstalled]
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const ua = window.navigator.userAgent.toLowerCase();
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || ((window.navigator as Navigator & { standalone?: boolean }).standalone === true);
        const isIos = /iphone|ipad|ipod/.test(ua);
        const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|chrome|android/.test(ua);

        setIsInstalled(isStandalone);
        setIsIosSafari(isIos && isSafari);
        setInstallBannerClosed(window.sessionStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1');

        const onBeforeInstallPrompt = (event: Event) => {
            const promptEvent = event as BeforeInstallPromptEvent;
            promptEvent.preventDefault();
            setInstallPromptEvent(promptEvent);
        };

        const onAppInstalled = () => {
            setIsInstalled(true);
            setInstallPromptEvent(null);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            setShowInstallHelp(true);
            return;
        }

        setIsInstalling(true);
        try {
            await installPromptEvent.prompt();
            const choice = await installPromptEvent.userChoice;
            if (choice.outcome === 'accepted') {
                setIsInstalled(true);
            } else {
                setShowInstallHelp(true);
            }
        } finally {
            setInstallPromptEvent(null);
            setIsInstalling(false);
        }
    };

    const handleCloseInstallBanner = () => {
        setInstallBannerClosed(true);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #25c2de 0%, #b7f4ff 20%, #f6f8fb 20%, #f6f8fb 100%)',
                padding: 'max(14px, env(safe-area-inset-top)) 0 calc(120px + env(safe-area-inset-bottom))',
                touchAction: 'pan-y',
            }}
        >
            <div className="container-fluid px-3">
                <div className="mx-auto" style={{ maxWidth: 460 }}>
                    <div
                        className="position-sticky top-0 z-3 mb-3"
                        style={{
                            background: 'rgba(248, 249, 250, 0.72)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                            borderRadius: 24,
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between text-white px-3 py-3">
                            <div>
                                <div className="small opacity-75">{greeting}</div>
                                <div className="fw-semibold fs-5">{tenantName}</div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center"
                                    style={{ width: 42, height: 42 }}
                                >
                                    <i className="ri-notification-3-line text-info fs-5"></i>
                                </button>
                                <Link
                                    href="/me"
                                    className="rounded-circle bg-white text-info d-inline-flex align-items-center justify-content-center fw-bold text-decoration-none shadow-sm"
                                    style={{ width: 42, height: 42 }}
                                >
                                    {memberName.charAt(0).toUpperCase()}
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                    <div className="small text-muted mb-1">Family Snapshot</div>
                                    <div className="fw-semibold text-dark">Siap untuk hari yang produktif</div>
                                    <div className="small text-muted mt-1">Hook singkat yang hangat, bukan dashboard panjang.</div>
                                </div>
                                <Link href="/finance" className="btn btn-light btn-sm rounded-pill">Explore</Link>
                            </div>
                            <div className="row g-2 mt-2">
                                <div className="col-6">
                                    <div className="rounded-4 p-3" style={{ background: '#eef8ff' }}>
                                        <div className="small text-muted">Saldo siap pakai</div>
                                        <div className="fw-semibold fs-5">Rp 8,4 jt</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="rounded-4 p-3" style={{ background: '#f6f8ea' }}>
                                        <div className="small text-muted">Agenda minggu ini</div>
                                        <div className="fw-semibold fs-5">4 kegiatan</div>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 rounded-4 shadow-sm mb-3">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start gap-3">
                                <div>
                                    <div className="fw-semibold">Lengkapi profil keluarga</div>
                                    <div className="small text-muted">Supaya rekomendasi dan shortcut makin relevan.</div>
                                </div>
                                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none">Tutup</button>
                            </div>
                            <div className="mt-3">
                                <div className="small fw-semibold mb-2">{progress}%</div>
                                <ProgressBar now={progress} style={{ height: 6 }} />
                            </div>
                        </Card.Body>
                    </Card>

                    <section className="mb-4">
                        <div className="fw-semibold text-dark mb-3">Modul keluarga</div>
                        <div className="row g-3">
                            {modules.map((mod) => {
                                const content = (
                                    <div className="rounded-4 bg-white shadow-sm h-100 p-3 border">
                                        <div
                                            className="rounded-4 d-inline-flex align-items-center justify-content-center mb-2 text-white"
                                            style={{ width: 52, height: 52, background: mod.tone }}
                                        >
                                            <i className={`${mod.icon} fs-4`}></i>
                                        </div>
                                        <div className="fw-semibold text-dark">{mod.label}</div>
                                        <div className="small text-muted mt-1">{mod.desc}</div>
                                        {!mod.enabled && (
                                            <Badge bg="warning" text="dark" className="mt-2">Locked</Badge>
                                        )}
                                    </div>
                                );

                                return (
                                    <div className="col-3" key={mod.label}>
                                        {mod.enabled ? (
                                            <Link href={mod.href} className="text-decoration-none d-block">{content}</Link>
                                        ) : (
                                            <Link href="/admin/upgrade-required?module=finance" className="text-decoration-none d-block opacity-75">{content}</Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="fw-semibold text-dark">Aktivitas penting</div>
                            <button type="button" className="btn btn-link btn-sm text-decoration-none p-0">Lihat semua</button>
                        </div>
                        <div className="d-flex flex-column gap-2">
                            {activityItems.map((item) => (
                                <Card key={item.title} className="border-0 shadow-sm rounded-4">
                                    <Card.Body className="py-3 px-3">
                                        <div className="d-flex align-items-start gap-3">
                                            <div className={`rounded-circle flex-shrink-0 bg-${item.tone}-subtle text-${item.tone} d-inline-flex align-items-center justify-content-center`} style={{ width: 36, height: 36 }}>
                                                <i className="ri-notification-3-line"></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-medium text-dark">{item.title}</div>
                                                <div className="small text-muted">{item.meta}</div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
                        <div className="fw-semibold text-dark mb-3">Hook minggu ini</div>
                        <div className="d-flex flex-column gap-3">
                            {teaserCards.map((card) => (
                                <Card key={card.title} className="border-0 shadow-sm rounded-4 overflow-hidden">
                                    <Card.Body className="p-3">
                                        <div className="fw-semibold text-dark">{card.title}</div>
                                        <div className="small text-muted mt-1 mb-3">{card.body}</div>
                                        <Link href={card.href} className="btn btn-outline-info rounded-pill btn-sm">{card.action}</Link>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <div
                        className="position-fixed start-50 translate-middle-x z-3"
                        style={{
                            bottom: 'max(12px, env(safe-area-inset-bottom))',
                            width: 'min(100% - 24px, 420px)',
                        }}
                    >
                        <div className="bg-white border rounded-pill shadow-sm px-2 py-2 d-flex justify-content-between align-items-center">
                            {[
                                { icon: 'ri-home-5-line', label: 'Home', active: true, href: '/hub' },
                                { icon: 'ri-pulse-line', label: 'Activity', active: false, href: '/hub#activity' },
                                { icon: 'ri-add-circle-fill', label: '', active: false, href: '/finance' },
                                { icon: 'ri-gift-line', label: 'Rewards', active: false, href: '/rewards' },
                                { icon: 'ri-user-3-line', label: 'Account', active: false, href: '/me' },
                            ].map((item) => (
                                <Link
                                    key={item.icon}
                                    href={item.href}
                                    className={`btn border-0 flex-fill px-1 ${item.active ? 'text-info' : 'text-muted'}`}
                                >
                                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 0 }}>
                                        <i className={`${item.icon} ${item.label ? 'fs-5' : 'fs-2'}`}></i>
                                        {item.label ? (
                                            <span
                                                className="small text-truncate"
                                                style={{ maxWidth: '100%', fontSize: 11 }}
                                            >
                                                {item.label}
                                            </span>
                                        ) : null}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {showInstallFab ? (
                        <div
                            className="position-fixed start-50 translate-middle-x z-3"
                            style={{ width: 'min(100% - 24px, 420px)', bottom: 'calc(env(safe-area-inset-bottom) + 94px)' }}
                        >
                            <div className="d-flex justify-content-end pe-1">
                                <div className="position-relative">
                                    <Button
                                        type="button"
                                        className="rounded-circle border-0 shadow-lg d-inline-flex align-items-center justify-content-center"
                                        style={{
                                            width: 62,
                                            height: 62,
                                            background: 'linear-gradient(135deg, #0dcaf0 0%, #25c2de 100%)',
                                            color: '#fff',
                                        }}
                                        onClick={handleInstallClick}
                                        disabled={isInstalling}
                                        title="Instal aplikasi"
                                    >
                                        <i className={`fs-3 ${isInstalling ? 'ri-loader-4-line' : 'ri-download-cloud-2-line'}`}></i>
                                    </Button>
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-circle border shadow-sm position-absolute top-0 start-0 translate-middle p-0"
                                        style={{ width: 26, height: 26, lineHeight: 1 }}
                                        onClick={handleCloseInstallBanner}
                                        aria-label="Close install button"
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <Modal show={showInstallHelp} onHide={() => setShowInstallHelp(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Instal aplikasi keluarga</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isIosSafari ? (
                        <div className="small text-muted">
                            Di Safari iPhone/iPad, instalasi memang tidak bisa dipaksa dari tombol.
                            Gunakan tombol Share Safari lalu pilih <strong>Add to Home Screen</strong>.
                        </div>
                    ) : (
                        <div className="small text-muted">
                            Jika prompt instal tidak muncul, buka menu browser lalu pilih <strong>Install app</strong> atau <strong>Add to Home screen</strong>.
                            Di beberapa HP Android, browser tidak selalu menampilkan prompt otomatis walaupun aplikasi sudah siap diinstal.
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowInstallHelp(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Hub;
