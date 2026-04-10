import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import {
    applyPercentToExpression,
    appendCalculatorToken,
    evaluateCalculatorExpression,
    formatCalculatorExpression,
    normalizeCalculatorSeed,
    toggleCalculatorSign,
} from "@/core/lib/calculator";

interface MiniCalculatorProps {
    show: boolean;
    onClose: () => void;
    onCommit: (value: string) => void;
    value?: string | number | null;
    title?: string;
    currencyCode?: string;
}

const ACTION_KEYS = ["AC", "+/-", "%", "BACKSPACE"];
const NUMBER_KEYS = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", "00", ".", "+"],
];

const MiniCalculator = ({ show, onClose, onCommit, value, title, currencyCode }: MiniCalculatorProps) => {
    const { t } = useTranslation();
    const [expression, setExpression] = useState("");

    const [prevValue, setPrevValue] = useState<string | number | null | undefined>(undefined);

    if (!show && prevValue !== undefined) {
        setPrevValue(undefined);
    }

    if (show && value !== prevValue) {
        setPrevValue(value);
        setExpression(normalizeCalculatorSeed(value));
    }

    useEffect(() => {
        if (!show) {
            return;
        }

        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
            activeElement.blur();
        }
    }, [show]);

    const result = useMemo(() => evaluateCalculatorExpression(expression), [expression]);
    const hasExpression = expression.trim() !== "";
    const canCommit = result.status !== "invalid";

    const handleCommit = () => {
        if (!canCommit) {
            return;
        }

        onCommit(result.display);
        onClose();
    };

    const handleKeyPress = (key: string) => {
        switch (key) {
            case "AC":
                setExpression("");
                return;
            case "BACKSPACE":
                setExpression((prev) => prev.slice(0, -1));
                return;
            case "+/-":
                setExpression((prev) => toggleCalculatorSign(prev));
                return;
            case "%":
                setExpression((prev) => applyPercentToExpression(prev));
                return;
            default:
                setExpression((prev) => appendCalculatorToken(prev, key));
        }
    };

    const getButtonClassName = (key: string) => {
        if (key === "AC") {
            return "btn btn-soft-warning rounded-4 py-3 fw-semibold fs-5 border-0";
        }

        if (key === "BACKSPACE") {
            return "btn btn-soft-danger rounded-4 py-3 fw-semibold fs-5 border-0";
        }

        if (["+/-", "%"].includes(key)) {
            return "btn btn-soft-secondary rounded-4 py-3 fw-semibold fs-5 border-0";
        }

        if (["÷", "×", "-", "+"].includes(key)) {
            return "btn btn-soft-primary rounded-4 py-3 fw-semibold fs-4 border-0";
        }

        return "btn btn-light border rounded-4 py-3 fw-semibold fs-4 text-body";
    };

    return show ? (
        <div className="position-fixed start-0 end-0 top-0 bottom-0" style={{ zIndex: 1400 }} data-testid="mini-calculator">
            <div
                className="position-absolute start-0 end-0 top-0 bottom-0"
                style={{ backgroundColor: "rgba(15, 23, 42, 0.35)" }}
                onClick={onClose}
            />
            <div
                className="position-absolute start-0 end-0 bottom-0 bg-white rounded-top-5 shadow-lg border-top"
                style={{ minHeight: "min(560px, 78vh)", paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
            >
                <div className="px-3 pt-3 pb-2 border-bottom bg-body-tertiary">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <div className="fw-semibold fs-6 text-body">{title || t("finance.calculator.title")}</div>
                                <Badge className="rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
                                    Velzon
                                </Badge>
                            </div>
                            {currencyCode && <div className="small text-muted mt-1">{currencyCode}</div>}
                        </div>
                        <Button
                            type="button"
                            variant="light"
                            className="rounded-circle p-0 d-inline-flex align-items-center justify-content-center border"
                            style={{ width: 36, height: 36 }}
                            onClick={onClose}
                        >
                            <i className="ri-close-line" aria-hidden="true" />
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <Card className="border-0 shadow-sm bg-body-tertiary rounded-4">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className="badge bg-info-subtle text-info rounded-pill">
                                    {t("finance.calculator.result")}
                                </span>
                                {hasExpression ? (
                                    <span className="badge bg-light-subtle text-body rounded-pill border">
                                        {formatCalculatorExpression(expression)}
                                    </span>
                                ) : null}
                            </div>
                            <Form.Control
                                value={formatCalculatorExpression(expression)}
                                readOnly
                                inputMode="none"
                                placeholder={t("finance.calculator.placeholder")}
                                className="rounded-4 border-0 bg-white fs-3 fw-semibold text-end py-3 px-0 shadow-none text-body"
                            />
                            <div className={`fs-2 fw-bold text-end mt-2 ${result.status === "invalid" ? "text-danger" : "text-body"}`}>
                                {result.status === "invalid" ? t("finance.calculator.invalid") : result.display}
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="d-grid gap-2 mt-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                        {ACTION_KEYS.map((key) => (
                            <button
                                key={key}
                                type="button"
                                className={getButtonClassName(key)}
                                onClick={() => handleKeyPress(key)}
                                aria-label={key === "BACKSPACE" ? t("finance.calculator.backspace") : key}
                            >
                                {key === "BACKSPACE" ? <i className="ri-delete-back-2-line fs-5" aria-hidden="true" /> : key}
                            </button>
                        ))}
                    </div>

                    <div className="d-grid gap-2 mt-2">
                        {NUMBER_KEYS.map((row) => (
                            <div key={row.join("-")} className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                                {row.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={getButtonClassName(key)}
                                        onClick={() => handleKeyPress(key)}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="d-flex gap-2 mt-3">
                        <Button type="button" variant="light" className="rounded-4 py-3 flex-fill" onClick={onClose}>
                            {t("finance.shared.cancel")}
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            className="rounded-4 py-3 flex-fill"
                            onClick={handleCommit}
                            disabled={!canCommit}
                            data-testid="mini-calculator-apply"
                        >
                            {t("finance.calculator.apply")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;
};

export default MiniCalculator;
