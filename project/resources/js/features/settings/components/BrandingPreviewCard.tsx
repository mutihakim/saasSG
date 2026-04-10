import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

type PreviewState = {
    logo_light: string;
    logo_dark: string;
    logo_icon: string;
    favicon: string;
};

type Props = {
    presentableName: string;
    previews: PreviewState;
};

export default function BrandingPreviewCard({ presentableName, previews }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Card className="mb-3">
                <Card.Header>
                    <h4 className="card-title mb-0">{t('tenant.settings.branding.preview.title')}</h4>
                </Card.Header>
                <Card.Body className="d-flex flex-column gap-3">
                    <div className="rounded border overflow-hidden">
                        <div className="bg-white px-3 py-3 border-bottom d-flex align-items-center justify-content-between">
                            <img src={previews.logo_dark} alt={t('tenant.settings.branding.preview.topbar_alt')} style={{ height: '24px', maxWidth: '180px', objectFit: 'contain' }} />
                            <span className="badge bg-primary-subtle text-primary">{presentableName}</span>
                        </div>
                        <div className="d-flex">
                            <div className="bg-dark px-3 py-4 text-white" style={{ width: '112px' }}>
                                <img src={previews.logo_light} alt={t('tenant.settings.branding.preview.sidebar_alt')} style={{ height: '24px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <div className="flex-grow-1 p-3 bg-light-subtle">
                                <div className="rounded border bg-white p-3">
                                    <strong>{t('tenant.settings.branding.preview.workspace_shell')}</strong>
                                    <p className="text-muted mb-0 mt-2">{t('tenant.settings.branding.preview.expanded_sidebar')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded border overflow-hidden d-flex">
                        <div className="bg-dark px-3 py-4 d-flex align-items-start justify-content-center" style={{ width: '80px' }}>
                            <img src={previews.logo_icon} alt={t('tenant.settings.branding.preview.compact_alt')} style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
                        </div>
                        <div className="flex-grow-1 p-3">
                            <strong>{t('tenant.settings.branding.preview.compact_sidebar')}</strong>
                            <p className="text-muted mb-0 mt-2">{t('tenant.settings.branding.preview.compact_sidebar_help')}</p>
                        </div>
                    </div>

                    <div className="rounded border p-3 d-flex align-items-center gap-3">
                        <img src={previews.favicon} alt={t('tenant.settings.branding.preview.favicon_alt')} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <div>
                            <strong>{t('tenant.settings.branding.preview.browser_tab')}</strong>
                            <p className="text-muted mb-0">{t('tenant.settings.branding.preview.browser_tab_help')}</p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <Alert variant="info" className="mb-0">
                {t('tenant.settings.branding.storage_notice')}
            </Alert>
        </>
    );
}
