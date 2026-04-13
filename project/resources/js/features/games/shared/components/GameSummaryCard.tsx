import React from "react";
import { Button, Card, Col, Row } from "react-bootstrap";

type SummaryMetric = {
    value: string | number;
    label: string;
    cardClassName: string;
    valueClassName: string;
};

type GameSummaryAction = {
    label: string;
    onClick: () => void;
    variant?: string;
    disabled?: boolean;
};

type GameSummaryCardProps = {
    title: string;
    metrics: SummaryMetric[];
    actions?: GameSummaryAction[];
    children?: React.ReactNode;
};

const GameSummaryCard: React.FC<GameSummaryCardProps> = ({ title, metrics, actions = [], children }) => (
    <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pb-0">
            <h5 className="fw-bold mb-0">{title}</h5>
        </Card.Header>
        <Card.Body className="d-flex flex-column gap-3">
            <Row className="g-3">
                {metrics.map((metric) => (
                    <Col md={12 / Math.max(1, metrics.length)} key={`${metric.label}-${metric.value}`}>
                        <div className={`rounded-3 p-3 text-center h-100 ${metric.cardClassName}`}>
                            <div className={`fs-3 fw-bold ${metric.valueClassName}`}>{metric.value}</div>
                            <div className="small text-muted">{metric.label}</div>
                        </div>
                    </Col>
                ))}
            </Row>

            {children}

            {actions.length > 0 && (
                <div className="d-flex justify-content-end gap-2">
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            variant={action.variant ?? "primary"}
                            disabled={action.disabled}
                            onClick={action.onClick}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </Card.Body>
    </Card>
);

export default GameSummaryCard;
