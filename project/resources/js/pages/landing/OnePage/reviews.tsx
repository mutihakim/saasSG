import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const Reviews = () => {
    return (
        <React.Fragment>
            <section className="section bg-primary" id="reviews">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={10}>
                            <div className="text-center">
                                <div>
                                    <i className="ri-double-quotes-l text-success display-3"></i>
                                </div>
                                <h4 className="text-white mb-5"><span className="text-success">2,500</span>+ Keluarga Bahagia</h4>

                                <Swiper modules={[Navigation, Pagination, Autoplay]} pagination={{ clickable: true }} navigation={true} loop={true} autoplay={{ delay: 2500, disableOnInteraction: false }} className="mySwiper swiper client-review-swiper rounded">
                                    <div className="swiper-wrapper">
                                        <SwiperSlide>
                                            <div className="row justify-content-center">
                                                <div className="col-10">
                                                    <div className="text-white-50">
                                                        <p className="fs-20 ff-secondary mb-4">" Akhirnya ada satu tempat untuk mengatur jadwal les anak, pengeluaran dapur, dan daftar belanjaan. Integrasi WhatsApp-nya sangat membantu saat saya sedang sibuk. "</p>
                                                        <div>
                                                            <h5 className="text-white">Ibu Sarah</h5>
                                                            <p>- Ibu Rumah Tangga & Arsitek</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="row justify-content-center">
                                                <div className="col-10">
                                                    <div className="text-white-50">
                                                        <p className="fs-20 ff-secondary mb-4">" Anak-anak jadi lebih semangat mengerjakan tugas rumah karena ada fitur gamifikasinya. Saasfamz benar-benar mengubah cara kami mengelola rumah tangga. "</p>
                                                        <div>
                                                            <h5 className="text-white">Bapak Budi</h5>
                                                            <p>- Ayah 2 Anak</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="row justify-content-center">
                                                <div className="col-10">
                                                    <div className="text-white-50">
                                                        <p className="fs-20 ff-secondary mb-4">" Sangat membantu untuk memantau kesehatan keluarga dan jadwal imunisasi. Semua data tersentralisasi dan aman dalam satu aplikasi. "</p>
                                                        <div>
                                                            <h5 className="text-white">dr. Amelia</h5>
                                                            <p>- Ibu & Praktisi Kesehatan</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    </div>
                                    <div className="swiper-button-next bg-white rounded-circle"></div>
                                    <div className="swiper-button-prev bg-white rounded-circle"></div>
                                    <div className="swiper-pagination position-relative mt-4"></div>
                                </Swiper>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Reviews;
