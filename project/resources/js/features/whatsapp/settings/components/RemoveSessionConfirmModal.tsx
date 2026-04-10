import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

type Props = {
    show: boolean;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function RemoveSessionConfirmModal({ show, loading, onClose, onConfirm }: Props) {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('tenant.whatsapp.settings.remove_confirm_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{t('tenant.whatsapp.settings.remove_confirm_body')}</Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onClose} disabled={loading}>
                    {t('tenant.whatsapp.settings.remove_confirm_cancel')}
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={loading}>
                    {t('tenant.whatsapp.settings.remove_confirm_submit')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
