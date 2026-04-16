import type { Dispatch, SetStateAction } from "react";

import type {
    VocabularyConfigResponse,
    VocabularyLanguage,
    VocabularyMode,
    VocabularyProgressDto,
    VocabularyTranslationDirection,
    VocabularyWordDto,
} from "./data/api/vocabularyApi";

export type {
    VocabularyConfigResponse,
    VocabularyLanguage,
    VocabularyMode,
    VocabularyProgressDto,
    VocabularyTranslationDirection,
    VocabularyWordDto,
};

export type VocabularyPhase = "setup" | "learn" | "practice" | "summary";

export type VocabularyAttemptResult = {
    wordId: number;
    prompt: string;
    correctAnswer: string;
    selectedAnswer: string;
    isCorrect: boolean;
    isTimedOut?: boolean;
    streakAfter: number;
};

export type VocabularyFeedbackState = {
    show: boolean;
    isCorrect: boolean;
    isTimedOut?: boolean;
    message: string;
    correctAnswer?: string | null;
    correctAnswerPhonetic?: string | null;
};

export type VocabularyCategoryOption = {
    key: string;
    label: string;
    count: number;
};

export type VocabularyOption = {
    text: string;
    phonetic: string | null;
};

export type VocabularySettingsMap = Record<string, {
    default_mode: VocabularyMode;
    default_question_count: number;
    mastered_threshold: number;
    default_time_limit: number;
    auto_tts: boolean;
    translation_direction: VocabularyTranslationDirection;
}>;

export type VocabularyPageMember = {
    full_name?: string | null;
    name?: string | null;
} | null | undefined;

export type VocabularyController = {
    isLoadingConfig: boolean;
    config: VocabularyConfigResponse | null;
    settingsMap: VocabularySettingsMap;
    phase: VocabularyPhase;
    language: VocabularyLanguage;
    mode: VocabularyMode;
    selectedCategory: string;
    selectedDay: number;
    autoTts: boolean;
    questionCount: number;
    sessionQuestionTarget: number;
    timeLimit: number;
    translationDirection: VocabularyTranslationDirection;
    masteredThreshold: number;
    dayWords: VocabularyWordDto[];
    poolWords: VocabularyWordDto[];
    progressMap: Record<string, VocabularyProgressDto>;
    learnIndex: number;
    isFlipped: boolean;
    practiceOptions: VocabularyOption[];
    selectedOption: number | null;
    correctOption: number | null;
    isAnswerLocked: boolean;
    attempts: VocabularyAttemptResult[];
    isStartingSession: boolean;
    startedAt: number | null;
    isSavingSummary: boolean;
    countdownState: "yellow" | "green" | null;
    timeRemaining: number;
    feedbackState: VocabularyFeedbackState;
    voiceEnabled: boolean;
    categoryOptions: VocabularyCategoryOption[];
    daysForCategory: number[];
    masteredDaysForCategory: number[];
    hasCategories: boolean;
    hasDaysInSelectedCategory: boolean;
    currentLearnWord: VocabularyWordDto | null;
    currentPracticeWord: VocabularyWordDto | null;
    currentStreak: number;
    bestStreak: number;
    selectedCategoryLabel: string;
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
    isLevelMastered: boolean;
    isSessionActive: boolean;
    isMemoryTest: boolean;
    showMemoryTestDialog: boolean;
    setShowMemoryTestDialog: Dispatch<SetStateAction<boolean>>;
    setLanguage: (language: VocabularyLanguage) => void;
    setMode: (mode: VocabularyMode) => void;
    setSelectedCategory: (category: string) => void;
    setSelectedDay: (day: number) => void;
    setAutoTts: (enabled: boolean) => void;
    setTimeLimit: (seconds: number) => void;
    setTranslationDirection: (direction: VocabularyTranslationDirection) => void;
    setLearnIndex: Dispatch<SetStateAction<number>>;
    setIsFlipped: Dispatch<SetStateAction<boolean>>;
    handleFeedbackDone: () => void;
    startLearnMode: () => Promise<void>;
    startPracticeMode: (forceMemoryTest?: boolean) => Promise<void>;
    startMemoryTest: () => Promise<void>;
    submitPracticeAnswer: (selectedIdx: number) => Promise<void>;
    continuePractice: () => void;
    leaveToSetup: () => void;
    pronounce: (text: string, lang: string) => void;
};
