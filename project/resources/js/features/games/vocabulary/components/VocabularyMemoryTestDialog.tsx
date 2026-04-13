import React from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type Props = {
    show: boolean;
    onClose: () => void;
    onStart: () => void;
};

const VocabularyMemoryTestDialog: React.FC<Props> = ({ show, onClose, onStart }) => {
    const { t } = useTranslation();

    return (
        <Modal show={show} onHide={onClose} centered backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">{t("tenant.games.math.memory_test.title")}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2 text-center">
                <i className="ri-medal-2-fill display-1 text-warning mb-3"></i>
                <p className="mb-4">
                    {t("tenant.games.math.memory_test.prompt_prefix")} <strong>{t("tenant.games.math.memory_test.name")}</strong>?
                </p>
                <p className="text-muted small">{t("tenant.games.math.memory_test.description")}</p>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 justify-content-center gap-2">
                <Button variant="light" onClick={onClose}>{t("tenant.games.math.memory_test.later")}</Button>
                <Button variant="primary" onClick={onStart}>{t("tenant.games.math.memory_test.start")}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default VocabularyMemoryTestDialog;
