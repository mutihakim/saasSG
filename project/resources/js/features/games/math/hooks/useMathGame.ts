import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MathAttemptEntry, MathGameConfig, MathGameResult, MathQuestion, UseMathGameReturn } from "../types";
import {
    normalizeNumber,
    pairKeyOf,
    QUESTION_ADVANCE_DELAY_MS,
    randomCandidatesFor,
} from "../utils/mathGame";

import { useMathQuestionDeck } from "./useMathQuestionDeck";

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
    const [isPaused, setIsPaused] = useState(false);
    const [allPairsMastered, setAllPairsMastered] = useState(false);
    const [isMemoryTestMode, setIsMemoryTestMode] = useState(false);
    const [masteredPairs, setMasteredPairs] = useState<string[]>([]);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [finishedAt, setFinishedAt] = useState<number | null>(null);
    const [masteryThreshold, setMasteryThreshold] = useState(8);
    const [pairStreaks, setPairStreaks] = useState<Record<string, number>>({});

    const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittingRef = useRef(false);
    const { generateNextQuestion, resetDeck } = useMathQuestionDeck(masteredPairs);

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

    const currentQuestion = useMemo(() => questions[currentIndex] ?? null, [questions, currentIndex]);

    const getCurrentStreak = useCallback((): number => {
        if (!currentQuestion) {
            return 0;
        }
        return pairStreaks[currentQuestion.pairKey] ?? 0;
    }, [currentQuestion, pairStreaks]);

    const result = useMemo<MathGameResult>(() => {
        const totalQuestions = questions.length;
        const correctCount = attempts.filter((entry) => entry.isCorrect).length;
        const wrongCount = attempts.length - correctCount;
        const duration = startedAt && finishedAt ? Math.round((finishedAt - startedAt) / 1000) : 0;

        return { totalQuestions, correctCount, wrongCount, currentStreak: streak, bestStreak, masteredPairs, duration };
    }, [questions.length, attempts, startedAt, finishedAt, streak, bestStreak, masteredPairs]);

    const markFinished = useCallback((opts?: { allPairsMastered?: boolean }) => {
        setAllPairsMastered(Boolean(opts?.allPairsMastered));
        setIsFinished(true);
        setFinishedAt(Date.now());
        setTimeRemaining(0);
    }, []);

    const syncPairStats = useCallback((pairKey: string, stats: { currentStreak: number; mastered?: boolean }) => {
        setPairStreaks((prev) => {
            const nextStreak = Math.max(0, Math.floor(stats.currentStreak));
            if (prev[pairKey] === nextStreak) {
                return prev;
            }
            return { ...prev, [pairKey]: nextStreak };
        });

        if (stats.mastered) {
            setMasteredPairs((prev) => (prev.includes(pairKey) ? prev : [...prev, pairKey]));
        }
    }, []);

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

        const currentPairStreak = pairStreaks[currentQuestion.pairKey] ?? 0;
        const nextStreak = correct ? currentPairStreak + 1 : 0;
        const nextMasterySet = new Set(masteredPairs);
        if (nextStreak >= masteryThreshold) {
            nextMasterySet.add(currentQuestion.pairKey);
        } else {
            nextMasterySet.delete(currentQuestion.pairKey);
        }

        setIsLocked(true);
        setIsCorrect(correct);
        setAttempts((prev) => [...prev, { question: currentQuestion, userAnswer: answerNumber, isCorrect: correct, timedOut, streakAfter: nextStreak }]);
        setPairStreaks((prev) => ({ ...prev, [currentQuestion.pairKey]: nextStreak }));
        setMasteredPairs(Array.from(nextMasterySet));
        setStreak(nextStreak);

        if (correct) {
            setScore((prev) => prev + 1);
        }
        if (nextStreak > bestStreak) {
            setBestStreak(nextStreak);
        }
        if (timedOut) {
            setTimeRemaining(0);
        }

        advanceTimerRef.current = setTimeout(() => {
            const answeredCount = attempts.length + 1;
            const reachedQuestionLimit = Boolean(config && answeredCount >= config.questionCount);

            if (!config) {
                markFinished();
            } else if (reachedQuestionLimit) {
                const possibleRandoms = randomCandidatesFor(config);
                const allNowMastered = possibleRandoms.every((r) => nextMasterySet.has(pairKeyOf(config.operator, config.numberRange, r)));
                markFinished({ allPairsMastered: allNowMastered });
            } else {
                const nextQuestion = generateNextQuestion(config, nextMasterySet, isMemoryTestMode);
                if (!nextQuestion) {
                    markFinished({ allPairsMastered: true });
                } else {
                    setQuestions((prev) => [...prev, nextQuestion]);
                    setCurrentIndex((prev) => prev + 1);
                    setAllPairsMastered(false);
                    setTimeRemaining(config.timeLimit);
                }
            }

            setIsCorrect(null);
            setUserAnswer("");
            setIsLocked(false);
            submittingRef.current = false;
        }, QUESTION_ADVANCE_DELAY_MS);
    }, [attempts.length, bestStreak, config, currentQuestion, generateNextQuestion, isFinished, isLocked, isMemoryTestMode, markFinished, masteredPairs, masteryThreshold, pairStreaks, userAnswer]);

    const inputDigit = useCallback((digit: string) => {
        if (isFinished || isLocked || !/^\d$/.test(digit)) {
            return;
        }

        setUserAnswer((prev) => (prev.length >= 4 ? prev : `${prev}${digit}`));
    }, [isFinished, isLocked]);

    const deleteDigit = useCallback(() => {
        if (!isFinished && !isLocked) {
            setUserAnswer((prev) => prev.slice(0, -1));
        }
    }, [isFinished, isLocked]);

    const resume = useCallback(() => setIsPaused(false), []);
    const pause = useCallback(() => setIsPaused(true), []);

    const startGame = useCallback((nextConfig: MathGameConfig, options?: { masteredPairs?: string[]; pairStreaks?: Record<string, number>; masteryThreshold?: number; isMemoryTest?: boolean; startPaused?: boolean }) => {
        clearTimers();
        submittingRef.current = false;
        resetDeck();

        const normalizedConfig: MathGameConfig = {
            operator: nextConfig.operator,
            mode: nextConfig.mode,
            numberRange: normalizeNumber(nextConfig.numberRange, 1),
            randomRange: normalizeNumber(nextConfig.randomRange, 1),
            questionCount: Math.max(1, Math.min(200, Math.floor(nextConfig.questionCount))),
            timeLimit: Math.max(2, Math.min(300, Math.floor(nextConfig.timeLimit))),
        };

        const masterySet = new Set(options?.masteredPairs ?? []);
        setMasteredPairs(Array.from(masterySet));
        setMasteryThreshold(Math.max(1, Math.floor(options?.masteryThreshold ?? 8)));
        setIsMemoryTestMode(Boolean(options?.isMemoryTest));
        setIsPaused(Boolean(options?.startPaused));
        setPairStreaks(options?.pairStreaks ?? {});

        const firstQuestion = generateNextQuestion(normalizedConfig, masterySet, options?.isMemoryTest);
        setConfig(normalizedConfig);
        setQuestions(firstQuestion ? [firstQuestion] : []);
        setAttempts([]);
        setCurrentIndex(0);
        setUserAnswer("");
        setIsCorrect(null);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTimeRemaining(firstQuestion ? normalizedConfig.timeLimit : 0);
        setIsFinished(!firstQuestion);
        setIsLocked(false);
        setAllPairsMastered(!firstQuestion);
        setStartedAt(Date.now());
        setFinishedAt(firstQuestion ? null : Date.now());
    }, [clearTimers, generateNextQuestion, resetDeck]);

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
        resetDeck();
        setStartedAt(null);
        setFinishedAt(null);
        submittingRef.current = false;
    }, [clearTimers, resetDeck]);

    useEffect(() => {
        if (!config || isFinished || isLocked || !currentQuestion || isPaused) {
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
    }, [config, currentQuestion, isFinished, isLocked, isPaused, submitAnswer]);

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
        resume,
        pause,
        reset,
        getCurrentStreak,
        syncPairStats,
    };
};

export default useMathGame;
