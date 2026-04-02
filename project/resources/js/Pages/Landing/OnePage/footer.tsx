import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

// Logo images removed for text branding


const Footer = () => {
    return (
        <React.Fragment>
            <footer className="custom-footer bg-dark py-5 position-relative">
                <Container>
                    <Row>
                        <Col lg={4} className="mt-4">
                            <div>
                                <div>
                                    <h4 className="text-white fw-bold">saas<span className="text-primary">famz</span></h4>
                                </div>
                                <div className="mt-4 fs-13">
                                    <p>Pusat Ekosistem Keluarga Terpadu</p>
                                    <p className="ff-secondary">saasfamz membantu keluarga modern mengelola seluruh aspek kehidupan rumah tangga dalam satu platform cerdas dengan integrasi WhatsApp yang instan.</p>
                                </div>
                            </div>
                        </Col>

                        <Col lg={7} className="ms-lg-auto">
                            <Row>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Product</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            <li><Link href="/landing#features">Features</Link></li>
                                            <li><Link href="/landing#plans">Plans</Link></li>
                                            <li><Link href="/landing#reviews">Customer Stories</Link></li>
                                            <li><Link href="/landing#team">Team</Link></li>
                                        </ul>
                                    </div>
                                </Col>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Explore</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            <li><Link href="/register">Create Account</Link></li>
                                            <li><Link href="/login">Sign In</Link></li>
                                            <li><Link href="/health">Health Check</Link></li>
                                            <li><Link href="/sitemap.xml">Sitemap</Link></li>
                                        </ul>
                                    </div>
                                </Col>
                                <Col sm={4} className="mt-4">
                                    <h5 className="text-white mb-0">Dukungan</h5>
                                    <div className="text-muted mt-3">
                                        <ul className="list-unstyled ff-secondary footer-list">
                                            <li><Link href="/landing#faq">FAQ</Link></li>
                                            <li><Link href="/landing#contact">Kontak</Link></li>
                                            <li><a href="mailto:hello@saasfamz.com">hello@saasfamz.com</a></li>
                                        </ul>
                                    </div>
                                </Col>
                            </Row>
                        </Col>

                    </Row>

                    <Row className="text-center text-sm-start align-items-center mt-5">
                        <Col sm={6}>

                            <div>
                                <p className="copy-rights mb-0">
                                    {new Date().getFullYear()} (c) saasfamz
                                </p>
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="text-sm-end mt-3 mt-sm-0">
                                <ul className="list-inline mb-0 footer-social-link">
                                    <li className="list-inline-item">
                                        <a href="https://github.com" className="avatar-xs d-block" target="_blank" rel="noreferrer">
                                            <div className="avatar-title rounded-circle">
                                                <i className="ri-window-line"></i>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="list-inline-item">
                                        <a href="https://github.com" className="avatar-xs d-block" target="_blank" rel="noreferrer">
                                            <div className="avatar-title rounded-circle">
                                                <i className="ri-github-fill"></i>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="list-inline-item">
                                        <a href="https://www.linkedin.com" className="avatar-xs d-block" target="_blank" rel="noreferrer">
                                            <div className="avatar-title rounded-circle">
                                                <i className="ri-linkedin-fill"></i>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="list-inline-item">
                                        <a href="mailto:hello@saasfamz.com" className="avatar-xs d-block">
                                            <div className="avatar-title rounded-circle">
                                                <i className="ri-mail-send-line"></i>
                                            </div>
                                        </a>
                                    </li>
                                    <li className="list-inline-item">
                                        <Link href="/register" className="avatar-xs d-block">
                                            <div className="avatar-title rounded-circle">
                                                <i className="ri-rocket-line"></i>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </React.Fragment >
    );
};

export default Footer;

