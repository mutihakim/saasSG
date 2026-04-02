import { Link } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';


const Cta = () => {
    return (
        <React.Fragment>
            <section className="py-5 bg-primary position-relative">
                <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col className="col-sm">
                            <div>
                                <h4 className="text-white mb-0 fw-semibold">Mulailah Membangun Keharmonisan Keluarga Bersama saasfamz</h4>
                            </div>
                        </Col>
                        <Col className="col-sm-auto">
                            <div>
                                <Link href="/register" className="btn bg-gradient btn-danger"><i className="ri-rocket-line align-middle me-1"></i> Mulai Sekarang</Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};
export default Cta;
