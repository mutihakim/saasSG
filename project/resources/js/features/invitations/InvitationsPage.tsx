
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import React, { FormEvent, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import TenantPageTitle from '@/components/layouts/TenantPageTitle';
import { useTenantRoute } from '@/core/config/routes';
import { notify } from '@/core/lib/notify';
import { humanizeCode } from '@/core/lib/text';
import { parseApiError } from '@/core/types/apiError.types';
import { parseInvitationError } from '@/core/types/invitationError.types';
import TenantLayout from '@/layouts/TenantLayout';

const CreateInvitationModal = lazy(() => import('./components/CreateInvitationModal'));

type InvitationItem = {
    id: number;
    member_id: number | null;
    email: string;
    full_name?: string | null;
    role_code: string;
    note?: string | null;
    status: string;
    invite_url: string;
    expires_at: string;
    created_at: string;
};

const defaultForm = {
    member_id: null as number | null,
    email: '',
    full_name: '',
    role_code: '',
    note: '',
    expires_in_days: 7,
};

function InvitationsIndex() {
    const { t } = useTranslation();
    const { props } = usePage<{ roleOptions?: string[] }>();
    const roleOptions = (props.roleOptions && props.roleOptions.length > 0) ? props.roleOptions : ['admin', 'member'];
    const tenantRoute = useTenantRoute();
    const [items, setItems] = useState<InvitationItem[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ ...defaultForm, role_code: roleOptions[0] ?? 'member' });

    const apiBase = tenantRoute.apiTo('/invitations');

    const showApiError = useCallback((err: any, fallback: string) => {
        const parsed = parseApiError(err, fallback);
        notify.error({
            title: parsed.title,
            detail: parsed.detail ?? t('tenant.invitations.error.try_again'),
        });
    }, [t]);

    const roleLabel = useCallback((roleCode: string) => {
        return t(`tenant.members.roles.${roleCode}`, {
            defaultValue: humanizeCode(roleCode),
        });
    }, [t]);

    const statusLabel = useCallback((status: string) => {
        return t(`tenant.invitations.status.${status}`, {
            defaultValue: humanizeCode(status),
        });
    }, [t]);

    const loadInvitations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(apiBase);
            setItems(response.data.data.invitations);
        } catch (err: any) {
            showApiError(err, t('tenant.invitations.error.load_failed'));
        } finally {
            setLoading(false);
        }
    }, [apiBase, showApiError, t]);

    useEffect(() => {
        loadInvitations();
    }, [loadInvitations]);

    async function submitCreate(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(apiBase, form);
            const inviteUrl = response.data.data.invite_url as string;
            notify.success(
                <div>
                    <div className="fw-semibold">{t('tenant.invitations.toast.created')}</div>
                    <div className="small mt-1">
                        <a href={inviteUrl} target="_blank" rel="noreferrer">{t('tenant.invitations.actions.open_invitation')}</a>
                    </div>
                </div>
            );
            setShowCreate(false);
            setForm({ ...defaultForm, role_code: roleOptions[0] ?? 'member' });
            await loadInvitations();
        } catch (err: any) {
            const parsed = parseInvitationError(err, t('tenant.invitations.error.create_failed'));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    }

    async function resend(id: number) {
        setLoading(true);
        try {
            const response = await axios.post(`${apiBase}/${id}/resend`);
            notify.success(
                <div>
                    <div className="fw-semibold">{t('tenant.invitations.toast.resent')}</div>
                    <div className="small mt-1">
                        <a href={response.data.data.invite_url} target="_blank" rel="noreferrer">{t('tenant.invitations.actions.open_invitation')}</a>
                    </div>
                </div>
            );
            await loadInvitations();
        } catch (err: any) {
            const parsed = parseInvitationError(err, t('tenant.invitations.error.resend_failed'));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    }

    async function revoke(id: number) {
        setLoading(true);
        try {
            await axios.post(`${apiBase}/${id}/revoke`);
            notify.success(t('tenant.invitations.toast.revoked'));
            await loadInvitations();
        } catch (err: any) {
            const parsed = parseInvitationError(err, t('tenant.invitations.error.revoke_failed'));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    }

    async function copyLink(link: string) {
        await navigator.clipboard.writeText(link);
        notify.info(t('tenant.invitations.toast.link_copied'));
    }

    return (
        <>
            <Head title={t('tenant.invitations.page_title')} />
            <TenantPageTitle title={t('tenant.invitations.title')} parentLabel={t('tenant.invitations.parent')} />

            <Row className="mb-3">
                <Col>
                    <Button onClick={() => setShowCreate(true)}>
                        <i className="ri-add-line me-1"></i>
                        {t('tenant.invitations.actions.new_invitation')}
                    </Button>
                </Col>
            </Row>

            <Card>
                <Card.Body>
                    <div className="table-responsive">
                        <Table className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t('tenant.invitations.table.name')}</th>
                                    <th>{t('tenant.invitations.table.email')}</th>
                                    <th>{t('tenant.invitations.table.role')}</th>
                                    <th>{t('tenant.invitations.table.status')}</th>
                                    <th>{t('tenant.invitations.table.expires')}</th>
                                    <th className="text-end">{t('tenant.invitations.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-medium">{item.full_name || '-'}</td>
                                        <td>
                                            <div className="fw-medium">{item.email}</div>
                                            {item.note ? <small className="text-muted">{item.note}</small> : null}
                                        </td>
                                        <td className="text-capitalize">{roleLabel(item.role_code)}</td>
                                        <td>
                                            <Badge bg={item.status === 'pending' ? 'warning-subtle' : 'light'} text={item.status === 'pending' ? 'warning' : 'dark'} className="text-capitalize">
                                                {statusLabel(item.status)}
                                            </Badge>
                                        </td>
                                        <td>{new Date(item.expires_at).toLocaleString()}</td>
                                        <td className="text-end">
                                            <a href={item.invite_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-soft-success me-2">
                                                {t('tenant.invitations.actions.open_link')}
                                            </a>
                                            <Button size="sm" variant="soft-primary" className="me-2" onClick={() => copyLink(item.invite_url)}>
                                                {t('tenant.invitations.actions.copy_link')}
                                            </Button>
                                            <Button size="sm" variant="soft-info" className="me-2" onClick={() => resend(item.id)} disabled={item.status !== 'pending' || loading}>
                                                {t('tenant.invitations.actions.resend')}
                                            </Button>
                                            <Button size="sm" variant="soft-danger" onClick={() => revoke(item.id)} disabled={item.status !== 'pending' || loading}>
                                                {t('tenant.invitations.actions.revoke')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!items.length ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-4">{t('tenant.invitations.empty')}</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {showCreate ? (
                <Suspense fallback={null}>
                    <CreateInvitationModal
                        show={showCreate}
                        loading={loading}
                        form={form}
                        roleOptions={roleOptions}
                        roleLabel={roleLabel}
                        onClose={() => setShowCreate(false)}
                        onSubmit={submitCreate}
                        onChange={setForm}
                    />
                </Suspense>
            ) : null}
        </>
    );
}

InvitationsIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default InvitationsIndex;
