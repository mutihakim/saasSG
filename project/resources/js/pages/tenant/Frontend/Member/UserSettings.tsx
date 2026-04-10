import { useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { Col, Card } from 'react-bootstrap';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

declare const route: any;

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: any;
}

const MemberSettings: React.FC<Props> = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { props } = usePage<any>();



    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });

    return (
        <MemberPage title="Pengaturan Akun" parentLabel="Akun">
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-transparent border-0 pt-3">
                    <h5 className="fw-bold mb-0">Ubah Kata Sandi</h5>
                </Card.Header>
                <Card.Body>
                    <form onSubmit={(e) => { e.preventDefault(); passwordForm.put(route('password.update')); }}>
                        <Col lg={6}>
                            <div className="mb-3">
                                <label className="form-label fs-13">Kata Sandi Saat Ini</label>
                                <input type="password" 
                                    className={`form-control ${passwordForm.errors.current_password ? 'is-invalid' : ''}`}
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)} />
                                {passwordForm.errors.current_password && <div className="invalid-feedback">{passwordForm.errors.current_password}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fs-13">Kata Sandi Baru</label>
                                <input type="password" 
                                    className={`form-control ${passwordForm.errors.password ? 'is-invalid' : ''}`}
                                    value={passwordForm.data.password}
                                    onChange={e => passwordForm.setData('password', e.target.value)} />
                                {passwordForm.errors.password && <div className="invalid-feedback">{passwordForm.errors.password}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fs-13">Konfirmasi Kata Sandi Baru</label>
                                <input type="password" 
                                    className={`form-control ${passwordForm.errors.password_confirmation ? 'is-invalid' : ''}`}
                                    value={passwordForm.data.password_confirmation}
                                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)} />
                            </div>
                            <button type="submit" disabled={passwordForm.processing} className="btn btn-primary px-4">
                                {passwordForm.processing ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                            </button>
                        </Col>
                    </form>
                </Card.Body>
            </Card>
        </MemberPage>
    );
};

(MemberSettings as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default MemberSettings;
