import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import CountUp from "react-countup";

const Counter = () => {
    return (
        <React.Fragment>
            <section className="py-5 position-relative bg-light">
                <Container>
                    <Row className="text-center gy-4">
                        <Col lg={3} className="col-6">
                            <div>
                                <h2 className="mb-2"><span className="counter-value" data-target="100">
                                    <CountUp
                                        start={0}
                                        end={100}
                                        duration={3}
                                    />
                                </span>
                                    +
                                </h2>
                                <div className="text-muted">Keluarga Terbantu</div>
                            </div>
                        </Col>

                        <Col lg={3} className="col-6">
                            <div>
                                <h2 className="mb-2"><span className="counter-value" data-target="24">
                                    <CountUp
                                        start={0}
                                        end={24}
                                        duration={3}
                                    />
                                </span>
                                </h2>
                                <div className="text-muted">Modul Pintar</div>
                            </div>
                        </Col>

                        <Col lg={3} className="col-6">
                            <div>
                                <h2 className="mb-2"><span className="counter-value" data-target="20.3">
                                    <CountUp
                                        start={0}
                                        end={20.3}
                                        duration={3}
                                    // decimal={1}
                                    />
                                </span>
                                    k
                                </h2>
                                <div className="text-muted">Pengguna Aktif</div>
                            </div>
                        </Col>

                        <Col lg={3} className="col-6">
                            <div>
                                <h2 className="mb-2"><span className="counter-value" data-target="50">
                                    <CountUp
                                        start={0}
                                        end={50}
                                        duration={3}
                                    />
                                </span>
                                </h2>
                                <div className="text-muted">Kota Terjangkau</div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Counter;