import React from "react";
import { Alert, Badge, Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { RoleItem } from "../types";

type Props = {
    show: boolean;
    saving: boolean;
    selectedRole: RoleItem | null;
    selectedPermissions: string[];
    moduleRows: [string, string[]][];
    actionColumns: string[];
    formatModuleLabel: (moduleName: string) => string;
    formatActionLabel: (action: string) => string;
    onClose: () => void;
    onSaveName: () => void;
    onSavePermissions: () => void;
    onTogglePermission: (permissionName: string) => void;
    onRoleDisplayNameChange: (value: string) => void;
};

export default function RoleMatrixModal({
    show,
    saving,
    selectedRole,
    selectedPermissions,
    moduleRows,
    actionColumns,
    formatModuleLabel,
    formatActionLabel,
    onClose,
    onSaveName,
    onSavePermissions,
    onTogglePermission,
    onRoleDisplayNameChange,
}: Props) {
    const { t } = useTranslation();

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            size="xl"
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header closeButton>
                <Modal.Title>{t("tenant.roles.matrix.title")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!selectedRole ? (
                    <Alert variant="info" className="mb-0">{t("tenant.roles.matrix.select_role")}</Alert>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">{selectedRole.display_name}</h5>
                            <Badge bg="light" text="dark">v{selectedRole.row_version}</Badge>
                        </div>
                        <Row className="g-2 mb-3">
                            <Col md={9}>
                                <Form.Control
                                    value={selectedRole.display_name}
                                    disabled={selectedRole.is_system}
                                    onChange={(e) => onRoleDisplayNameChange(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Button onClick={onSaveName} disabled={saving || selectedRole.is_system} className="w-100">
                                    {t("tenant.roles.actions.save_name")}
                                </Button>
                            </Col>
                        </Row>
                        {selectedRole.is_system ? (
                            <Alert variant="light" className="py-2">
                                {t("tenant.roles.matrix.system_locked")}
                            </Alert>
                        ) : null}
                        <Table responsive bordered>
                            <thead>
                                <tr>
                                    <th>{t("tenant.roles.matrix.module")}</th>
                                    {actionColumns.map((action) => (
                                        <th key={action} className="text-center">{formatActionLabel(action)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {moduleRows.map(([moduleName, actions]) => (
                                    <tr key={moduleName}>
                                        <td className="fw-semibold">
                                            <div>{formatModuleLabel(moduleName)}</div>
                                            <small className="text-muted">{moduleName}</small>
                                        </td>
                                        {actionColumns.map((action) => {
                                            const supported = actions.includes(action);
                                            const permissionName = `${moduleName}.${action}`;

                                            return (
                                                <td key={permissionName} className="text-center align-middle">
                                                    {supported ? (
                                                        <Form.Check
                                                            type="checkbox"
                                                            className="d-inline-flex justify-content-center"
                                                            disabled={selectedRole.is_system}
                                                            checked={selectedPermissions.includes(permissionName)}
                                                            onChange={() => onTogglePermission(permissionName)}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onClose}>{t("tenant.roles.actions.close")}</Button>
                <Button onClick={onSavePermissions} disabled={saving || !selectedRole || selectedRole.is_system}>
                    {saving ? t("tenant.roles.actions.saving") : t("tenant.roles.actions.save_permissions")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
