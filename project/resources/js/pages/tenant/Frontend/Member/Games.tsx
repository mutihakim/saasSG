import React, { useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const GamesPage: React.FC<Props> = ({ demo: _unused_demo }) => {
    // Game logic for "Tebak Angka" (example)
    const [target] = useState(() => Math.floor(Math.random() * 10) + 1);
    const [guess, setGuess] = useState('');
    const [msg, setMsg] = useState('Tebak angka 1-10');

    const handleGuess = () => {
        const n = parseInt(guess);
        if (n === target) setMsg('🎉 Selamat! Anda benar!');
        else setMsg(n < target ? 'Terlalu rendah!' : 'Terlalu tinggi!');
    };

    return (
        <MemberPage title="Pusat Game Keluarga" parentLabel="Hiburan">
            <Row className="g-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center p-5">
                            <div className="rounded-circle bg-info-subtle d-flex align-items-center justify-content-center mx-auto mb-4"
                                style={{width:80, height:80}}>
                                <i className="ri-gamepad-line text-info fs-36"></i>
                            </div>
                            <h3 className="fw-bold mb-3">Tebak Angka Keluarga</h3>
                            <p className="text-muted mb-4">{msg}</p>
                            <div className="d-flex gap-2 justify-content-center mb-3">
                                <input type="number" className="form-control text-center" style={{width:80}}
                                    value={guess} onChange={e => setGuess(e.target.value)} />
                                <button onClick={handleGuess} className="btn btn-info px-4">Tebak!</button>
                            </div>
                            <p className="small text-muted mb-0">Menangkan 10 poin jika benar!</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-transparent border-0 pt-3">
                            <h5 className="fw-bold mb-0"><i className="ri-medal-line me-2 text-warning"></i>Status Pemain</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="p-3 bg-light rounded-3 mb-3">
                                <h6 className="fw-bold mb-1">Tiket Tersedia</h6>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="ri-coupon-2-line text-warning fs-20"></i>
                                    <span className="fw-bold fs-18">5 Tiket</span>
                                </div>
                            </div>
                            <p className="text-muted fs-13 mb-0">Tiket akan bertambah setiap kali Anda menyelesaikan tugas harian.</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </MemberPage>
    );
};

(GamesPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default GamesPage;

