import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

interface Props {
    tenantName: string;
    type: string;
}

const PremiumHero: React.FC<Props> = ({ tenantName, type }) => {
    const motto = type === 'family'
        ? "Membangun Kenangan, Mengelola Kebahagiaan."
        : (type === 'education' ? "Pusat Kolaborasi Pendidikan & Pertumbuhan." : "Berbagi Kasih, Mewujudkan Harapan.");

    return (
        <section className="section pb-0 hero-section bg-light" id="hero" style={{ padding: '100px 0' }}>
            <div className="bg-overlay bg-overlay-pattern opacity-10"></div>
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8} sm={10}>
                        <div className="text-center mt-lg-5 pt-5 pb-5">
                            <h1 className="display-4 fw-bold mb-3 lh-base">
                                Selamat Datang di <br />
                                <span className="text-primary text-uppercase">{tenantName}</span>
                            </h1>
                            <p className="lead text-muted lh-base mb-4">
                                {motto} <br />
                                Satu-satunya ekosistem digital untuk mengelola segala urusan dan kebahagiaan kolektif kita dalam satu genggaman.
                            </p>

                            <div className="d-flex gap-3 justify-content-center mt-4">
                                <Link href="/login" className="btn btn-primary btn-lg shadow-sm px-4">
                                    Masuk Dashboard <i className="ri-arrow-right-line align-middle ms-1"></i>
                                </Link>
                                <button className="btn btn-soft-info btn-lg px-4">
                                    Pelajari Fitur
                                </button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default PremiumHero;
