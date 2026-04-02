import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

interface FileItem {
    id: number;
    name: string;
    size: string;
    type: string;
    uploaded: string;
    cat: string;
}

interface Props { files: FileItem[] }

const CATS = ['Semua', 'Identitas', 'Properti', 'Pendidikan', 'Kesehatan', 'Kendaraan', 'Asuransi'];

const typeIcon: Record<string, string> = {
    pdf: 'ri-file-pdf-line',
    image: 'ri-image-line',
    doc: 'ri-file-word-line',
    default: 'ri-file-line'
};

const typeColor: Record<string, string> = {
    pdf: 'danger', image: 'info', doc: 'primary', default: 'secondary'
};

const catColorMap: Record<string, string> = {
    Identitas: 'primary', Properti: 'success', Pendidikan: 'warning',
    Kesehatan: 'danger', Kendaraan: 'info', Asuransi: 'secondary'
};

const PremiumFileManager: React.FC<Props> = ({ files }) => {
    const [activeCat, setActiveCat] = useState('Semua');

    const filtered = activeCat === 'Semua' ? files : files.filter(f => f.cat === activeCat);

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-folder-3-line me-2 text-warning"></i>
                            File Manager Keluarga
                        </h5>
                        <p className="text-muted fs-13 mb-0">Kelola dokumen penting terpusat & aman</p>
                    </div>
                    <button className="btn btn-primary btn-sm">
                        <i className="ri-upload-line me-1"></i>Upload
                    </button>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-3">
                    {CATS.map(cat => (
                        <button key={cat} onClick={() => setActiveCat(cat)}
                            className={`btn btn-sm ${activeCat === cat ? 'btn-warning' : 'btn-soft-secondary'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </Card.Header>
            <Card.Body>
                {/* Summary cards */}
                <Row className="g-2 mb-4">
                    {CATS.slice(1).map(cat => {
                        const count = files.filter(f => f.cat === cat).length;
                        return (
                            <Col xs={6} md={4} lg={2} key={cat}>
                                <div className={`p-2 rounded-3 bg-${catColorMap[cat] || 'secondary'}-subtle text-center`}
                                    style={{ cursor: 'pointer' }} onClick={() => setActiveCat(cat)}>
                                    <p className={`mb-0 fw-bold text-${catColorMap[cat] || 'secondary'}`}>{count}</p>
                                    <p className="mb-0 fs-11 text-muted">{cat}</p>
                                </div>
                            </Col>
                        );
                    })}
                </Row>

                {/* File grid */}
                <Row className="g-3">
                    {filtered.map(file => (
                        <Col xs={12} sm={6} md={4} key={file.id}>
                            <div className="border rounded-3 p-3 h-100 d-flex align-items-center gap-3"
                                style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                <div className={`rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 bg-${typeColor[file.type] || 'secondary'}-subtle`}
                                    style={{ width: 48, height: 48 }}>
                                    <i className={`${typeIcon[file.type] || typeIcon.default} text-${typeColor[file.type] || 'secondary'} fs-20`}></i>
                                </div>
                                <div className="flex-grow-1 overflow-hidden">
                                    <p className="mb-0 fw-medium fs-13 text-truncate">{file.name}</p>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg={catColorMap[file.cat] || 'secondary'} className="fs-11">{file.cat}</Badge>
                                        <span className="text-muted fs-11">{file.size}</span>
                                    </div>
                                    <p className="mb-0 text-muted fs-11">{file.uploaded}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button className="btn btn-sm btn-soft-primary py-1 px-2">
                                        <i className="ri-download-line"></i>
                                    </button>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {filtered.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <i className="ri-folder-open-line fs-48 d-block mb-2 opacity-25"></i>
                        <p>Tidak ada file di kategori ini</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumFileManager;
