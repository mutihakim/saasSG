import React from "react";
import { Button, Card, Form } from "react-bootstrap";
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
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
                <h5 className="mb-0 fw-bold">{t("tenant.games.vocabulary.setup.title")}</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column gap-3 vocab-setup-body">
                <div className="row g-3">
                    <div className="col-md-4">
                        <Form.Label>{t("tenant.games.vocabulary.setup.language")}</Form.Label>
                        <Form.Select value={language} onChange={(e) => onLanguageChange(e.target.value as VocabularyLanguage)}>
                            <option value="english">{t("tenant.games.vocabulary.setup.language_en")}</option>
                            <option value="arabic">{t("tenant.games.vocabulary.setup.language_ar")}</option>
                        </Form.Select>
                    </div>
                    <div className="col-md-4">
                        <Form.Label>{t("tenant.games.vocabulary.setup.day")}</Form.Label>
                        <Form.Select
                            value={hasDaysInSelectedCategory ? String(selectedDay) : ""}
                            onChange={(e) => onDayChange(Number(e.target.value))}
                            disabled={!selectedCategory || !hasDaysInSelectedCategory}
                        >
                            {!selectedCategory && <option value="">{t("tenant.games.vocabulary.setup.pick_category_first")}</option>}
                            {selectedCategory && !hasDaysInSelectedCategory && <option value="">{t("tenant.games.vocabulary.setup.no_days")}</option>}
                            {daysForCategory.map((day) => (
                                <option key={day} value={day}>
                                    {t("tenant.games.vocabulary.setup.day_value", { day })}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                    <div className="col-md-4">
                        <Form.Label>{t("tenant.games.vocabulary.setup.mode")}</Form.Label>
                        <Form.Select value={mode} onChange={(e) => onModeChange(e.target.value as VocabularyMode)}>
                            <option value="learn">{t("tenant.games.vocabulary.setup.mode_learn")}</option>
                            <option value="practice">{t("tenant.games.vocabulary.setup.mode_practice")}</option>
                            {mode === "memory_test" && <option value="memory_test">{t("tenant.games.vocabulary.setup.mode_memory_test")}</option>}
                        </Form.Select>
                    </div>
                </div>

                <CategorySelector
                    categories={categoryOptions}
                    selected={selectedCategory || null}
                    onSelect={onCategorySelect}
                />

                {!hasCategories && (
                    <div className="alert alert-warning py-2 mb-0">
                        {t("tenant.games.vocabulary.setup.no_data_alert")}
                    </div>
                )}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="d-flex flex-wrap gap-3">
                        <Form.Check
                            id="vocab-auto-tts"
                            label={t("tenant.games.vocabulary.setup.auto_tts")}
                            checked={autoTts}
                            onChange={(e) => onAutoTtsChange(e.target.checked)}
                        />
                        <small className="text-muted align-self-center">
                            {t("tenant.games.vocabulary.setup.timer_label", { seconds: timeLimit })} • {t("tenant.games.vocabulary.setup.direction_label", { direction: directionLabel })}
                        </small>
                    </div>
                    <Button
                        onClick={onStart}
                        disabled={isStartingSession || !selectedCategory || !hasDaysInSelectedCategory}
                    >
                        {isStartingSession 
                            ? t("tenant.games.vocabulary.setup.starting") 
                            : mode === "learn" 
                                ? t("tenant.games.vocabulary.setup.start_learn") 
                                : mode === "memory_test" 
                                    ? t("tenant.games.vocabulary.setup.start_memory_test") 
                                    : t("tenant.games.vocabulary.setup.start_practice")}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default VocabularySetupScreen;
