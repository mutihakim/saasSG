import React, { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type QuickForm = {
    full_name: string;
    role_code: string;
    profile_status: string;
};

type Props = {
    show: boolean;
    loading: boolean;
    form: QuickForm;
    roleOptions: string[];
    roleLabel: (roleCode: string) => string;
    profileStatusLabel: (status: string) => string;
    onClose: () => void;
    onSubmit: (e: FormEvent) => void;
    onChange: (updater: (prev: QuickForm) => QuickForm) => void;
};

export default function QuickAddMemberModal({
    show,
    loading,
    form,
    roleOptions,
    roleLabel,
    profileStatusLabel,
    onClose,
    onSubmit,
    onChange,
}: Props) {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t("tenant.members.quick_add.title")}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
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
                    <Form.Group>
                        <Form.Label>{t("tenant.members.labels.status")}</Form.Label>
                        <Form.Select
                            value={form.profile_status}
                            onChange={(e) => onChange((prev) => ({ ...prev, profile_status: e.target.value }))}
                        >
                            <option value="active">{profileStatusLabel("active")}</option>
                            <option value="inactive">{profileStatusLabel("inactive")}</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onClose}>
                        {t("Cancel")}
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? t("tenant.members.actions.saving") : t("tenant.members.actions.add_member")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
