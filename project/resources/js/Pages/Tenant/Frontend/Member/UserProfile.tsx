import { Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

declare const route: any;

interface Props {
    tenantName: string;
    tenantSlug: string;
    member?: any;
    demo?: any;
    mustVerifyEmail?: boolean;
    status?: string;
}

const MemberProfile: React.FC<Props> = ({ tenantName, tenantSlug, member, mustVerifyEmail, status }) => {
    const { props } = usePage<any>();
    const user = props.auth?.user;
    const memberName = user?.name ?? member?.user?.name ?? 'Anggota';

    const { data, setData, patch, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <MemberLayout title="Profil Saya" tenantName={tenantName} tenantSlug={tenantSlug} memberName={memberName}>
            {/* Page hero */}
            <section className="section nft-hero" style={{ paddingTop: 80, paddingBottom: 40 }}>
                <div className="bg-overlay"></div>
                <div className="container-fluid px-4">
                    <div className="text-center">
                        <Badge bg="primary-subtle" text="primary" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                            <i className="ri-user-line me-1"></i>Area Member
                        </Badge>
                        <h2 className="text-white fw-bold mb-2">Profil Saya</h2>
                        <p className="text-white-50">Kelola informasi profil Anda dalam Family Hub</p>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-fluid px-4" style={{ maxWidth: 800, margin: '0 auto' }}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                            {/* Avatar */}
                            <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{ width: 72, height: 72 }}>
                                    <span className="text-white fw-bold fs-28">
                                        {memberName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">{memberName}</h5>
                                    <p className="text-muted mb-0">{user?.email}</p>
                                    <Badge bg="success-subtle" text="success" className="mt-1">Anggota Aktif</Badge>
                                </div>
                            </div>

                            {status && (
                                <div className="alert alert-success py-2 mb-3">
                                    <i className="ri-checkbox-circle-line me-2"></i>{status}
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Alamat Email</label>
                                    <input
                                        type="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    {mustVerifyEmail && user?.email_verified_at === null && (
                                        <p className="text-muted fs-13 mt-1">
                                            Email belum diverifikasi.{' '}
                                            <Link href={route('verification.send')} method="post" as="button" className="btn btn-link p-0 fs-13">
                                                Kirim ulang verifikasi
                                            </Link>
                                        </p>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary" disabled={processing}>
                                        {processing ? <><span className="spinner-border spinner-border-sm me-1"></span>Menyimpan...</> : 'Simpan Perubahan'}
                                    </button>
                                    <Link href="/" className="btn btn-soft-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>Kembali ke Dashboard
                                    </Link>
                                </div>
                            </form>
                        </Card.Body>
                    </Card>

                    {/* Quick nav to related pages */}
                    <Row className="g-3 mt-2">
                        {[
                            { href: '/me/settings', icon: 'ri-settings-3-line', label: 'Pengaturan Akun', color: 'info' },
                            { href: '/me/security', icon: 'ri-shield-keyhole-line', label: 'Keamanan', color: 'warning' },
                            { href: '/admin/dashboard', icon: 'ri-dashboard-line', label: 'Admin Dashboard', color: 'primary' },
                        ].map((item, i) => (
                            <Col xs={6} md={4} key={i}>
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

export default MemberProfile;
