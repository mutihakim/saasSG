import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CurriculumLayout from "../components/CurriculumLayout";
import { createCurriculumApi, type CurriculumSetting } from "../data/api/curriculumApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

type CurriculumMode = "learn" | "practice";

const CurriculumSettingsPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createCurriculumApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [defaultMode, setDefaultMode] = useState<CurriculumMode>("practice");
    const [masteredThreshold, setMasteredThreshold] = useState(8);
    const [defaultQuestionCount, setDefaultQuestionCount] = useState(6);
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(8);

    const grades = [1, 2, 3, 4, 5, 6];

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const settings = await api.fetchSettings();
                if (cancelled) return;

                setSelectedGrade(settings.grade ?? 1);
                setDefaultMode(settings.default_mode as CurriculumMode ?? "practice");
                setMasteredThreshold(settings.mastered_threshold ?? 8);
                setDefaultQuestionCount(settings.default_question_count ?? 6);
                setDefaultTimeLimit(settings.default_time_limit ?? 8);
            } catch {
                if (!cancelled) {
                    notify.error(t("tenant.games.curriculum.settings.load_error", "Failed to load settings."));
                }
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: CurriculumSetting = {
                grade: selectedGrade,
                default_mode: defaultMode,
                default_question_count: defaultQuestionCount,
                default_time_limit: defaultTimeLimit,
                mastered_threshold: masteredThreshold,
            };
            await api.updateSettings(payload);
            notify.success(t("tenant.games.curriculum.settings.save_success", "Settings saved successfully."));
        } catch {
            notify.error(t("tenant.games.curriculum.settings.save_error", "Failed to save settings."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CurriculumLayout
            title={t("tenant.games.curriculum.settings.title", "Curriculum Settings")}
            menuKey="settings"
            memberName={member?.full_name ?? member?.name ?? undefined}
        >
            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <div className="vocab-setup-card">
                        {isLoading ? (
                            <div className="d-flex justify-content-center align-items-center flex-grow-1 py-5">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        ) : (
                            <>
                                <div className="vocab-setup-content vocab-inner-content pb-5">
                                    <section className="vocab-settings-section mb-3">
                                        <label className="vocab-settings-label mb-2">{t("tenant.games.curriculum.setup.grade", "Kelas")}</label>
                                        <div className="vocab-lang-container d-flex flex-wrap gap-2">
                                            {grades.map((grade) => (
                                                <button
                                                    key={grade}
                                                    type="button"
                                                    className={`vocab-lang-btn ${selectedGrade === grade ? "active" : ""}`}
                                                    onClick={() => setSelectedGrade(grade)}
                                                    style={{ minWidth: '60px', justifyContent: 'center' }}
                                                >
                                                    <span>{grade}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="vocab-settings-section mb-3">
                                        <label className="vocab-settings-label">{t("tenant.games.curriculum.settings.mode_label", "Default Mode")}</label>
                                        <div className="vocab-mode-container">
                                            <button type="button" className={`vocab-mode-btn ${defaultMode === "practice" ? "active" : ""}`} onClick={() => setDefaultMode("practice")}>
                                                {t("tenant.games.vocabulary.setup.mode_practice", "Practice")}
                                            </button>
                                            <button type="button" className={`vocab-mode-btn ${defaultMode === "learn" ? "active" : ""}`} onClick={() => setDefaultMode("learn")}>
                                                {t("tenant.games.vocabulary.setup.mode_learn", "Learn")}
                                            </button>
                                            <div className={`vocab-mode-slider ${defaultMode === "learn" ? "is-learn" : "is-practice"} has-two-options`} />
                                        </div>
                                    </section>

                                    <div className="vocab-settings-grid mb-3">
                                        <section className="vocab-settings-section">
                                            <label className="vocab-settings-label">{t("tenant.games.curriculum.settings.mastered_threshold_label", "Mastered Threshold")}</label>
                                            <div className="vocab-settings-chip-row">
                                                {[3, 5, 8, 10, 12, 15].map((value) => (
                                                    <button key={value} type="button" className={`vocab-settings-chip ${masteredThreshold === value ? "is-active" : ""}`} onClick={() => setMasteredThreshold(value)}>
                                                        {value}x
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="vocab-settings-section">
                                            <label className="vocab-settings-label">{t("tenant.games.curriculum.settings.question_count_label", "Default Question Count")}</label>
                                            <div className="vocab-settings-chip-row">
                                                {[6, 12, 18, 24].map((value) => (
                                                    <button key={value} type="button" className={`vocab-settings-chip ${defaultQuestionCount === value ? "is-active" : ""}`} onClick={() => setDefaultQuestionCount(value)}>
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="vocab-settings-section">
                                            <label className="vocab-settings-label">{t("tenant.games.curriculum.settings.time_limit_label", "Default Timer")}</label>
                                            <div className="vocab-settings-chip-row">
                                                {[2, 3, 5, 8, 10, 15].map((value) => (
                                                    <button key={value} type="button" className={`vocab-settings-chip ${defaultTimeLimit === value ? "is-active" : ""}`} onClick={() => setDefaultTimeLimit(value)}>
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
                            className="vocab-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 d-flex justify-content-center"
                            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                        >
                            <div className="w-100 vocab-start-floating__inner">
                                <button
                                    type="button"
                                    className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => void handleSave()}
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? t("tenant.games.curriculum.settings.saving_button", "Saving...")
                                        : <>{t("tenant.games.curriculum.settings.save_button", "Save Settings")} 💾</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CurriculumLayout>
    );
};

(CurriculumSettingsPage as any).layout = null;

export default CurriculumSettingsPage;
