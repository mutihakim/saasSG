import React, { useState } from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';

interface GalleryItem {
    id: number;
    title: string;
    img_url: string;
    author: string;
    date: string;
    likes: number;
    cat: string;
}

interface Props { gallery: GalleryItem[] }

const CATS = ['Semua', 'Wisata', 'Kuliner', 'Keluarga', 'Rumah', 'Tumbuh Kembang', 'Pendidikan'];

const PremiumGallery: React.FC<Props> = ({ gallery }) => {
    const [activeCategory, setActiveCategory] = useState('Semua');

    const filtered = activeCategory === 'Semua' ? gallery : gallery.filter(g => g.cat === activeCategory);

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-image-line me-2 text-info"></i>
                            Galeri Foto Keluarga
                        </h5>
                        <p className="text-muted fs-13 mb-0">Abadikan momen berharga bersama</p>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                        {CATS.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`btn btn-sm ${activeCategory === cat ? 'btn-info' : 'btn-soft-secondary'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {filtered.map((item, i) => (
                        <Col xs={12} sm={6} lg={4} key={item.id}>
                            <div className="rounded-3 overflow-hidden border position-relative gallery-item"
                                style={{ cursor: 'pointer' }}>
                                <div className="position-relative overflow-hidden" style={{ height: i % 3 === 0 ? 220 : 180 }}>
                                    <img
                                        src={item.img_url}
                                        alt={item.title}
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                    <div className="position-absolute top-0 start-0 p-2">
                                        <Badge bg="dark" className="opacity-75 fs-11">{item.cat}</Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h6 className="mb-1 fw-semibold fs-13 text-truncate">{item.title}</h6>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-1">
                                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                style={{ width: 20, height: 20 }}>
                                                <span className="text-white" style={{ fontSize: 9, fontWeight: 700 }}>{item.author.charAt(0)}</span>
                                            </div>
                                            <span className="text-muted fs-11">{item.author} · {item.date}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-1 text-muted">
                                            <i className="ri-heart-fill text-danger fs-13"></i>
                                            <span className="fs-11">{item.likes}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
                {filtered.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <i className="ri-image-2-line fs-48 d-block mb-2 opacity-25"></i>
                        <p>Belum ada foto di kategori ini</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumGallery;
