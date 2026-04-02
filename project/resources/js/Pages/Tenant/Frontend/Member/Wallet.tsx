import React from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const WalletPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Dompet Anak" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="info-subtle" text="info" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-wallet-3-line me-1"></i>PRD Modul B
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Dompet Digital Anak</h2>
                    <p className="text-white-50">Saldo poin, uang saku, dan riwayat reward per anggota</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <Row className="g-4 justify-content-center">
                    {demo.finance.kids_wallet.map((kid: any, i: number) => (
                        <Col md={5} key={i}>
                            <div className="p-4 rounded-4 text-center"
                                style={{background:'linear-gradient(135deg,#405189 0%,#0ab39c 100%)'}}>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center mx-auto mb-3"
                                    style={{width:72,height:72}}>
                                    <span className="fw-bold text-primary fs-28">{kid.name.charAt(0)}</span>
                                </div>
                                <h4 className="text-white fw-bold mb-0">{kid.name}</h4>
                                <p className="text-white-50 mb-3">Anggota Keluarga</p>
                                <h2 className="text-white fw-bold mb-1">{fmt(kid.balance)}</h2>
                                <p className="text-white-50 small mb-4">Saldo Uang Saku</p>
                                <Row className="g-2">
                                    {[
                                        {label:'Total Poin', val: kid.points.toLocaleString()+'⭐'},
                                        {label:'Uang Saku/Minggu', val: fmt(kid.allowance)},
                                    ].map((s, si) => (
                                        <Col xs={6} key={si}>
                                            <div className="p-2 rounded-3" style={{background:'rgba(255,255,255,0.15)'}}>
                                                <div className="fw-bold text-white">{s.val}</div>
                                                <div className="text-white-50 fs-11">{s.label}</div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Col>
                    ))}
                    <Col xs={12} className="text-center mt-2">
                        <div className="p-3 bg-light rounded-3">
                            <i className="ri-whatsapp-line text-success fs-20 me-2"></i>
                            <span className="text-muted">Ketik <code>poin [nama]</code> di WhatsApp untuk cek realtime</span>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    </MemberLayout>
);

export default WalletPage;
