import { usePage } from '@inertiajs/react';
import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: any;
    demo?: any;
    mustVerifyEmail?: boolean;
    status?: string;
}

const MemberProfile: React.FC<Props> = () => {
    const { props } = usePage<any>();
    const user = props.auth?.user;


    return (
        <MemberPage title="Profil Pengguna" parentLabel="Akun">
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="p-4" style={{ background: 'linear-gradient(135deg, var(--vz-primary) 0%, #405189 100%)' }}>
                    <div className="d-flex align-items-center gap-4">
                        <div className="avatar-lg bg-white rounded-circle p-1" style={{width: 80, height: 80}}>
                            <div className="bg-light rounded-circle h-100 w-100 d-flex align-items-center justify-content-center">
                                <span className="fs-24 fw-bold text-primary">{user?.name?.charAt(0)}</span>
                            </div>
                        </div>
                        <div className="flex-grow-1">
                            <h4 className="text-white fw-bold mb-1">{user?.name}</h4>
                            <p className="text-white-50 mb-0">{user?.email}</p>
                        </div>
                        <Badge bg="success-subtle" text="success" className="fs-12 px-3 py-2 rounded-pill">
                            <i className="ri-shield-check-line me-1"></i>Member Aktif
                        </Badge>
                    </div>
                </div>
                <Card.Body className="p-4">
                    <Row>
                        <Col lg={6}>
                            <h6 className="fw-bold mb-3">Informasi Akun</h6>
                            <div className="d-flex flex-column gap-3">
                                <div>
                                    <label className="text-muted fs-12 mb-0">Nama Lengkap</label>
                                    <p className="fw-medium mb-0">{user?.name}</p>
                                </div>
                                <div>
                                    <label className="text-muted fs-12 mb-0">Email</label>
                                    <p className="fw-medium mb-0">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-muted fs-12 mb-0">Terdaftar Sejak</label>
                                    <p className="fw-medium mb-0">{user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </MemberPage>
    );
};

(MemberProfile as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default MemberProfile;
