import React from "react";
import { Button, Card, Form } from "react-bootstrap";

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
}) => (
    <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pb-0">
            <h5 className="mb-0 fw-bold">Setup Vocabulary</h5>
        </Card.Header>
        <Card.Body className="d-flex flex-column gap-3 vocab-setup-body">
            <div className="row g-3">
                <div className="col-md-4">
                    <Form.Label>Bahasa</Form.Label>
                    <Form.Select value={language} onChange={(e) => onLanguageChange(e.target.value as VocabularyLanguage)}>
                        <option value="english">Inggris</option>
                        <option value="arabic">Arab</option>
                    </Form.Select>
                </div>
                <div className="col-md-4">
                    <Form.Label>Hari</Form.Label>
                    <Form.Select
                        value={hasDaysInSelectedCategory ? String(selectedDay) : ""}
                        onChange={(e) => onDayChange(Number(e.target.value))}
                        disabled={!selectedCategory || !hasDaysInSelectedCategory}
                    >
                        {!selectedCategory && <option value="">Pilih kategori terlebih dahulu</option>}
                        {selectedCategory && !hasDaysInSelectedCategory && <option value="">Belum ada data hari di kategori ini</option>}
                        {daysForCategory.map((day) => (
                            <option key={day} value={day}>
                                Hari {day}
                            </option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-4">
                    <Form.Label>Mode</Form.Label>
                    <Form.Select value={mode} onChange={(e) => onModeChange(e.target.value as VocabularyMode)}>
                        <option value="learn">Learn (Flashcard)</option>
                        <option value="practice">Practice (Kuis)</option>
                        {mode === "memory_test" && <option value="memory_test">Tes Ingatan</option>}
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
                    Data kosakata belum tersedia. Jalankan import data sebelum memulai sesi.
                </div>
            )}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                        id="vocab-auto-tts"
                        label="Baca opsi saat dipilih"
                        checked={autoTts}
                        onChange={(e) => onAutoTtsChange(e.target.checked)}
                    />
                    <small className="text-muted align-self-center">
                        Timer: {timeLimit}s • Arah: {translationDirection === "id_to_target" ? "Indonesia -> Bahasa Pilihan" : "Bahasa Pilihan -> Indonesia"}
                    </small>
                </div>
                <Button
                    onClick={onStart}
                    disabled={isStartingSession || !selectedCategory || !hasDaysInSelectedCategory}
                >
                    {isStartingSession ? "Memulai..." : mode === "learn" ? "Mulai Learn" : mode === "memory_test" ? "Mulai Tes Ingatan" : "Mulai Practice"}
                </Button>
            </div>
        </Card.Body>
    </Card>
);

export default VocabularySetupScreen;
