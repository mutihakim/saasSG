import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    cover: string;
    author: string;
    date: string;
    cat: string;
    read_time: string;
    likes: number;
}

interface Props { blogs: BlogPost[] }

const catColors: Record<string, string> = {
    Wisata: 'primary', Kuliner: 'warning', Parenting: 'success', Rumah: 'info'
};

const CAT_TABS = ['Semua', 'Wisata', 'Kuliner', 'Parenting', 'Rumah'];

const PremiumBlog: React.FC<Props> = ({ blogs }) => {
    const [activeTab, setActiveTab] = useState('Semua');

    const filtered = activeTab === 'Semua' ? blogs : blogs.filter(b => b.cat === activeTab);
    const featured = blogs[0];
    const rest = filtered.slice(1);

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-article-line me-2 text-success"></i>
                            Blog & Dokumentasi Keluarga
                        </h5>
                        <p className="text-muted fs-13 mb-0">Wisata, kuliner, resep, dan perkembangan anak</p>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                        {CAT_TABS.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`btn btn-sm ${activeTab === tab ? 'btn-success' : 'btn-soft-secondary'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {/* Featured post */}
                {activeTab === 'Semua' && featured && (
                    <div className="rounded-4 overflow-hidden border mb-4 position-relative"
                        style={{ cursor: 'pointer' }}>
                        <img src={featured.cover} alt={featured.title} className="w-100"
                            style={{ height: 280, objectFit: 'cover' }} />
                        <div className="position-absolute bottom-0 start-0 end-0 p-4"
                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                            <Badge bg={catColors[featured.cat] || 'primary'} className="mb-2">{featured.cat}</Badge>
                            <h4 className="text-white fw-bold mb-2">{featured.title}</h4>
                            <p className="text-white-50 fs-13 mb-2">{featured.excerpt}</p>
                            <div className="d-flex align-items-center gap-3 text-white-50 fs-12">
                                <span><i className="ri-user-line me-1"></i>{featured.author}</span>
                                <span><i className="ri-calendar-line me-1"></i>{featured.date}</span>
                                <span><i className="ri-time-line me-1"></i>{featured.read_time}</span>
                                <span><i className="ri-heart-fill text-danger me-1"></i>{featured.likes}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Post grid */}
                <Row className="g-3">
                    {rest.map(post => (
                        <Col md={6} key={post.id}>
                            <div className="border rounded-3 overflow-hidden h-100" style={{ cursor: 'pointer' }}>
                                <div className="position-relative overflow-hidden" style={{ height: 160 }}>
                                    <img src={post.cover} alt={post.title} className="w-100 h-100"
                                        style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                    <Badge bg={catColors[post.cat] || 'primary'} className="position-absolute top-0 start-0 m-2">{post.cat}</Badge>
                                </div>
                                <div className="p-3">
                                    <h6 className="fw-semibold mb-2 fs-14">{post.title}</h6>
                                    <p className="text-muted fs-12 mb-2 text-truncate">{post.excerpt}</p>
                                    <div className="d-flex align-items-center gap-2 text-muted fs-11">
                                        <span><i className="ri-user-line me-1"></i>{post.author}</span>
                                        <span>·</span>
                                        <span><i className="ri-time-line me-1"></i>{post.read_time}</span>
                                        <span className="ms-auto">
                                            <i className="ri-heart-fill text-danger me-1"></i>{post.likes}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {filtered.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <i className="ri-draft-line fs-48 d-block mb-2 opacity-25"></i>
                        <p>Belum ada artikel di kategori ini</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumBlog;
