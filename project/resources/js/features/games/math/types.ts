export type MathGameOperator = "+" | "-" | "*" | "/";
export type MathGameMode = "mencariC" | "mencariB";
export type MathGameScreen = "setup";
export type MathCountdownState = "yellow" | "green" | null;

export interface MathQuestion {
    a: number;
    b: number;
    operator: MathGameOperator;
    answer: number;
    mode: MathGameMode;
    display: string;
    result: number;
    angkaPilihan: number;
    angkaRandom: number;
    pairKey: string;
}

export interface MathAttemptEntry {
    question: MathQuestion;
    userAnswer: number | null;
    isCorrect: boolean;
    timedOut: boolean;
    streakAfter: number;
}

export interface MathGameResult {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    currentStreak: number;
    bestStreak: number;
    masteredPairs: string[];
    duration: number;
}

export interface MathGameConfig {
    operator: MathGameOperator;
    mode: MathGameMode;
    numberRange: number;
    randomRange: number;
    questionCount: number;
    timeLimit: number;
}

export interface MathGameSetupState extends MathGameConfig {
    numberRangeStart: number;
}

export interface MathGameMember {
    full_name?: string | null;
    name?: string | null;
}

export interface MathOperatorMeta {
    label: string;
    softClass: string;
    textClass: string;
    iconClass: string;
}

export type MathOperatorMetaMap = Record<MathGameOperator, MathOperatorMeta>;

export interface Option<T> {
    value: T;
    label: string;
}

export interface MathFeedbackState {
    show: boolean;
    isCorrect: boolean;
    message: string;
    correctAnswer?: number | null;
}

export type UseMathGameReturn = {
    questions: MathQuestion[];
    attempts: MathAttemptEntry[];
    currentQuestion: MathQuestion | null;
    currentIndex: number;
    userAnswer: string;
    isCorrect: boolean | null;
    score: number;
    streak: number;
    bestStreak: number;
    timeRemaining: number;
    isFinished: boolean;
    isLocked: boolean;
    startedAt: number | null;
    finishedAt: number | null;
    allPairsMastered: boolean;
    masteredPairs: string[];
    result: MathGameResult;
    submitAnswer: (opts?: { timedOut?: boolean; answer?: string }) => void;
    inputDigit: (digit: string) => void;
    deleteDigit: () => void;
    startGame: (
        config: MathGameConfig,
        options?: { masteredPairs?: string[]; pairStreaks?: Record<string, number>; masteryThreshold?: number; isMemoryTest?: boolean; startPaused?: boolean },
    ) => void;
    resume: () => void;
    pause: () => void;
    reset: () => void;
    getCurrentStreak: () => number;
    syncPairStats: (pairKey: string, stats: { currentStreak: number; mastered?: boolean }) => void;
};
