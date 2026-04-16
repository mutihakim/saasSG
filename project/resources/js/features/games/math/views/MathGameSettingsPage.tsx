import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import MathGameLayout from "../components/MathGameLayout";
import {
    createGamesApi,
    MathGameMode,
    MathGameOperator,
    MathGameSetting,
    MathGameSettingPayload,
} from "../data/api/gamesApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type Props = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

type OperatorOption = {
    value: MathGameOperator;
    label: string;
};

const operatorOrder: MathGameOperator[] = ["+", "-", "*", "/"];

const MathGameSettingsPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);

    const operatorOptions = useMemo<OperatorOption[]>(() => [
        { value: "+", label: `${t("tenant.games.math.operator.addition")} (+)` },
        { value: "-", label: `${t("tenant.games.math.operator.subtraction")} (-)` },
        { value: "*", label: `${t("tenant.games.math.operator.multiplication")} (x)` },
        { value: "/", label: `${t("tenant.games.math.operator.division")} (/)` },
    ], [t]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState<OperatorOption>(operatorOptions[0]);
    const [settings, setSettings] = useState<Record<MathGameOperator, MathGameSetting | null>>({
        "+": null,
        "-": null,
        "*": null,
        "/": null,
    });

    const [defaultMode, setDefaultMode] = useState<MathGameMode>("mencariC");
    const [defaultQuestionCount, setDefaultQuestionCount] = useState(10);
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(5);
    const [masteredThreshold, setMasteredThreshold] = useState(8);

    const questionCountOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const timeLimitOptions = [2, 3, 5, 10, 15, 20, 30, 45, 60];

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const allSettings = await gamesApi.fetchMathSettings();
                if (cancelled) return;

                const settingsMap: Record<MathGameOperator, MathGameSetting | null> = {
                    "+": null,
                    "-": null,
                    "*": null,
                    "/": null,
                };

                for (const setting of allSettings) {
                    settingsMap[setting.operator] = setting;
                }

                setSettings(settingsMap);

                // Load first operator settings
                const firstOp = operatorOrder[0];
                const firstSetting = settingsMap[firstOp];
                if (firstSetting) {
                    setDefaultMode(firstSetting.default_mode);
                    setDefaultQuestionCount(firstSetting.default_question_count);
                    setDefaultTimeLimit(firstSetting.default_time_limit);
                    setMasteredThreshold(firstSetting.mastered_threshold);
                }
            } catch {
                notify.error(t("tenant.games.settings.load_error_toast"));
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [gamesApi, t]);

    const loadOperatorSettings = useCallback((operator: MathGameOperator) => {
        const setting = settings[operator];
        if (setting) {
            setDefaultMode(setting.default_mode);
            setDefaultQuestionCount(setting.default_question_count);
            setDefaultTimeLimit(setting.default_time_limit);
            setMasteredThreshold(setting.mastered_threshold);
        } else {
            // Defaults when no setting exists yet
            setDefaultMode("mencariC");
            setDefaultQuestionCount(10);
            setDefaultTimeLimit(5);
            setMasteredThreshold(8);
        }
    }, [settings]);

    const handleOperatorChange = (option: OperatorOption | null) => {
        if (!option) return;
        setSelectedOperator(option);
        loadOperatorSettings(option.value);
    };

    const handleSave = async () => {
        setIsSaving(true);

        const payload: MathGameSettingPayload = {
            operator: selectedOperator.value,
            default_mode: defaultMode,
            default_question_count: defaultQuestionCount,
            default_time_limit: defaultTimeLimit,
            mastered_threshold: masteredThreshold,
        };

        try {
            await gamesApi.updateMathSettings(payload);

            // Update local state
            setSettings((prev) => ({
                ...prev,
                [selectedOperator.value]: {
                    operator: selectedOperator.value,
                    default_mode: defaultMode,
                    default_question_count: defaultQuestionCount,
                    default_time_limit: defaultTimeLimit,
                    mastered_threshold: masteredThreshold,
                },
            }));

            notify.success(t("tenant.games.settings.saved_toast"));
        } catch {
            notify.error(t("tenant.games.settings.save_error_toast"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <MathGameLayout
            title={t("tenant.games.settings.title")}
            menuKey="settings"
            memberName={member?.full_name ?? member?.name ?? undefined}
        >
            {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <Card>
                            <Card.Body>
                                <Row className="mb-4 align-items-center">
                                    <Col>
                                        <h5 className="fw-semibold mb-0">
                                            {t("tenant.games.settings.select_operator")}
                                        </h5>
                                    </Col>
                                    <Col xs="auto">
                                        <Select<OperatorOption>
                                            options={operatorOptions}
                                            value={selectedOperator}
                                            onChange={handleOperatorChange}
                                            menuPlacement="auto"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minWidth: 200,
                                                }),
                                            }}
                                        />
                                    </Col>
                                </Row>

                                <Form>
                                    {/* Game Mode */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold mb-2">
                                            {t("tenant.games.settings.default_mode")}
                                        </Form.Label>
                                        <Form.Text className="text-muted d-block mb-2">
                                            {t("tenant.games.settings.default_mode_desc")}
                                        </Form.Text>
                                        <div className="d-flex gap-3">
                                            <Form.Check
                                                type="radio"
                                                id="mode-mencariC"
                                                name="gameMode"
                                                label={t("tenant.games.math.mode.mencariC")}
                                                value="mencariC"
                                                checked={defaultMode === "mencariC"}
                                                onChange={() => setDefaultMode("mencariC")}
                                            />
                                            <Form.Check
                                                type="radio"
                                                id="mode-mencariB"
                                                name="gameMode"
                                                label={t("tenant.games.math.mode.mencariB")}
                                                value="mencariB"
                                                checked={defaultMode === "mencariB"}
                                                onChange={() => setDefaultMode("mencariB")}
                                            />
                                        </div>
                                    </Form.Group>

                                    {/* Question Count */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold mb-2">
                                            {t("tenant.games.settings.default_question_count")}
                                        </Form.Label>
                                        <Form.Text className="text-muted d-block mb-2">
                                            {t("tenant.games.settings.default_question_count_desc")}
                                        </Form.Text>
                                        <div className="d-flex flex-wrap gap-2">
                                            {questionCountOptions.map((count) => (
                                                <Button
                                                    key={count}
                                                    variant={
                                                        defaultQuestionCount === count
                                                            ? "primary"
                                                            : "outline-primary"
                                                    }
                                                    size="sm"
                                                    onClick={() => setDefaultQuestionCount(count)}
                                                >
                                                    {count}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>

                                    {/* Time Limit */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold mb-2">
                                            {t("tenant.games.settings.default_time_limit")}
                                        </Form.Label>
                                        <Form.Text className="text-muted d-block mb-2">
                                            {t("tenant.games.settings.default_time_limit_desc")}
                                        </Form.Text>
                                        <div className="d-flex flex-wrap gap-2">
                                            {timeLimitOptions.map((time) => (
                                                <Button
                                                    key={time}
                                                    variant={
                                                        defaultTimeLimit === time
                                                            ? "primary"
                                                            : "outline-primary"
                                                    }
                                                    size="sm"
                                                    onClick={() => setDefaultTimeLimit(time)}
                                                >
                                                    {time}s
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>

                                    {/* Mastered Threshold */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold mb-2">
                                            {t("tenant.games.settings.mastered_threshold")}
                                        </Form.Label>
                                        <Form.Text className="text-muted d-block mb-2">
                                            {t("tenant.games.settings.mastered_threshold_desc")}
                                        </Form.Text>
                                        <div className="d-flex align-items-center gap-3">
                                            <Form.Range
                                                className="games-flex-1"
                                                min={1}
                                                max={50}
                                                value={masteredThreshold}
                                                onChange={(e) =>
                                                    setMasteredThreshold(
                                                        parseInt(e.target.value, 10),
                                                    )
                                                }
                                            />
                                            <Badge bg="primary" className="fs-6 px-3 py-2">
                                                {masteredThreshold}x
                                            </Badge>
                                        </div>
                                    </Form.Group>

                                    {/* Save Button */}
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button
                                            variant="primary"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        className="me-2"
                                                    />
                                                    {t("tenant.games.settings.saving")}
                                                </>
                                            ) : (
                                                t("tenant.games.settings.save")
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </MathGameLayout>
    );
};

export default MathGameSettingsPage;
