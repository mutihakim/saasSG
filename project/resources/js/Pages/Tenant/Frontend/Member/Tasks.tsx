import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const TasksPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => {
    const [tab, setTab] = useState<'morning'|'night'>('morning');
    const routines = demo.routines[tab];

    return (
        <MemberLayout title="Mesin Tugas & Rutinitas" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
            <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
                <div className="bg-overlay"></div>
                <Container>
                    <div className="text-center">
                        <Badge bg="success-subtle" text="success" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                            <i className="ri-checkbox-multiple-line me-1"></i>PRD Modul B
                        </Badge>
                        <h2 className="text-white fw-bold mb-2">Mesin Tugas & Rutinitas</h2>
                        <p className="text-white-50">To-do list, rutinitas harian, dan jadwal perawatan rumah</p>
                    </div>
                </Container>
            </section>
            <section className="section">
                <Container>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-0 pt-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <h5 className="fw-bold mb-0"><i className="ri-list-check me-2 text-success"></i>Rutinitas Harian</h5>
                                <div className="d-flex gap-1">
                                    <button onClick={() => setTab('morning')} className={`btn btn-sm ${tab==='morning'?'btn-warning':'btn-soft-secondary'}`}>
                                        <i className="ri-sun-line me-1"></i>Pagi
                                    </button>
                                    <button onClick={() => setTab('night')} className={`btn btn-sm ${tab==='night'?'btn-primary':'btn-soft-secondary'}`}>
                                        <i className="ri-moon-line me-1"></i>Malam
                                    </button>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                {routines.map((r: any) => (
                                    <Col md={6} key={r.id}>
                                        <div className={`d-flex align-items-center p-3 rounded-3 border ${r.done ? 'bg-success-subtle border-success-subtle' : 'border-light'}`}>
                                            <div className="flex-shrink-0 me-3 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{width:36, height:36, background: r.done ? '#0ab39c' : '#f3f6f9'}}>
                                                <i className={`${r.done ? 'ri-check-line text-white' : 'ri-time-line text-muted'} fs-16`}></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className={`mb-0 fw-medium ${r.done ? 'text-decoration-line-through text-muted' : ''}`}>{r.task}</p>
                                                <p className="mb-0 fs-12 text-muted">{r.time} · {r.assignee}</p>
                                            </div>
                                            <Badge bg={r.done ? 'success' : 'warning'}>+{r.points} pts</Badge>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Container>
            </section>
        </MemberLayout>
    );
};

export default TasksPage;
