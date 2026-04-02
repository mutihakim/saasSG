import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

import creativeDemo from "../../../../../images/demos/creative.png";
import imgpattern from "../../../../../images/landing/img-pattern.png";


const Home = () => {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    return (
        <React.Fragment>
            <section className="section pb-0 hero-section" id="hero">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} sm={10}>
                            <div className="text-center mt-lg-5 pt-5 text-white">
                                <h1 className="display-6 fw-bold mb-3 lh-base">
                                    {tenant?.name}
                                </h1>
                                <p className="lead text-white-50 lh-base mb-4">
                                    Selamat datang di portal resmi <strong>{tenant?.display_name || tenant?.name}</strong>.
                                    Tempat di mana setiap impian direncanakan, setiap proyek dikelola, dan setiap anggota dihargai.
                                </p>

                                <div className="d-flex gap-2 justify-content-center mt-4">
                                    <Link href="/login" className="btn btn-success px-4 rounded-pill">Masuk ke Dashboard <i className="ri-lock-password-line align-middle ms-1"></i></Link>
                                    <Link href="#family-wall" className="btn btn-soft-light px-4 rounded-pill">Lihat Pencapaian <i className="ri-eye-line align-middle ms-1"></i></Link>
                                </div>
                            </div>

                            <div className='mt-4 mt-sm-5 pt-sm-5 mb-sm-n5 demo-carousel'>
                                <div className="demo-img-patten-top d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="..." />
                                </div>
                                <div className="demo-img-patten-bottom d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="..." />
                                </div>
                                <div className="carousel-inner shadow-lg p-2 bg-white rounded">
                                    <img src={creativeDemo} className="d-block w-100" alt="..." />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>

                <div className="position-absolute start-0 end-0 bottom-0 hero-shape-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
                        viewBox="0 0 1440 120">
                        <g fill="none">
                            <path d="M 0,118 C 288,98.6 1152,40.4 1440,21L1440 140L0 140z" fill="white">
                            </path>
                        </g>
                    </svg>
                </div>

            </section>
        </React.Fragment>
    );
};

export default Home;
