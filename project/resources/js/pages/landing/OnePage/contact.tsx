import React from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';

const Contact = () => {
    return (
        <React.Fragment>
            <section className="section" id="contact">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Hubungi Kami</h3>
                                <p className="text-muted mb-4 ff-secondary">Punya pertanyaan tentang bagaimana saasfamz bisa membantu keluarga Anda? Tim kami siap mendengarkan dan memberikan solusi terbaik.</p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="gy-4">
                        <Col lg={4}>
                            <div>
                                <div className="mt-4">
                                    <h5 className="fs-13 text-muted text-uppercase">Email Dukungan:</h5>
                                    <div className="fw-semibold">hello@saasfamz.com</div>
                                </div>
                                <div className="mt-4">
                                    <h5 className="fs-13 text-muted text-uppercase">Waktu Operasional:</h5>
                                    <div className="fw-semibold">Senin - Jumat | 09:00 - 18:00 WIB</div>
                                </div>
                            </div>
                        </Col>

                        <Col lg={8}>
                            <div>
                                <Form>
                                    <Row>
                                        <Col lg={6}>
                                            <div className="mb-4">
                                                <label htmlFor="name" className="form-label fs-13">Nama</label>
                                                <input name="name" id="name" type="text"
                                                    className="form-control bg-light border-light" placeholder="Nama Anda*" />
                                            </div>
                                        </Col>
                                        <Col lg={6}>
                                            <div className="mb-4">
                                                <label htmlFor="email" className="form-label fs-13">Email</label>
                                                <input name="email" id="email" type="email"
                                                    className="form-control bg-light border-light" placeholder="Alamat Email*" />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12}>
                                            <div className="mb-4">
                                                <label htmlFor="subject" className="form-label fs-13">Subjek</label>
                                                <input type="text" className="form-control bg-light border-light" id="subject"
                                                    name="subject" placeholder="Subjek Pesan.." />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12}>
                                            <div className="mb-3">
                                                <label htmlFor="comments" className="form-label fs-13">Pesan</label>
                                                <textarea name="comments" id="comments" rows={3}
                                                    className="form-control bg-light border-light"
                                                    placeholder="Bagaimana kami bisa membantu?"></textarea>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12} className="text-end">
                                            <input type="submit" id="submit" name="send" className="submitBnt btn btn-primary"
                                                value="Kirim Pesan" />
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Contact;