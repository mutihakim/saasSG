import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

import PremiumFileManager from '../Components/PremiumFileManager';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const AssetsPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Aset & Inventaris" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="primary-subtle" text="primary" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-home-gear-line me-1"></i>PRD Modul F
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Aset, Inventaris & Utilitas</h2>
                    <p className="text-white-50">Info vault, inventaris pakaian/mainan, dan dimensi rumah</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <Row className="g-4 mb-4">
                    {[
                        {icon:'ri-lock-2-line', title:'Info Vault', desc:'Password WiFi, PIN pintu, akses streaming', color:'primary', items:['WiFi Tamu: keluarga123', 'PIN Smart Lock: Tanya Ayah', 'Netflix: 4K Family Plan']},
                        {icon:'ri-ruler-2-line', title:'Dimensi Rumah', desc:'Ukuran ruangan untuk beli furnitur', color:'warning', items:['Ruang Keluarga: 4m × 5m', 'Kamar Anak: 3m × 3.5m', 'Dapur: 2.5m × 4m']},
                    ].map((v, i) => (
                        <Col md={6} key={i}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-transparent border-0 pt-3">
                                    <h5 className="fw-bold mb-0">
                                        <i className={`${v.icon} me-2 text-${v.color}`}></i>{v.title}
                                    </h5>
                                    <p className="text-muted fs-13 mb-0">{v.desc}</p>
                                </Card.Header>
                                <Card.Body>
                                    {v.items.map((item, ii) => (
                                        <div key={ii} className="d-flex align-items-center gap-3 p-2 border rounded-3 mb-2">
                                            <i className={`${v.icon} text-${v.color} fs-18`}></i>
                                            <span className="fs-13 fw-medium">{item}</span>
                                        </div>
                                    ))}
                                    <button className="btn btn-soft-primary btn-sm w-100 mt-2">
                                        <i className="ri-add-line me-1"></i>Tambah Item
                                    </button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
                <PremiumFileManager files={demo.files} />
            </Container>
        </section>
    </MemberLayout>
);

export default AssetsPage;
