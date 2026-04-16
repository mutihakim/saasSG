import React from "react";
import { useTranslation } from "react-i18next";

import type { VocabularyCategoryOption, VocabularyLanguage, VocabularyMode } from "../types";

import CategorySelector from "./CategorySelector";

type Props = {
    language: VocabularyLanguage;
    mode: VocabularyMode;
    selectedCategory: string;
    selectedDay: number;
    autoTts: boolean;
    timeLimit: number;
    translationDirection: "id_to_target" | "target_to_id";
    daysForCategory: number[];
    masteredDaysForCategory: number[];
    hasCategories: boolean;
    hasDaysInSelectedCategory: boolean;
    categoryOptions: VocabularyCategoryOption[];
    isStartingSession: boolean;
    onLanguageChange: (language: VocabularyLanguage) => void;
    onModeChange: (mode: VocabularyMode) => void;
    onCategorySelect: (category: string) => void;
    onDayChange: (day: number) => void;
    onAutoTtsChange: (enabled: boolean) => void;
    onTimeLimitChange: (seconds: number) => void;
    onTranslationDirectionChange: (direction: "id_to_target" | "target_to_id") => void;
    onStart: () => void;
};

const VocabularySetupScreen: React.FC<Props> = ({
    language,
    mode,
    selectedCategory,
    selectedDay,
    autoTts,
    timeLimit,
    translationDirection,
    daysForCategory,
    masteredDaysForCategory,
    hasCategories,
    hasDaysInSelectedCategory,
    categoryOptions,
    isStartingSession,
    onLanguageChange,
    onModeChange,
    onCategorySelect,
    onDayChange,
    onAutoTtsChange,
    onStart,
}) => {
    const { t } = useTranslation();

    const directionLabel = translationDirection === "id_to_target"
        ? t("tenant.games.vocabulary.setup.direction_id_to_target")
        : t("tenant.games.vocabulary.setup.direction_target_to_id");

    return (
        <>
        <div className="vocab-setup-card d-flex flex-column h-100">
            <div className="vocab-setup-content vocab-inner-content pb-5">

                <div className="mb-2">
                        <label className="d-block text-sm text-gray-600 mb-1 font-medium small fw-semibold text-muted">{t("tenant.games.vocabulary.setup.language")}</label>
                        <div className="vocab-lang-container">
                            <button type="button" className={`vocab-lang-btn ${language === "english" ? "active" : ""}`} onClick={() => onLanguageChange("english")}>
                                <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="English" className="rounded-1" />
                                <span className="d-none d-md-inline">{t("tenant.games.vocabulary.setup.language_en")}</span>
                                <span className="d-md-none">{t("tenant.games.vocabulary.setup.language_en").substring(0, 3)}</span>
                            </button>
                            <button type="button" className={`vocab-lang-btn ${language === "arabic" ? "active" : ""}`} onClick={() => onLanguageChange("arabic")}>
                                <img src="https://flagcdn.com/w20/sa.png" srcSet="https://flagcdn.com/w40/sa.png 2x" width="20" alt="Arabic" className="rounded-1" />
                                <span className="d-none d-md-inline">{t("tenant.games.vocabulary.setup.language_ar")}</span>
                                <span className="d-md-none">{t("tenant.games.vocabulary.setup.language_ar").substring(0, 3)}</span>
                            </button>
                            <button type="button" className={`vocab-lang-btn ${language === "mandarin" ? "active" : ""}`} onClick={() => onLanguageChange("mandarin")}>
                                <img src="https://flagcdn.com/w20/cn.png" srcSet="https://flagcdn.com/w40/cn.png 2x" width="20" alt={t("tenant.games.vocabulary.setup.language_zh")} className="rounded-1" />
                                <span className="d-none d-md-inline">{t("tenant.games.vocabulary.setup.language_zh")}</span>
                                <span className="d-md-none">{t("tenant.games.vocabulary.setup.language_zh").substring(0, 3)}</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-2 mt-2">
                        <label className="d-block text-sm text-gray-600 mb-1 font-medium small fw-semibold text-muted">{t("tenant.games.vocabulary.setup.day")}</label>
                        <div className="vocab-day-container">
                            <button type="button" className="vocab-day-arrow" onClick={() => { document.getElementById('vocab-day-scroll')?.scrollBy({left: -150, behavior: 'smooth'}); }}>
                                <i className="ri-arrow-left-s-line fs-5" />
                            </button>
                            <div className="vocab-day-scroll" id="vocab-day-scroll">
                                {!selectedCategory && <div className="text-muted small py-1">{t("tenant.games.vocabulary.setup.pick_category_first")}</div>}
                                {selectedCategory && !hasDaysInSelectedCategory && <div className="text-muted small py-1">{t("tenant.games.vocabulary.setup.no_days")}</div>}
                                {daysForCategory.map((day) => {
                                    const isMastered = masteredDaysForCategory.includes(day);
                                    return (
                                        <button key={day} type="button" className={`vocab-day-btn ${selectedDay === day ? "active" : ""} position-relative`} onClick={() => onDayChange(day)}>
                                            {t("tenant.games.vocabulary.setup.day_value", { day })}
                                            {isMastered && (
                                                <span className="vocab-day-trophy pe-none" aria-hidden="true">🏆</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <button type="button" className="vocab-day-arrow" onClick={() => { document.getElementById('vocab-day-scroll')?.scrollBy({left: 150, behavior: 'smooth'}); }}>
                                <i className="ri-arrow-right-s-line fs-5" />
                            </button>
                        </div>
                    </div>

                    <div className="mb-2 mt-2">
                        <label className="d-block text-sm text-gray-600 mb-1 font-medium small fw-semibold text-muted">{t("tenant.games.vocabulary.setup.mode")}</label>
                        <div className="vocab-mode-container">
                            <button type="button" className={`vocab-mode-btn ${mode === "practice" ? "active" : ""}`} onClick={() => onModeChange("practice")}>
                                Practice (Kuis)
                            </button>
                            <button type="button" className={`vocab-mode-btn ${mode === "learn" ? "active" : ""}`} onClick={() => onModeChange("learn")}>
                                Review
                            </button>
                            {mode === "memory_test" && (
                                <button type="button" className={`vocab-mode-btn ${mode === "memory_test" ? "active" : ""}`} onClick={() => onModeChange("memory_test")}>
                                    Memory
                                </button>
                            )}
                            <div className={`vocab-mode-slider ${mode === "learn" ? "is-learn" : mode === "memory_test" ? "is-memory-test" : "is-practice"} ${mode === "memory_test" ? "has-three-options" : "has-two-options"}`} />
                        </div>
                    </div>

                    <div className="mt-2 text-start">
                        <label className="d-block text-sm text-gray-800 mb-1 font-medium small fw-semibold text-muted">{t("tenant.games.vocabulary.category.title")}</label>
                        <CategorySelector
                            categories={categoryOptions}
                            selected={selectedCategory || null}
                            onSelect={onCategorySelect}
                        />
                        {!hasCategories && (
                            <div className="alert alert-warning py-2 mb-0 mt-2">
                                {t("tenant.games.vocabulary.setup.no_data_alert")}
                            </div>
                        )}
                    </div>

                    <div className="vocab-bottom-controls-v2 mt-3 pt-3 border-top pb-5 mb-5 pb-md-0 mb-md-0">
                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onAutoTtsChange(!autoTts)}
                                className={`vocab-switch ${autoTts ? 'on' : 'off'}`}
                                aria-label="Toggle Auto TTS"
                            >
                                <div className={`vocab-switch-thumb ${autoTts ? 'on' : 'off'}`} />
                            </button>
                            <span className="text-sm font-medium small text-muted text-dark text-nowrap">Read options when selected</span>
                        </div>

                        <div className="vocab-bottom-meta d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-pill small flex-nowrap text-nowrap">
                            <span className="text-muted d-flex align-items-center gap-1">
                                <i className="ri-timer-line text-success" />
                                <span className="vocab-bottom-meta__value">{t("tenant.games.vocabulary.setup.timer_label", { seconds: timeLimit })}</span>
                            </span>
                            <span className="text-muted">|</span>
                            <span className="text-muted d-flex align-items-center gap-1">
                                <i className="ri-arrow-left-right-line text-success" />
                                <span className="vocab-bottom-meta__value">{t("tenant.games.vocabulary.setup.direction_label", { direction: directionLabel })}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        <div 
            className="vocab-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 p-md-5 d-flex justify-content-center"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
            <div className="w-100 vocab-start-floating__inner">
                <button
                    type="button"
                    className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={onStart}
                    disabled={isStartingSession || !selectedCategory || !hasDaysInSelectedCategory}
                >
                    {isStartingSession
                        ? t("tenant.games.vocabulary.setup.starting")
                        : mode === "learn"
                            ? <>{t("tenant.games.vocabulary.setup.start_learn")} 🚀</>
                            : mode === "memory_test"
                                ? <>{t("tenant.games.vocabulary.setup.start_memory_test")} 🧠</>
                                : <>{t("tenant.games.vocabulary.setup.start_practice")} 🚀</>}
                </button>
            </div>
        </div>
        </>
    );
};

export default VocabularySetupScreen;
