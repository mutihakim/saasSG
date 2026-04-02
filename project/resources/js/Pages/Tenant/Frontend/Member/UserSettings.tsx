import { Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

declare const route: any;

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: any;
}

const MemberSettings: React.FC<Props> = ({ tenantName, tenantSlug, member }) => {
    const { props } = usePage<any>();
    const user = props.auth?.user;
    const memberName = user?.name ?? member?.user?.name ?? 'Anggota';

    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });

    const updatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <MemberLayout title="Pengaturan" tenantName={tenantName} tenantSlug={tenantSlug} memberName={memberName}>
            {/* Page hero */}
            <section className="section nft-hero" style={{ paddingTop: 80, paddingBottom: 40 }}>
                <div className="bg-overlay"></div>
                <div className="container-fluid px-4">
                    <div className="text-center">
                        <Badge bg="info-subtle" text="info" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                            <i className="ri-settings-3-line me-1"></i>Area Member
                        </Badge>
                        <h2 className="text-white fw-bold mb-2">Pengaturan Akun</h2>
                        <p className="text-white-50">Kelola password dan preferensi akun Anda</p>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-fluid px-4" style={{ maxWidth: 800, margin: '0 auto' }}>
                    {/* Update Password */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-0 pt-3">
                            <h5 className="fw-bold mb-0">
                                <i className="ri-lock-password-line text-warning me-2"></i>Ubah Password
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <form onSubmit={updatePassword}>
                                {[
                                    { key: 'current_password', label: 'Password Saat Ini', type: 'password' },
                                    { key: 'password', label: 'Password Baru', type: 'password' },
                                    { key: 'password_confirmation', label: 'Konfirmasi Password Baru', type: 'password' },
                                ].map(field => (
                                    <div className="mb-3" key={field.key}>
                                        <label className="form-label fw-semibold">{field.label}</label>
                                        <input
                                            type={field.type}
                                            className={`form-control ${passwordForm.errors[field.key as keyof typeof passwordForm.errors] ? 'is-invalid' : ''}`}
                                            value={(passwordForm.data as any)[field.key]}
                                            onChange={e => passwordForm.setData(field.key as any, e.target.value)}
                                        />
                                        {passwordForm.errors[field.key as keyof typeof passwordForm.errors] && (
                                            <div className="invalid-feedback">{passwordForm.errors[field.key as keyof typeof passwordForm.errors]}</div>
                                        )}
                                    </div>
                                ))}
                                <button type="submit" className="btn btn-warning" disabled={passwordForm.processing}>
                                    {passwordForm.processing
                                        ? <><span className="spinner-border spinner-border-sm me-1"></span>Menyimpan...</>
                                        : 'Ubah Password'}
                                </button>
                            </form>
                        </Card.Body>
                    </Card>

                    {/* Quick navigation */}
                    <Row className="g-3">
                        {[
                            { href: '/me', icon: 'ri-user-line', label: 'Profil Saya', color: 'primary' },
                            { href: '/me/security', icon: 'ri-shield-keyhole-line', label: 'Keamanan', color: 'warning' },
                            { href: '/admin/dashboard', icon: 'ri-dashboard-line', label: 'Admin Dashboard', color: 'success' },
                            { href: '/', icon: 'ri-home-heart-line', label: 'Family Hub', color: 'info' },
                        ].map((item, i) => (
                            <Col xs={6} md={3} key={i}>
                                <Link href={item.href} className="text-decoration-none">
                                    <Card className="border h-100 text-center" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                                        <Card.Body className="p-3">
                                            <i className={`${item.icon} text-${item.color} fs-24 d-block mb-1`}></i>
                                            <p className="fw-semibold fs-13 mb-0">{item.label}</p>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>
        </MemberLayout>
    );
};

export default MemberSettings;
