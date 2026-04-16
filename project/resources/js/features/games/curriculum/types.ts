import type { Dispatch, SetStateAction } from "react";

import type {
    CurriculumAttemptResult as CurriculumAttemptResponse,
    CurriculumQuestion,
    CurriculumUnit,
} from "./data/api/curriculumApi";

export type {
    CurriculumQuestion,
    CurriculumUnit,
};

export type CurriculumPhase = "setup" | "practice" | "summary";

export type CurriculumPageMember = {
    full_name?: string | null;
    name?: string | null;
} | null | undefined;

export type CurriculumAttemptResult = {
    questionId: number;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isTimedOut: boolean;
    streakAfter: number;
};

export type CurriculumFeedbackState = {
    show: boolean;
    isCorrect: boolean;
    isTimedOut: boolean;
    message: string;
    correctAnswer?: string | null;
};

export type CurriculumController = {
    phase: CurriculumPhase;
    isLoadingConfig: boolean;
    isStartingSession: boolean;
    isSavingSummary: boolean;
    isSessionActive: boolean;
    units: CurriculumUnit[];
    selectedUnitId: number | null;
    questionCount: number;
    questionCountOptions: number[];
    timeLimit: number;
    timeLimitOptions: number[];
    currentQuestion: CurriculumQuestion | null;
    currentQuestionNumber: number;
    totalQuestions: number;
    currentStreak: number;
    bestStreak: number;
    correctCount: number;
    scorePercent: number;
    timeRemaining: number;
    countdownState: "yellow" | "green" | null;
    selectedOption: number | null;
    isAnswerLocked: boolean;
    attempts: CurriculumAttemptResult[];
    feedbackState: CurriculumFeedbackState;
    sessionUnit: CurriculumUnit | null;
    selectedUnit: CurriculumUnit | null;
    setSelectedUnitId: (unitId: number | null) => void;
    setQuestionCount: (count: number) => void;
    setTimeLimit: (seconds: number) => void;
    startSession: () => Promise<void>;
    submitPracticeAnswer: (optionIndex: number) => Promise<void>;
    continuePractice: () => void;
    leaveToSetup: () => void;
    restartPractice: () => Promise<void>;
    setSelectedOption: Dispatch<SetStateAction<number | null>>;
};

export type {
    CurriculumAttemptResponse,
};
