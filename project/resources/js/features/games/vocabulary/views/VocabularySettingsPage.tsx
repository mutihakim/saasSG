import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import VocabularyLayout from "../components/VocabularyLayout";
import {
    createVocabularyApi,
    type VocabularyLanguage,
    type VocabularyMode,
    type VocabularySetting,
    type VocabularyTranslationDirection,
} from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const VocabularySettingsPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<VocabularyLanguage>("english");
    const [settingsMap, setSettingsMap] = useState<Record<VocabularyLanguage, VocabularySetting | null>>({
        english: null,
        arabic: null,
        mandarin: null,
    });

    const [defaultMode, setDefaultMode] = useState<VocabularyMode>("learn");
    const [defaultQuestionCount, setDefaultQuestionCount] = useState(6);
    const [masteredThreshold, setMasteredThreshold] = useState(8);
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(8);
    const [autoTts, setAutoTts] = useState(true);
    const [translationDirection, setTranslationDirection] = useState<VocabularyTranslationDirection>("id_to_target");

    const languageButtons: Array<{ value: VocabularyLanguage; label: string; flag: string; shortLabel: string }> = [
        { value: "english", label: t("tenant.games.vocabulary.setup.language_en"), flag: "https://flagcdn.com/w20/us.png", shortLabel: "EN" },
        { value: "arabic", label: t("tenant.games.vocabulary.setup.language_ar"), flag: "https://flagcdn.com/w20/sa.png", shortLabel: "AR" },
        { value: "mandarin", label: t("tenant.games.vocabulary.setup.language_zh"), flag: "https://flagcdn.com/w20/cn.png", shortLabel: "ZH" },
    ];

    const targetLanguageShortLabel = selectedLanguage === "english"
        ? "EN"
        : selectedLanguage === "arabic"
            ? "AR"
            : "ZH";

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const [configResponse, rows] = await Promise.all([
                    api.fetchConfig(),
                    api.fetchSettings(),
                ]);

                if (cancelled) {
                    return;
                }

                const nextMap: Record<VocabularyLanguage, VocabularySetting | null> = {
                    english: null,
                    arabic: null,
                    mandarin: null,
                };

                for (const row of rows) {
                    nextMap[row.language] = row;
                }

                setSettingsMap(nextMap);

                const initial = nextMap.english ?? {
                    language: "english",
                    default_mode: "learn",
                    default_question_count: configResponse.config.default_question_count ?? 6,
                    mastered_threshold: configResponse.config.default_mastered_threshold ?? 8,
                    default_time_limit: configResponse.config.default_time_limit ?? 8,
                    auto_tts: true,
                    translation_direction: "id_to_target",
                };

                setDefaultMode(initial.default_mode);
                setDefaultQuestionCount(initial.default_question_count);
                setMasteredThreshold(initial.mastered_threshold);
                setDefaultTimeLimit(initial.default_time_limit);
                setAutoTts(initial.auto_tts);
                setTranslationDirection(initial.translation_direction);
            } catch {
                notify.error(t("tenant.games.vocabulary.settings.load_error"));
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [api, t]);

    useEffect(() => {
        const current = settingsMap[selectedLanguage];
        if (!current) {
            setDefaultMode("learn");
            setDefaultQuestionCount(6);
            setMasteredThreshold(8);
            setDefaultTimeLimit(8);
            setAutoTts(true);
            setTranslationDirection("id_to_target");
            return;
        }

        setDefaultMode(current.default_mode);
        setDefaultQuestionCount(current.default_question_count);
        setMasteredThreshold(current.mastered_threshold);
        setDefaultTimeLimit(current.default_time_limit);
        setAutoTts(current.auto_tts);
        setTranslationDirection(current.translation_direction);
    }, [selectedLanguage, settingsMap]);

    const handleSave = async () => {
        setIsSaving(true);

        const payload: VocabularySetting = {
            language: selectedLanguage,
            default_mode: defaultMode,
            default_question_count: defaultQuestionCount,
            mastered_threshold: masteredThreshold,
            default_time_limit: defaultTimeLimit,
            auto_tts: autoTts,
            translation_direction: translationDirection,
        };

        try {
            await api.updateSettings(payload);
            setSettingsMap((prev) => ({ ...prev, [selectedLanguage]: payload }));
            notify.success(t("tenant.games.vocabulary.settings.save_success"));
        } catch {
            notify.error(t("tenant.games.vocabulary.settings.save_error"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <VocabularyLayout
            title={t("tenant.games.vocabulary.settings.title")}
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
                        {/* Konten settings — scrollable, pb-5 agar tidak tertutup floating button */}
                        <div className="game-setup-content game-setup-inner-content pb-5">

                            {/* Language selector */}
                            <section className="game-setup-section mb-3">
                                <label className="game-setup-label mb-2">{t("tenant.games.vocabulary.setup.language")}</label>
                                <div className="game-lang-container">
                                    {languageButtons.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`game-lang-btn ${selectedLanguage === item.value ? "active" : ""}`}
                                            onClick={() => setSelectedLanguage(item.value)}
                                        >
                                            <img src={item.flag} width="20" alt={item.label} className="rounded-1" />
                                            <span className="d-none d-md-inline">{item.label}</span>
                                            <span className="d-md-none">{item.shortLabel}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Default mode */}
                            <section className="game-setup-section mb-3">
                                <label className="game-setup-label">{t("tenant.games.vocabulary.settings.mode_label")}</label>
                                <div className="game-mode-container">
                                    <button type="button" className={`game-mode-btn ${defaultMode === "practice" ? "active" : ""}`} onClick={() => setDefaultMode("practice")}>
                                        {t("tenant.games.vocabulary.setup.mode_practice")}
                                    </button>
                                    <button type="button" className={`game-mode-btn ${defaultMode === "learn" ? "active" : ""}`} onClick={() => setDefaultMode("learn")}>
                                        {t("tenant.games.vocabulary.setup.mode_learn")}
                                    </button>
                                    <div className={`game-mode-slider ${defaultMode === "learn" ? "is-learn" : "is-practice"} has-two-options`} />
                                </div>
                            </section>

                            {/* Settings grid */}
                            <div className="game-setup-grid mb-3">
                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.vocabulary.settings.mastered_threshold_label")}</label>
                                    <div className="game-setup-chip-row">
                                        {[3, 5, 8, 10, 12, 15].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${masteredThreshold === value ? "is-active" : ""}`} onClick={() => setMasteredThreshold(value)}>
                                                {value}x
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.vocabulary.settings.question_count_label")}</label>
                                    <div className="game-setup-chip-row">
                                        {[6, 12, 18, 24].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${defaultQuestionCount === value ? "is-active" : ""}`} onClick={() => setDefaultQuestionCount(value)}>
                                                {value}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.vocabulary.settings.time_limit_label")}</label>
                                    <div className="game-setup-chip-row">
                                        {[2, 3, 5, 8, 10, 15].map((value) => (
                                            <button key={value} type="button" className={`game-setup-chip ${defaultTimeLimit === value ? "is-active" : ""}`} onClick={() => setDefaultTimeLimit(value)}>
                                                {t("tenant.games.vocabulary.settings.time_limit_value", { seconds: value })}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="game-setup-section">
                                    <label className="game-setup-label">{t("tenant.games.vocabulary.settings.translation_direction_label")}</label>
                                    <div className="game-setup-chip-row">
                                        <button
                                            type="button"
                                            className={`game-setup-chip game-setup-chip--wide ${translationDirection === "id_to_target" ? "is-active" : ""}`}
                                            onClick={() => setTranslationDirection("id_to_target")}
                                        >
                                            ID → {targetLanguageShortLabel}
                                        </button>
                                        <button
                                            type="button"
                                            className={`game-setup-chip game-setup-chip--wide ${translationDirection === "target_to_id" ? "is-active" : ""}`}
                                            onClick={() => setTranslationDirection("target_to_id")}
                                        >
                                            {targetLanguageShortLabel} → ID
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Auto TTS toggle */}
                            <section className="game-setup-section">
                                <button type="button" className={`game-setup-toggle-card ${autoTts ? "is-active" : ""}`} onClick={() => setAutoTts((prev) => !prev)}>
                                    <span className={`game-switch ${autoTts ? "on" : "off"}`}>
                                        <span className={`game-switch-thumb ${autoTts ? "on" : "off"}`} />
                                    </span>
                                    <span className="game-setup-toggle-copy">
                                        <strong>{autoTts ? t("tenant.games.vocabulary.settings.auto_tts_enabled") : t("tenant.games.vocabulary.settings.auto_tts_disabled")}</strong>
                                        <small>{t("tenant.games.vocabulary.settings.auto_tts_help")}</small>
                                    </span>
                                </button>
                            </section>

                        </div>
                    </>
                )}
            </div>

            {/* Tombol Save — identical ke pattern game-start-floating pada VocabularySetupScreen */}
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
                                ? t("tenant.games.vocabulary.settings.saving_button")
                                : <>{t("tenant.games.vocabulary.settings.save_button")} 💾</>}
                        </button>
                    </div>
                </div>
            )}
        </VocabularyLayout>
    );
};

(VocabularySettingsPage as any).layout = null;

export default VocabularySettingsPage;
