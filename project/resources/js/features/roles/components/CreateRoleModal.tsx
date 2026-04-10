import React, { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { NewRoleForm } from "../types";

type Props = {
    show: boolean;
    saving: boolean;
    form: NewRoleForm;
    onClose: () => void;
    onSubmit: (e: FormEvent) => void;
    onChange: (updater: (prev: NewRoleForm) => NewRoleForm) => void;
};

export default function CreateRoleModal({ show, saving, form, onClose, onSubmit, onChange }: Props) {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t("tenant.roles.create_modal.title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("tenant.roles.create_modal.system_name")}</Form.Label>
                        <Form.Control
                            placeholder={t("tenant.roles.create_modal.system_name_placeholder")}
                            value={form.name}
                            onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t("tenant.roles.create_modal.display_name")}</Form.Label>
                        <Form.Control
                            placeholder={t("tenant.roles.create_modal.display_name_placeholder")}
                            value={form.display_name}
                            onChange={(e) => onChange((prev) => ({ ...prev, display_name: e.target.value }))}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onClose}>{t("Cancel")}</Button>
                    <Button type="submit" disabled={saving}>{saving ? t("tenant.roles.actions.saving") : t("tenant.roles.actions.create")}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
