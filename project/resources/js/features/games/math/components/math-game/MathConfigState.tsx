import React from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type Props = {
    isLoading: boolean;
    loadFailed: boolean;
    onRetry: () => void;
};

const MathConfigState: React.FC<Props> = ({ isLoading, loadFailed, onRetry }) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <Card className="border-0 shadow-sm">
                <Card.Body className="d-flex align-items-center gap-2 py-4">
                    <Spinner animation="border" size="sm" />
                    <span>{t("tenant.games.math.loading_config")}</span>
                </Card.Body>
            </Card>
        );
    }

    if (loadFailed) {
        return (
            <Card className="border-0 shadow-sm">
                <Card.Body className="py-4 text-center">
                    <p className="text-muted mb-3">{t("tenant.games.math.load_failed")}</p>
                    <Button variant="primary" onClick={onRetry}>{t("tenant.games.math.reload")}</Button>
                </Card.Body>
            </Card>
        );
    }

    return null;
};

export default MathConfigState;
