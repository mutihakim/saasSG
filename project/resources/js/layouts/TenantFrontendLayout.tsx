import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { Container, Nav, Navbar, NavDropdown, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// removed unused import
import { SharedPageProps } from '../types/page';

type Props = {
    children: React.ReactNode;
};

export default function TenantFrontendLayout({ children }: Props) {
    const { props } = usePage<SharedPageProps>();
    const { t } = useTranslation();
    const tenant = props.currentTenant;
    const user = props.auth?.user;

    return (
        <div className="layout-wrapper landing tenant-frontend-wrapper">
            <nav className="navbar navbar-expand-lg navbar-landing fixed-top is-sticky sticky-top px-0" id="navbar" style={{ background: 'white', borderBottom: '1px solid #f3f3f9' }}>
                <Container>
                    <Link className="navbar-brand" href="/">
                        <span className="fw-bold fs-20 text-primary">{tenant?.presentable_name || tenant?.name || 'appsah'}</span>
                    </Link>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="py-0 fs-20 text-body" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto mt-2 mt-lg-0">
                            <Nav.Link as={Link} href="/" className="fs-15 fw-semibold text-body">{t('layout.frontend.nav.home') || 'Home'}</Nav.Link>
                            {/* Add more frontend-specific links here */}
                        </Nav>
                        <Nav className="mt-3 mt-lg-0">
                            {user ? (
                                <NavDropdown title={<span className="fw-semibold text-primary">{user.name}</span>} id="basic-nav-dropdown">
                                    <NavDropdown.Item as={Link} href="/profile">{t('layout.shell.nav.items.profile')}</NavDropdown.Item>
                                    {user.is_superadmin || props.currentTenantMember?.role_code === 'admin' ? (
                                        <NavDropdown.Item as={Link} href="/admin/dashboard">{t('layout.shell.nav.items.admin_panel') || 'Admin Panel'}</NavDropdown.Item>
                                    ) : null}
                                    <NavDropdown.Divider />
                                    <form onSubmit={(e) => { e.preventDefault(); import('@inertiajs/react').then(m => m.router.post('/logout')); }}>
                                        <button type="submit" className="dropdown-item text-danger w-100 text-start border-0 bg-transparent">
                                            {t('layout.shell.nav.items.logout')}
                                        </button>
                                    </form>
                                </NavDropdown>
                            ) : (
                                <Link href="/login" className="btn btn-primary px-4 rounded-pill">Login</Link>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </nav>

            <main className="py-5" style={{ minHeight: '80vh', backgroundColor: '#f3f3f9' }}>
                <Container>
                    {children}
                </Container>
            </main>

            <footer className="custom-footer bg-dark py-5 position-relative">
                <Container>
                    <Row className="text-center text-sm-start align-items-center">
                        <Col sm={6}>
                            <div>
                                <p className="copy-rights mb-0 text-muted">
                                    {new Date().getFullYear()} (c) {tenant?.presentable_name || 'appsah'}
                                </p>
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="text-sm-end mt-3 mt-sm-0">
                                <span className="text-muted small">Powered by appsah. Shared Family Space.</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
}
