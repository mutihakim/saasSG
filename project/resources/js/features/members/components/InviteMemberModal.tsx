import React, { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type InviteForm = {
    member_id: number | null;
    full_name: string;
    email: string;
    role_code: string;
    note: string;
    expires_in_days: number;
};

type Props = {
    show: boolean;
    loading: boolean;
    form: InviteForm;
    roleOptions: string[];
    roleLabel: (roleCode: string) => string;
    onClose: () => void;
    onSubmit: (e: FormEvent) => void;
    onChange: (updater: (prev: InviteForm) => InviteForm) => void;
};

export default function InviteMemberModal({
    show,
    loading,
    form,
    roleOptions,
    roleLabel,
    onClose,
    onSubmit,
    onChange,
}: Props) {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t("tenant.members.invite.title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("tenant.members.labels.email")}</Form.Label>
                        <Form.Control
                            type="email"
                            value={form.email}
                            onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("tenant.members.labels.full_name")}</Form.Label>
                        <Form.Control
                            value={form.full_name}
                            onChange={(e) => onChange((prev) => ({ ...prev, full_name: e.target.value }))}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("tenant.members.labels.role")}</Form.Label>
                        <Form.Select
                            value={form.role_code}
                            onChange={(e) => onChange((prev) => ({ ...prev, role_code: e.target.value }))}
                        >
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {roleLabel(role)}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("tenant.members.labels.note_optional")}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={form.note}
                            onChange={(e) => onChange((prev) => ({ ...prev, note: e.target.value }))}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t("tenant.members.labels.expires_in_days")}</Form.Label>
                        <Form.Control
                            type="number"
                            min={1}
                            max={30}
                            value={form.expires_in_days}
                            onChange={(e) => onChange((prev) => ({ ...prev, expires_in_days: Number(e.target.value) }))}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onClose}>
                        {t("Cancel")}
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? t("tenant.members.actions.sending") : t("tenant.members.actions.send_invitation")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
