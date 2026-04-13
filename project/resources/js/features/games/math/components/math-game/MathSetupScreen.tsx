import React, { type Dispatch, type SetStateAction, useMemo } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select, { type SingleValue } from "react-select";

import type { MathGameSetupState, MathOperatorMetaMap, Option } from "../../types";
import { buildNumberGrid, findOption } from "../../utils/mathGame";

type Props = {
    setup: MathGameSetupState;
    rangeOptions: number[];
    operatorMeta: MathOperatorMetaMap;
    isStarting: boolean;
    setSetup: Dispatch<SetStateAction<MathGameSetupState | null>>;
    onBack: () => void;
    onStart: (setup: MathGameSetupState) => void;
};

const MathSetupScreen: React.FC<Props> = ({
    setup,
    rangeOptions,
    operatorMeta,
    isStarting,
    setSetup,
    onBack,
    onStart,
}) => {
    const { t } = useTranslation();
    const activeOperatorMeta = operatorMeta[setup.operator];
    const numberGrid = useMemo(() => buildNumberGrid(setup.numberRangeStart), [setup.numberRangeStart]);
    const rangeSelectOptions = useMemo<Option<number>[]>(() => (
        rangeOptions.map((num) => ({ value: num, label: `${num} - ${num + 9}` }))
    ), [rangeOptions]);

    const handleNumberRangeStartChange = (option: SingleValue<Option<number>>) => {
        if (!option) {
            return;
        }

        setSetup((prev) => (prev ? { ...prev, numberRangeStart: option.value, numberRange: option.value } : prev));
    };

    const handleRandomRangeChange = (option: SingleValue<Option<number>>) => {
        if (!option) {
            return;
        }

        setSetup((prev) => (prev ? { ...prev, randomRange: option.value } : prev));
    };

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <Button variant="light" size="sm" onClick={onBack}>
                        <i className="ri-arrow-left-line me-1" />
                        {t("tenant.games.math.setup.back_operator")}
                    </Button>
                    <div>
                        <h5 className={`mb-1 fw-bold ${activeOperatorMeta.textClass}`}>
                            {t("tenant.games.math.setup.title_prefix", { operator: activeOperatorMeta.label })}
                        </h5>
                        <p className="text-muted mb-0 small">{t("tenant.games.math.setup.subtitle")}</p>
                    </div>
                    <span className="badge bg-light text-muted">{t("tenant.games.math.setup.badge")}</span>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col xs={6}>
                        <label className="form-label">{t("tenant.games.math.setup.number_a")}</label>
                        <Select
                            classNamePrefix="react-select"
                            value={findOption(rangeSelectOptions, setup.numberRangeStart)}
                            options={rangeSelectOptions}
                            isSearchable={false}
                            onChange={handleNumberRangeStartChange}
                        />
                    </Col>
                    <Col xs={6}>
                        <label className="form-label">{t("tenant.games.math.setup.number_b")}</label>
                        <Select
                            classNamePrefix="react-select"
                            value={findOption(rangeSelectOptions, setup.randomRange)}
                            options={rangeSelectOptions}
                            isSearchable={false}
                            onChange={handleRandomRangeChange}
                        />
                    </Col>
                    <Col xs={12}>
                        <p className="text-muted small mb-0">{t("tenant.games.math.setup.number_grid_help")}</p>
                    </Col>
                </Row>

                <p className="text-muted text-center mb-3 mt-4">{t("tenant.games.math.setup.number_grid_help")}</p>
                <div className="row row-cols-5 g-3 justify-content-center">
                    {numberGrid.map((num) => (
                        <div className="col" key={num}>
                            <Button
                                type="button"
                                variant="light"
                                className={`math-game__number-tile w-100 ${activeOperatorMeta.softClass}`}
                                disabled={isStarting}
                                onClick={() => onStart({ ...setup, numberRange: num })}
                            >
                                {num}
                            </Button>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

export default MathSetupScreen;
