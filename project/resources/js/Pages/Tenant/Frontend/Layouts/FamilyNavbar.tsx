import { Link, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Collapse, NavbarToggle, NavLink } from 'react-bootstrap';

import logodark from '../../../../../images/logo-dark.png';
import logolight from '../../../../../images/logo-light.png';

interface Props {
    tenantName: string;
    tenantSlug: string;
    mode: 'public' | 'member';
    memberName?: string;
}

/**
 * Family Hub Navbar — Optimized for Mobile & SPA
 * 
 * Follows Velzon's standard navbar-collapse-wrapper structure to prevent
 * UI bugs on mobile devices.
 */
const FamilyNavbar: React.FC<Props> = ({ tenantName, mode, memberName }) => {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    const [navClass, setNavClass] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const toggle = () => setIsOpenMenu(!isOpenMenu);

    useEffect(() => {
        const scrollNavigation = () => {
            setNavClass(document.documentElement.scrollTop > 50 ? 'is-sticky' : '');
        };
        window.addEventListener('scroll', scrollNavigation, true);
        return () => window.removeEventListener('scroll', scrollNavigation, true);
    }, []);

    // Member menus - grouped for better organization
    const memberMenus = [
        {
            id: 'planning',
            label: 'Jadwal',
            icon: 'ri-calendar-2-line',
            children: [
                { label: 'Kalender Bersama', href: '/calendar', icon: 'ri-calendar-2-line', desc: 'Jadwal & agenda keluarga' },
                { label: 'Papan Proyek', href: '/projects', icon: 'ri-kanban-view', desc: 'Proyek & milestone' },
                { label: 'Tugas & Rutinitas', href: '/tasks', icon: 'ri-checkbox-multiple-line', desc: 'To-do & rutinitas harian' },
            ],
        },
        {
            id: 'reward',
            label: 'Reward',
            icon: 'ri-trophy-line',
            children: [
                { label: 'Reward Store', href: '/rewards', icon: 'ri-gift-2-line', desc: 'Toko hadiah & leaderboard' },
                { label: 'Keuangan Keluarga', href: '/finance/home', icon: 'ri-wallet-3-line', desc: 'Account, pocket, transaksi, dan planning' },
            ],
        },
        {
            id: 'rumah',
            label: 'Rumah',
            icon: 'ri-home-heart-line',
            children: [
                { label: 'Meal Planner', href: '/kitchen', icon: 'ri-restaurant-2-line', desc: 'Menu & daftar belanja' },
                { label: 'Growth Tracker', href: '/health', icon: 'ri-seedling-line', desc: 'Kesehatan & tumbuh kembang' },
                { label: 'Aset & Inventaris', href: '/assets', icon: 'ri-home-gear-line', desc: 'Info vault & inventaris' },
            ],
        },
        {
            id: 'hiburan',
            label: 'Hiburan',
            icon: 'ri-earth-line',
            children: [
                { label: 'Wishlist & Liburan', href: '/leisure', icon: 'ri-heart-3-line', desc: 'Destinasi & kuliner impian' },
                { label: 'Game Center', href: '/games', icon: 'ri-gamepad-line', desc: 'Mini-games keluarga' },
                { label: 'WhatsApp Hub', href: '/whatsapp', icon: 'ri-whatsapp-line', desc: 'Perintah & integrasi WA' },
            ],
        },
        {
            id: 'konten',
            label: 'Konten',
            icon: 'ri-image-2-line',
            children: [
                { label: 'Galeri Foto', href: '/gallery', icon: 'ri-image-line', desc: 'Album kenangan keluarga' },
                { label: 'Blog & Dokumentasi', href: '/blog', icon: 'ri-article-line', desc: 'Wisata, kuliner & parenting' },
                { label: 'File Manager', href: '/files', icon: 'ri-folder-3-line', desc: 'Dokumen penting keluarga' },
            ],
        },
    ];

    const handleDropdown = (id: string | null) => setOpenDropdown(id);

    return (
        <React.Fragment>
            <nav className={`navbar navbar-expand-lg navbar-landing fixed-top ${navClass}`.trim()} id="navbar">
                <div className="container-fluid px-4">
                    <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
                        <img src={logodark} className="card-logo card-logo-dark" alt="logo" height="17" />
                        <img src={logolight} className="card-logo card-logo-light" alt="logo" height="17" />
                        <span className="fw-bold fs-14 ms-1 d-none d-md-inline">{tenantName}</span>
                    </Link>

                    <NavbarToggle
                        className="navbar-toggler py-0 fs-20 text-body"
                        onClick={toggle}
                        type="button"
                        aria-controls="navbarSupportedContent"
                        aria-expanded={isOpenMenu}
                    >
                        <i className="ri-menu-line"></i>
                    </NavbarToggle>

                    <Collapse in={isOpenMenu} className="navbar-collapse">
                        <div className="navbar-collapse-wrapper d-lg-flex w-100 align-items-center">
                            {mode === 'public' ? (
                                <ul className="navbar-nav mx-auto mt-2 mt-lg-0" id="navbar-example">
                                    {[
                                        { href: '#hero', label: 'Beranda' },
                                        { href: '#fitur', label: 'Fitur' },
                                        { href: '#keuangan', label: 'Keuangan' },
                                        { href: '#galeri', label: 'Galeri' },
                                        { href: '#wa', label: 'WhatsApp' },
                                    ].map(item => (
                                        <li key={item.href} className="nav-item">
                                            <NavLink href={item.href} className="fs-14 fw-semibold text-uppercase">
                                                {item.label}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ul className="navbar-nav mx-auto mt-2 mt-lg-0" id="navbar-member">
                                    <li className="nav-item">
                                        <Link href="/" className="nav-link fs-14 fw-semibold text-uppercase">
                                            <i className="ri-dashboard-line me-1 align-middle"></i> Dashboard
                                        </Link>
                                    </li>
                                    {memberMenus.map(menu => (
                                        <li
                                            key={menu.id}
                                            className={`nav-item dropdown dropdown-hover-end ${openDropdown === menu.id ? 'show' : ''}`}
                                            onMouseEnter={() => handleDropdown(menu.id)}
                                            onMouseLeave={() => handleDropdown(null)}
                                        >
                                            <a
                                                href="#"
                                                className="nav-link fs-14 fw-semibold text-uppercase dropdown-toggle"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    setOpenDropdown(openDropdown === menu.id ? null : menu.id);
                                                }}
                                            >
                                                <i className={`${menu.icon} me-1 align-middle`}></i>
                                                {menu.label}
                                            </a>
                                            <div className={`dropdown-menu p-3 border-0 shadow ${openDropdown === menu.id ? 'show' : ''}`} style={{ minWidth: 280 }}>
                                                {menu.children.map((child, ci) => (
                                                    <Link
                                                        key={ci}
                                                        href={child.href}
                                                        className="dropdown-item rounded-2 py-2 px-3 d-flex align-items-center gap-3 mb-1"
                                                        onClick={() => {
                                                            setOpenDropdown(null);
                                                            setIsOpenMenu(false);
                                                        }}
                                                    >
                                                        <div className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle" style={{ width: 32, height: 32 }}>
                                                            <i className={`${child.icon} text-primary fs-14`}></i>
                                                        </div>
                                                        <div>
                                                            <p className="mb-0 fw-semibold fs-13">{child.label}</p>
                                                            <p className="mb-0 text-muted fs-11">{child.desc}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-3 mt-lg-0 d-flex align-items-center gap-2 flex-shrink-0">
                                {mode === 'member' && memberName ? (
                                    <div 
                                        className={`dropdown dropdown-hover-end ${openDropdown === '__user' ? 'show' : ''}`}
                                        onMouseEnter={() => handleDropdown('__user')}
                                        onMouseLeave={() => handleDropdown(null)}
                                    >
                                        <button 
                                            className="btn btn-link p-0 border-0 d-flex align-items-center gap-2 text-decoration-none dropdown-toggle" 
                                            type="button"
                                            onClick={() => setOpenDropdown(openDropdown === '__user' ? null : '__user')}
                                        >
                                            <div className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                                <span className="text-primary fw-bold" style={{ fontSize: 13 }}>
                                                    {memberName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-body fw-bold fs-14 d-lg-none">{memberName}</span>
                                        </button>
                                        <ul className={`dropdown-menu dropdown-menu-end border-0 shadow p-2 ${openDropdown === '__user' ? 'show' : ''}`} style={{ minWidth: 200 }}>
                                            <li><div className="dropdown-header text-muted text-uppercase fw-bold pb-1 fs-11">Menu Saya</div></li>
                                            <li><Link className="dropdown-item py-2" href="/me"><i className="ri-user-line me-2 align-middle text-primary"></i>Profil Saya</Link></li>
                                            <li><Link className="dropdown-item py-2" href="/me/settings"><i className="ri-settings-4-line me-2 align-middle text-info"></i>Pengaturan</Link></li>
                                            <li><Link className="dropdown-item py-2" href="/admin/dashboard"><i className="ri-dashboard-line me-2 align-middle text-success"></i>Admin Tenant</Link></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item py-2 text-danger" onClick={() => router.post('/logout')}><i className="ri-logout-box-line me-2 align-middle"></i>Keluar</button></li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center gap-2">
                                        <Link href="/login" className="btn btn-link fw-bold text-decoration-none text-body fs-14 px-2">Masuk</Link>
                                        <Link href="/register" className="btn btn-primary btn-sm px-3 shadow-none">Daftar</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Collapse>
                </div>
            </nav>
        </React.Fragment>
    );
};

export default FamilyNavbar;
