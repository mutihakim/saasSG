import React, { useState } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const TasksPage: React.FC<Props> = ({ demo }) => {
    const [tab, setTab] = useState<'morning'|'night'>('morning');
    const routines = demo.routines[tab];


    return (
        <MemberPage title="Daftar Tugas & Rutinitas" parentLabel="Tugas & Reward">
            <Card className="border-0 shadow-sm">
                {/* ... existing card content ... */}
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
        </MemberPage>
    );
};

(TasksPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default TasksPage;
