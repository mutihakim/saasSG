import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

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

const operatorOrder: MathGameOperator[] = ["+", "-", "*", "/"];

const MathGameSettingsPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);

    const operatorButtons: Array<{ value: MathGameOperator; label: string }> = useMemo(() => [
        { value: "+", label: t("tenant.games.math.operator.addition") },
        { value: "-", label: t("tenant.games.math.operator.subtraction") },
        { value: "*", label: t("tenant.games.math.operator.multiplication") },
        { value: "/", label: t("tenant.games.math.operator.division") },
    ], [t]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState<MathGameOperator>("+");
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

    const handleOperatorChange = (op: MathGameOperator) => {
        setSelectedOperator(op);
        loadOperatorSettings(op);
    };

    const handleSave = async () => {
        setIsSaving(true);

        const payload: MathGameSettingPayload = {
            operator: selectedOperator,
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
                [selectedOperator]: {
                    operator: selectedOperator,
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
            <div className="game-setup-card h-100">
                {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center flex-grow-1 py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <>
                        <div className="game-setup-content game-setup-inner-content pb-5">
                            {/* Selector Operator */}
                            <section className="game-setup-section mb-3">
                                <label className="game-setup-label mb-2">
                                    {t("tenant.games.settings.select_operator")}
                                </label>
                                <div className="game-lang-container">
                                    {operatorButtons.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`game-lang-btn ${selectedOperator === item.value ? "active" : ""}`}
                                            onClick={() => handleOperatorChange(item.value)}
                                        >
                                            <span className="fw-bold" style={{ fontSize: '1.2rem' }}>
                                                {item.value === "*" ? "×" : item.value}
                                            </span>
                                            <span className="ms-2 d-none d-md-inline">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Default mode */}
                            <section className="game-setup-section mb-3">
                                <label className="game-setup-label">{t("tenant.games.settings.default_mode")}</label>
                                <div className="game-mode-container">
                                    <button type="button" className={`game-mode-btn ${defaultMode === "mencariC" ? "active" : ""}`} onClick={() => setDefaultMode("mencariC")}>
                                        {t("tenant.games.math.mode.mencariC")}
                                    </button>
                                    <button type="button" className={`game-mode-btn ${defaultMode === "mencariB" ? "active" : ""}`} onClick={() => setDefaultMode("mencariB")}>
                                        {t("tenant.games.math.mode.mencariB")}
                                    </button>
                                    <div className={`game-mode-slider ${defaultMode === "mencariB" ? "is-mencariB" : "is-mencariC"} has-two-options`} />
                                </div>
                            </section>

                            {/* Settings grid */}
                            <div className="game-setup-grid mb-3">
                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.settings.mastered_threshold")}</label>
                                    <div className="game-setup-chip-row">
                                        {[3, 5, 8, 10, 15, 20].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${masteredThreshold === value ? "is-active" : ""}`} onClick={() => setMasteredThreshold(value)}>
                                                {value}x
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.settings.default_question_count")}</label>
                                    <div className="game-setup-chip-row">
                                        {[5, 10, 15, 20].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${defaultQuestionCount === value ? "is-active" : ""}`} onClick={() => setDefaultQuestionCount(value)}>
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.settings.default_time_limit")}</label>
                                    <div className="game-setup-chip-row">
                                        {[2, 3, 5, 8, 10, 15].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${defaultTimeLimit === value ? "is-active" : ""}`} onClick={() => setDefaultTimeLimit(value)}>
                                                {value}s
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!isLoading && (
                <div 
                    className="game-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 d-flex justify-content-center"
                    style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="w-100 game-start-floating__inner">
                        <button
                            type="button"
                            className="btn game-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                        >
                            {isSaving
                                ? t("tenant.games.settings.saving")
                                : <>{t("tenant.games.settings.save")} 💾</>}
                        </button>
                    </div>
                </div>
            )}
        </MathGameLayout>
    );
};

(MathGameSettingsPage as any).layout = null;

export default MathGameSettingsPage;
