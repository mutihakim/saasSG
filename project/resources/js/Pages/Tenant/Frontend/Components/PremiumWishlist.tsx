import React, { useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

interface Wishlist {
    id: number;
    type: string;
    title: string;
    notes: string;
    priority: string;
    saved: number;
    target: number;
    img: string;
    tags: string[];
}

interface Props { wishlists: Wishlist[] }

const TYPE_TABS = ['Semua', 'travel', 'kuliner', 'barang'];
const TYPE_LABELS: Record<string, string> = { travel: '✈️ Wisata', kuliner: '🍜 Kuliner', barang: '🛍️ Barang' };
const PRIORITY_COLORS: Record<string, string> = { High: 'danger', Medium: 'warning', Low: 'secondary' };

const fmt = (n: number) =>
    n === 0 ? '' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const PremiumWishlist: React.FC<Props> = ({ wishlists }) => {
    const [activeType, setActiveType] = useState('Semua');

    const filtered = activeType === 'Semua' ? wishlists : wishlists.filter(w => w.type === activeType);

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-heart-3-line me-2 text-danger"></i>
                            Wishlist Keluarga
                        </h5>
                        <p className="text-muted fs-13 mb-0">Impian wisata, kuliner, dan barang incaran</p>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                        {TYPE_TABS.map(t => (
                            <button key={t} onClick={() => setActiveType(t)}
                                className={`btn btn-sm ${activeType === t ? 'btn-danger' : 'btn-soft-secondary'}`}>
                                {t === 'Semua' ? 'Semua' : TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {filtered.map(item => {
                        const pct = item.target > 0 ? Math.round((item.saved / item.target) * 100) : 0;
                        return (
                            <Col md={6} key={item.id}>
                                <div className="border rounded-4 overflow-hidden h-100" style={{ cursor: 'pointer' }}>
                                    <div className="position-relative overflow-hidden" style={{ height: 150 }}>
                                        <img src={item.img} alt={item.title} className="w-100 h-100"
                                            style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                        <div className="position-absolute top-0 end-0 p-2 d-flex flex-column align-items-end gap-1">
                                            <Badge bg={PRIORITY_COLORS[item.priority] || 'secondary'} className="fs-11">
                                                {item.priority}
                                            </Badge>
                                            <Badge bg="dark" className="opacity-75 fs-11">{TYPE_LABELS[item.type] || item.type}</Badge>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h6 className="fw-bold mb-1">{item.title}</h6>
                                        <p className="text-muted fs-12 mb-2">{item.notes}</p>
                                        <div className="d-flex flex-wrap gap-1 mb-3">
                                            {item.tags.map((tag, ti) => (
                                                <Badge key={ti} bg="light" text="dark" className="border fs-11">{tag}</Badge>
                                            ))}
                                        </div>
                                        {item.target > 0 && (
                                            <>
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="fs-12 text-muted">Tabungan: {fmt(item.saved)}</span>
                                                    <span className="fs-12 fw-medium text-success">{pct}%</span>
                                                </div>
                                                <ProgressBar now={pct} variant="success" style={{ height: 6 }} className="rounded-pill mb-1" />
                                                <span className="text-muted fs-11">Target: {fmt(item.target)}</span>
                                            </>
                                        )}
                                        {item.target === 0 && (
                                            <div className="d-flex align-items-center gap-2 text-muted">
                                                <i className="ri-heart-add-line text-danger fs-14"></i>
                                                <span className="fs-12">Tambahkan ke daftar bucket list!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            </Card.Body>
        </Card>
    );
};

export default PremiumWishlist;
