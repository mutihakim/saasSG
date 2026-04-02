import { Link } from '@inertiajs/react';
import React from 'react';
import { Row, Col } from 'react-bootstrap';

import logolight from '../../../../../images/logo-light.png';

interface Props {
    tenantName: string;
    tenantSlug: string;
}

const FamilyFooter: React.FC<Props> = ({ tenantName }) => {
    // All links are relative — Inertia Link handles SPA navigation (no refresh)
    const featureLinks = [
        { label: 'Kalender Bersama', href: '/calendar' },
        { label: 'Keuangan Keluarga', href: '/finance' },
        { label: 'Tugas & Rutinitas', href: '/tasks' },
        { label: 'Reward Store', href: '/rewards' },
        { label: 'Growth Tracker', href: '/health' },
    ];
    const contentLinks = [
        { label: 'Galeri Foto', href: '/gallery' },
        { label: 'Blog & Dokumentasi', href: '/blog' },
        { label: 'Wishlist Keluarga', href: '/leisure' },
        { label: 'Vacation Planner', href: '/vacation' },
        { label: 'Game Center', href: '/games' },
    ];
    const platformLinks = [
        { label: 'WhatsApp Hub', href: '/whatsapp' },
        { label: 'File Manager', href: '/files' },
        { label: 'Masuk', href: '/login' },
        { label: 'Daftar', href: '/register' },
    ];

    return (
        <React.Fragment>
            <footer className="custom-footer bg-dark py-5 position-relative d-none d-lg-block">
                <div className="container-fluid px-4">
                    <Row>
                        <Col lg={4} className="mt-4">
                            <div>
                                <img src={logolight} alt="logo light" height="17" />
                                <div className="mt-4 fs-13">
                                    <p className="text-muted">{tenantName} — All-in-One Family Hub</p>
                                    <p className="text-muted ff-secondary">
                                        Platform manajemen keluarga terpadu: kalender, keuangan, proyek, reward,
                                        kesehatan, dan dokumentasi dalam satu ekosistem.
                                    </p>
                                </div>
                                <ul className="list-inline mb-0 footer-social-link">
                                    {['ri-whatsapp-line', 'ri-instagram-line', 'ri-youtube-line'].map((icon, i) => (
                                        <li key={i} className="list-inline-item">
                                            <a href="#" className="avatar-xs d-block">
                                                <div className="avatar-title rounded-circle">
                                                    <i className={icon}></i>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Col>

                        <Col lg={7} className="ms-lg-auto">
                            <Row>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Fitur Utama</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            {featureLinks.map((l, i) => (
                                                <li key={i}><Link href={l.href}>{l.label}</Link></li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Konten</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            {contentLinks.map((l, i) => (
                                                <li key={i}><Link href={l.href}>{l.label}</Link></li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Platform</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            {platformLinks.map((l, i) => (
                                                <li key={i}><Link href={l.href}>{l.label}</Link></li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row className="text-center text-sm-start align-items-center mt-5">
                        <Col sm={6}>
                            <p className="copy-rights mb-0">
                                {new Date().getFullYear()} © {tenantName} — Powered by appsah.my.id
                            </p>
                        </Col>
                        <Col sm={6}>
                            <div className="text-sm-end mt-3 mt-sm-0">
                                <ul className="list-inline mb-0 footer-social-link">
                                    {['ri-facebook-fill', 'ri-instagram-line', 'ri-youtube-line', 'ri-whatsapp-line'].map((icon, i) => (
                                        <li key={i} className="list-inline-item">
                                            <a href="#" className="avatar-xs d-block">
                                                <div className="avatar-title rounded-circle">
                                                    <i className={icon}></i>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </div>
            </footer>
        </React.Fragment>
    );
};

export default FamilyFooter;
