import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const WalletPage: React.FC<Props> = ({ demo }) => (

    <MemberPage title="Dompet Anak" parentLabel="Tugas & Reward">
        <Row className="g-4 justify-content-center">
            {demo.finance.kids_wallet.map((kid: any, i: number) => (
                <Col md={5} key={i}>
                    <Card className="border-0 shadow-sm overflow-hidden h-100">
                        <Card.Body className="p-0">
                            <div className="p-4 text-center text-white"
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
                        </Card.Body>
                    </Card>
                </Col>
            ))}
            <Col xs={12} className="text-center mt-4">
                <div className="p-3 bg-light rounded-3 d-inline-block">
                    <i className="ri-whatsapp-line text-success fs-20 me-2 align-middle"></i>
                    <span className="text-muted">Ketik <code className="mx-1">poin [nama]</code> di WhatsApp untuk cek realtime</span>
                </div>
            </Col>
        </Row>
    </MemberPage>
);

(WalletPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default WalletPage;
