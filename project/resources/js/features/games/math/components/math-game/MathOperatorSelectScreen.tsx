import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { MathConfigResponse } from "../../data/api/gamesApi";
import type { MathGameOperator, MathOperatorMetaMap } from "../../types";

type Props = {
    config: MathConfigResponse | null;
    operatorMeta: MathOperatorMetaMap;
    onSelect: (operator: MathGameOperator) => void;
};

const MathOperatorSelectScreen: React.FC<Props> = ({ config, operatorMeta, onSelect }) => {
    const { t } = useTranslation();

    return (
        <div className="text-center">
            <h2 className="fw-bold mb-2">{t("tenant.games.math.operator.heading")}</h2>
            <p className="text-muted mb-4">{t("tenant.games.math.operator.subheading")}</p>

            <Row className="g-3 g-md-4 justify-content-center">
                {(config?.operators ?? []).map((item) => {
                    const meta = operatorMeta[item.value];

                    return (
                        <Col xs={6} md={3} key={item.value}>
                            <Button
                                type="button"
                                variant="light"
                                className={`math-game__tile btn-lg border-0 ${meta.softClass}`}
                                aria-label={meta.label}
                                onClick={() => onSelect(item.value)}
                            >
                                <i className={`${meta.iconClass} display-4 ${meta.textClass} fw-bold`} />
                                <span className={`small fw-bold d-block mt-2 ${meta.textClass}`}>{meta.label}</span>
                            </Button>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default MathOperatorSelectScreen;
