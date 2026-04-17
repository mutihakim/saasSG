import React, { type Dispatch, type SetStateAction, useMemo } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select, { type SingleValue } from "react-select";

import type { MathGameOperator, MathGameSetupState, MathOperatorMetaMap, Option } from "../../types";
import { buildNumberGrid, findOption } from "../../utils/mathGame";

type Props = {
    setup: MathGameSetupState;
    rangeOptions: number[];
    operatorMeta: MathOperatorMetaMap;
    isStarting: boolean;
    setSetup: Dispatch<SetStateAction<MathGameSetupState | null>>;
    onStart: (setup: MathGameSetupState) => void;
};

const MathSetupScreen: React.FC<Props> = ({
    setup,
    rangeOptions,
    operatorMeta,
    isStarting,
    setSetup,
    onStart,
}) => {
    const { t } = useTranslation();
    const activeOperatorMeta = operatorMeta[setup.operator];
    const numberGrid = useMemo(() => buildNumberGrid(setup.numberRangeStart), [setup.numberRangeStart]);
    const rangeSelectOptions = useMemo<Option<number>[]>(() => (
        rangeOptions.map((num) => ({ value: num, label: `${num} - ${num + 9}` }))
    ), [rangeOptions]);

    const operators: MathGameOperator[] = ["+", "-", "*", "/"];

    const handleOperatorChange = (op: MathGameOperator) => {
        setSetup((prev) => (prev ? { ...prev, operator: op } : prev));
    };

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
            <Card.Body className="math-inner-content">
                {/* Operator Selector — Vocab Style Tabs */}
                <div className="game-lang-container mb-4">
                    {operators.map((op) => {
                        const meta = operatorMeta[op];
                        const isActive = setup.operator === op;
                        return (
                            <button
                                key={op}
                                type="button"
                                className={`game-lang-btn ${isActive ? "active" : ""}`}
                                onClick={() => handleOperatorChange(op)}
                            >
                                <span className={`fw-bold ${isActive ? meta.textClass : ""}`} style={{ fontSize: '1.2rem' }}>
                                    {op === "*" ? "×" : op}
                                </span>
                                <span className="ms-2 d-none d-md-inline">{meta.label}</span>
                            </button>
                        );
                    })}
                </div>

                <Row className="g-3">
                    <Col xs={6}>
                        <label className="form-label small fw-bold text-muted text-uppercase">{t("tenant.games.math.setup.number_a")}</label>
                        <Select
                            classNamePrefix="react-select"
                            value={findOption(rangeSelectOptions, setup.numberRangeStart)}
                            options={rangeSelectOptions}
                            isSearchable={false}
                            onChange={handleNumberRangeStartChange}
                        />
                    </Col>
                    <Col xs={6}>
                        <label className="form-label small fw-bold text-muted text-uppercase">{t("tenant.games.math.setup.number_b")}</label>
                        <Select
                            classNamePrefix="react-select"
                            value={findOption(rangeSelectOptions, setup.randomRange)}
                            options={rangeSelectOptions}
                            isSearchable={false}
                            onChange={handleRandomRangeChange}
                        />
                    </Col>
                </Row>

                <div className="text-center mb-3 mt-4">
                    <p className="text-muted small fw-bold text-uppercase mb-0">{t("tenant.games.math.setup.number_grid_help")}</p>
                </div>
                
                <div className="row row-cols-5 g-3 justify-content-center">
                    {numberGrid.map((num) => (
                        <div className="col" key={num}>
                            <Button
                                type="button"
                                variant="light"
                                className={`math-game__number-tile w-100 py-3 fw-bold fs-5 ${activeOperatorMeta.softClass}`}
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
