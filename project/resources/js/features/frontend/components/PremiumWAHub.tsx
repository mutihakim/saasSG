import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';

interface WALog {
    sender: string;
    text: string;
    time: string;
    status: string;
    type: string;
    avatar: string;
}

interface WACommand {
    cmd: string;
    desc: string;
}

interface Props {
    wa_logs: WALog[];
    wa_commands: WACommand[];
}

const typeConfig: Record<string, { bg: string; badge: string; icon: string }> = {
    input: { bg: 'bg-success-subtle', badge: 'success', icon: 'ri-arrow-up-circle-line text-success' },
    output: { bg: 'bg-primary-subtle', badge: 'primary', icon: 'ri-robot-line text-primary' },
    verify: { bg: 'bg-warning-subtle', badge: 'warning', icon: 'ri-shield-check-line text-warning' },
    alert: { bg: 'bg-danger-subtle', badge: 'danger', icon: 'ri-alarm-warning-line text-danger' },
};

const PremiumWAHub: React.FC<Props> = ({ wa_logs, wa_commands }) => {
    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="rounded-3 d-flex align-items-center justify-content-center bg-success"
                        style={{ width: 48, height: 48 }}>
                        <i className="ri-whatsapp-line text-white fs-22"></i>
                    </div>
                    <div>
                        <h5 className="mb-0 fw-semibold">Integrasi WhatsApp</h5>
                        <p className="text-muted fs-13 mb-0">Kelola keluarga via chat yang familiar</p>
                    </div>
                    <Badge bg="success" className="ms-auto d-flex align-items-center gap-1">
                        <span className="rounded-circle bg-white" style={{ width: 6, height: 6, display: 'block' }}></span>
                        Aktif
                    </Badge>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-4">
                    {/* Chat Feed */}
                    <Col lg={7}>
                        <h6 className="fw-semibold mb-3">Aktivitas Terbaru</h6>
                        <div className="d-flex flex-column gap-2">
                            {wa_logs.map((log, i) => {
                                const cfg = typeConfig[log.type] || typeConfig.input;
                                return (
                                    <div key={i} className={`p-3 rounded-3 ${cfg.bg}`}>
                                        <div className="d-flex align-items-start gap-2">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: 32, height: 32, background: log.sender === 'System' ? '#405189' : '#0ab39c' }}>
                                                <span className="text-white fw-bold" style={{ fontSize: 12 }}>{log.avatar}</span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className="fw-semibold fs-13">{log.sender}</span>
                                                    <span className="text-muted fs-11">{log.time}</span>
                                                </div>
                                                <p className="mb-1 fs-13 fw-medium">{log.text}</p>
                                                <div className="d-flex align-items-center gap-1">
                                                    <i className={cfg.icon + ' fs-13'}></i>
                                                    <Badge bg={cfg.badge} className="fs-11">{log.status}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Col>

                    {/* Command Reference */}
                    <Col lg={5}>
                        <h6 className="fw-semibold mb-3">Perintah WA Tersedia</h6>
                        <div className="d-flex flex-column gap-2">
                            {wa_commands.map((cmd, i) => (
                                <div key={i} className="p-3 border rounded-3">
                                    <code className="d-block text-success fs-13 mb-1">{cmd.cmd}</code>
                                    <p className="mb-0 text-muted fs-12">{cmd.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 rounded-3 text-center"
                            style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' }}>
                            <i className="ri-whatsapp-line text-white fs-32 d-block mb-2"></i>
                            <h6 className="text-white fw-bold mb-1">Mulai Pakai Sekarang</h6>
                            <p className="text-white-50 fs-12 mb-3">Scan atau klik untuk membuka WhatsApp Bot Keluarga</p>
                            <button className="btn btn-light btn-sm fw-semibold">
                                <i className="ri-qr-code-line me-2"></i>Lihat QR Code
                            </button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default PremiumWAHub;
