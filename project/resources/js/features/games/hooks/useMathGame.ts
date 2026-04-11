import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type MathGameOperator = "+" | "-" | "*" | "/";
export type MathGameMode = "mencariC" | "mencariB";

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

type UseMathGameReturn = {
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
    startGame: (config: MathGameConfig, options?: { masteredPairs?: string[]; pairStreaks?: Record<string, number> }) => void;
    reset: () => void;
    getCurrentStreak: () => number;
};

export interface MathGameConfig {
    operator: MathGameOperator;
    mode: MathGameMode;
    numberRange: number;
    randomRange: number;
    questionCount: number;
    timeLimit: number;
}

const QUESTION_ADVANCE_DELAY_MS = 2000; // Increased to match reference (2 seconds for feedback)

const shuffle = <T,>(arr: T[]): T[] => {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
};

const normalizeNumber = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(1, Math.min(999, Math.floor(value)));
};

const candidateNumbers = (start: number): number[] => (
    Array.from({ length: 10 }, (_, index) => start + index)
);

const randomCandidatesFor = (config: MathGameConfig): number[] => (
    config.operator === "-"
        ? candidateNumbers(config.numberRange)
        : candidateNumbers(config.randomRange)
);

const pairKeyOf = (operator: MathGameOperator, angkaPilihan: number, angkaRandom: number) => (
    `${operator}|${angkaPilihan}|${angkaRandom}`
);

const createQuestion = (
    config: MathGameConfig,
    angkaPilihan: number,
    angkaRandom: number,
): MathQuestion => {
    const { operator, mode } = config;

    let a: number;
    let b: number;
    let answer: number;
    let result: number;

    if (mode === "mencariC") {
        if (operator === "-") {
            a = angkaRandom;
            b = angkaPilihan;
        } else if (operator === "/") {
            a = angkaPilihan * angkaRandom;
            b = angkaPilihan;
        } else {
            a = angkaPilihan;
            b = angkaRandom;
        }

        answer = ({ "+": a + b, "-": a - b, "*": a * b, "/": a / b }[operator]);
        result = answer;
    } else {
        answer = angkaRandom;
        if (operator === "+") {
            a = angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan + angkaRandom;
        } else if (operator === "-") {
            a = angkaRandom + angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan;
        } else if (operator === "*") {
            a = angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan * angkaRandom;
        } else {
            a = angkaPilihan * angkaRandom;
            b = angkaRandom;
            result = angkaPilihan;
        }
    }

    [a, b, answer, result] = [a, b, answer, result].map((value) => Math.round(value)) as [number, number, number, number];
    const display = mode === "mencariC"
        ? `${a} ${operator} ${b} = ?`
        : `${a} ${operator} ? = ${result}`;

    return {
        a,
        b,
        operator,
        answer,
        mode,
        display,
        result,
        angkaPilihan,
        angkaRandom,
        pairKey: pairKeyOf(operator, angkaPilihan, angkaRandom),
    };
};

/**
 * Manages math game session state: question generation, answer validation,
 * scoring, streak tracking (per-pair), and mastery tracking.
 */
const useMathGame = (): UseMathGameReturn => {
    const [config, setConfig] = useState<MathGameConfig | null>(null);
    const [questions, setQuestions] = useState<MathQuestion[]>([]);
    const [attempts, setAttempts] = useState<MathAttemptEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [allPairsMastered, setAllPairsMastered] = useState(false);
    const [masteredPairs, setMasteredPairs] = useState<string[]>([]);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [finishedAt, setFinishedAt] = useState<number | null>(null);

    // Per-pair streak tracking (matches reference implementation)
    const [pairStreaks, setPairStreaks] = useState<Record<string, number>>({});

    const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittingRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
        }
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
        }
    }, []);

    const currentQuestion = useMemo(
        () => questions[currentIndex] ?? null,
        [questions, currentIndex],
    );

    const getCurrentStreak = useCallback((): number => {
        if (!currentQuestion) return 0;
        return pairStreaks[currentQuestion.pairKey] ?? 0;
    }, [currentQuestion, pairStreaks]);

    const result = useMemo<MathGameResult>(() => {
        const totalQuestions = questions.length;
        const correctCount = attempts.filter((entry) => entry.isCorrect).length;
        const wrongCount = attempts.length - correctCount;
        const duration = startedAt && finishedAt ? Math.round((finishedAt - startedAt) / 1000) : 0;

        return {
            totalQuestions,
            correctCount,
            wrongCount,
            currentStreak: streak,
            bestStreak,
            masteredPairs,
            duration,
        };
    }, [questions.length, attempts, startedAt, finishedAt, streak, bestStreak, masteredPairs]);

    const submitAnswer = useCallback((opts?: { timedOut?: boolean; answer?: string }) => {
        if (isFinished || isLocked || submittingRef.current || !currentQuestion) {
            return;
        }

        submittingRef.current = true;

        const timedOut = Boolean(opts?.timedOut);
        const submittedAnswer = opts?.answer ?? userAnswer;
        const parsed = submittedAnswer.trim() === "" ? NaN : Number.parseInt(submittedAnswer, 10);
        const answerNumber = Number.isNaN(parsed) ? null : parsed;
        const correct = !timedOut && answerNumber === currentQuestion.answer;

        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
        }

        // Get current streak for this specific pair (matches reference)
        const currentPairStreak = pairStreaks[currentQuestion.pairKey] ?? 0;
        const nextStreak = correct ? currentPairStreak + 1 : 0;

        setIsLocked(true);
        setIsCorrect(correct);
        setAttempts((prev) => [...prev, {
            question: currentQuestion,
            userAnswer: answerNumber,
            isCorrect: correct,
            timedOut,
            streakAfter: nextStreak,
        }]);

        if (correct) {
            setScore((prev) => prev + 1);
        }

        // Update per-pair streak
        setPairStreaks((prev) => ({
            ...prev,
            [currentQuestion.pairKey]: nextStreak,
        }));

        // Update global streak for display
        setStreak(nextStreak);
        if (nextStreak > bestStreak) {
            setBestStreak(nextStreak);
        }

        if (timedOut) {
            setTimeRemaining(0);
        }

        advanceTimerRef.current = setTimeout(() => {
            const isLastQuestion = currentIndex >= questions.length - 1;
            if (isLastQuestion) {
                setIsFinished(true);
                setFinishedAt(Date.now());
            } else {
                setCurrentIndex((prev) => prev + 1);
                if (config) {
                    setTimeRemaining(config.timeLimit);
                }
            }

            setIsCorrect(null);
            setUserAnswer("");
            setIsLocked(false);
            submittingRef.current = false;
        }, QUESTION_ADVANCE_DELAY_MS);
    }, [bestStreak, config, currentQuestion, currentIndex, isFinished, isLocked, pairStreaks, questions.length, userAnswer]);

    const inputDigit = useCallback((digit: string) => {
        if (isFinished || isLocked) {
            return;
        }

        if (!/^\d$/.test(digit)) {
            return;
        }

        setUserAnswer((prev) => {
            if (prev.length >= 4) {
                return prev;
            }
            return `${prev}${digit}`;
        });
    }, [isFinished, isLocked]);

    const deleteDigit = useCallback(() => {
        if (isFinished || isLocked) {
            return;
        }

        setUserAnswer((prev) => prev.slice(0, -1));
    }, [isFinished, isLocked]);

    const startGame = useCallback((nextConfig: MathGameConfig, options?: { masteredPairs?: string[]; pairStreaks?: Record<string, number> }) => {
        clearTimers();
        submittingRef.current = false;

        const normalizedConfig: MathGameConfig = {
            operator: nextConfig.operator,
            mode: nextConfig.mode,
            numberRange: normalizeNumber(nextConfig.numberRange, 1),
            randomRange: normalizeNumber(nextConfig.randomRange, 1),
            questionCount: Math.max(1, Math.min(200, Math.floor(nextConfig.questionCount))),
            timeLimit: Math.max(5, Math.min(300, Math.floor(nextConfig.timeLimit))),
        };

        const masterySet = new Set(options?.masteredPairs ?? []);
        setMasteredPairs(Array.from(masterySet));

        // Initialize pair streaks from options or database
        setPairStreaks(options?.pairStreaks ?? {});

        const randomCandidates = randomCandidatesFor(normalizedConfig);
        const hasUnmasteredCandidate = randomCandidates.some((n) => (
            !masterySet.has(pairKeyOf(normalizedConfig.operator, normalizedConfig.numberRange, n))
        ));

        if (!hasUnmasteredCandidate) {
            setAllPairsMastered(true);
            setConfig(normalizedConfig);
            setQuestions([]);
            setAttempts([]);
            setCurrentIndex(0);
            setUserAnswer("");
            setIsCorrect(null);
            setScore(0);
            setStreak(0);
            setBestStreak(0);
            setTimeRemaining(0);
            setIsFinished(true);
            setIsLocked(false);
            setStartedAt(Date.now());
            setFinishedAt(Date.now());
            return;
        }

        const generated: MathQuestion[] = [];
        let pool = shuffle(randomCandidates);
        let guard = 0;

        while (generated.length < normalizedConfig.questionCount && guard < normalizedConfig.questionCount * 40) {
            guard += 1;
            if (pool.length === 0) {
                pool = shuffle(randomCandidates);
            }

            const random = pool.shift();
            if (random === undefined) {
                break;
            }

            const key = pairKeyOf(normalizedConfig.operator, normalizedConfig.numberRange, random);
            if (hasUnmasteredCandidate && masterySet.has(key)) {
                continue;
            }

            generated.push(createQuestion(normalizedConfig, normalizedConfig.numberRange, random));
        }

        setAllPairsMastered(generated.length === 0);
        setConfig(normalizedConfig);
        setQuestions(generated);
        setAttempts([]);
        setCurrentIndex(0);
        setUserAnswer("");
        setIsCorrect(null);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTimeRemaining(normalizedConfig.timeLimit);
        setIsFinished(generated.length === 0);
        setIsLocked(false);
        setStartedAt(Date.now());
        setFinishedAt(generated.length === 0 ? Date.now() : null);
    }, [clearTimers]);

    const reset = useCallback(() => {
        clearTimers();
        setConfig(null);
        setQuestions([]);
        setAttempts([]);
        setCurrentIndex(0);
        setUserAnswer("");
        setIsCorrect(null);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTimeRemaining(0);
        setIsFinished(false);
        setIsLocked(false);
        setAllPairsMastered(false);
        setMasteredPairs([]);
        setPairStreaks({});
        setStartedAt(null);
        setFinishedAt(null);
        submittingRef.current = false;
    }, [clearTimers]);

    useEffect(() => {
        if (!config || isFinished || isLocked || !currentQuestion) {
            return;
        }

        questionTimerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    if (questionTimerRef.current) {
                        clearInterval(questionTimerRef.current);
                        questionTimerRef.current = null;
                    }
                    submitAnswer({ timedOut: true });
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => {
            if (questionTimerRef.current) {
                clearInterval(questionTimerRef.current);
                questionTimerRef.current = null;
            }
        };
    }, [config, currentQuestion, isFinished, isLocked, submitAnswer]);

    useEffect(() => () => clearTimers(), [clearTimers]);

    return {
        questions,
        attempts,
        currentQuestion,
        currentIndex,
        userAnswer,
        isCorrect,
        score,
        streak,
        bestStreak,
        timeRemaining,
        isFinished,
        isLocked,
        startedAt,
        finishedAt,
        allPairsMastered,
        masteredPairs,
        result,
        submitAnswer,
        inputDigit,
        deleteDigit,
        startGame,
        reset,
        getCurrentStreak,
    };
};

export default useMathGame;
