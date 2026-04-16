import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createCurriculumApi } from "../data/api/curriculumApi";
import type { CurriculumAttemptResult, CurriculumController, CurriculumFeedbackState, CurriculumQuestion, CurriculumUnit } from "../types";

import useCurriculumTimers from "./useCurriculumTimers";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

const initialFeedbackState: CurriculumFeedbackState = {
    show: false,
    isCorrect: false,
    isTimedOut: false,
    message: "",
    correctAnswer: null,
};

const useCurriculumGameController = (): CurriculumController => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createCurriculumApi(tenantRoute), [tenantRoute]);

    const [phase, setPhase] = useState<"setup" | "practice" | "summary">("setup");
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isSavingSummary, setIsSavingSummary] = useState(false);
    const [units, setUnits] = useState<CurriculumUnit[]>([]);
    const [questionCountOptions, setQuestionCountOptions] = useState<number[]>([5, 10, 15, 20]);
    const [timeLimitOptions, setTimeLimitOptions] = useState<number[]>([10, 15, 20, 30, 45, 60]);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [questionCount, setQuestionCount] = useState(5);
    const [timeLimit, setTimeLimit] = useState(20);
    const [sessionUnit, setSessionUnit] = useState<CurriculumUnit | null>(null);
    const [questions, setQuestions] = useState<CurriculumQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [attempts, setAttempts] = useState<CurriculumAttemptResult[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [countdownState, setCountdownState] = useState<"yellow" | "green" | null>(null);
    const [feedbackState, setFeedbackState] = useState<CurriculumFeedbackState>(initialFeedbackState);
    const [startedAt, setStartedAt] = useState<number | null>(null);

    const {
        answerLockTimerRef,
        countdownTimerRef,
        timerRef,
        clearAnswerLockTimer,
        clearCountdownTimer,
        clearPracticeTimer,
    } = useCurriculumTimers();

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoadingConfig(true);
            try {
                const [config, settings] = await Promise.all([
                    api.fetchConfig(),
                    api.fetchSettings()
                ]);
                
                if (cancelled) {
                    return;
                }

                setUnits(config.units ?? []);
                setQuestionCountOptions(config.question_count_options ?? [5, 10, 15, 20]);
                setTimeLimitOptions(config.time_limit_options ?? [10, 15, 20, 30, 45, 60]);
                
                let defaultQc = settings?.default_question_count ?? (config.question_count_options ?? [5])[0] ?? 5;
                let defaultTl = settings?.default_time_limit ?? config.default_time_limit ?? (config.time_limit_options ?? [20])[0] ?? 20;
                let defaultGrade = settings?.grade ?? 1;

                const allUnits = config.units ?? [];
                let filteredUnits = allUnits.filter(u => u.grade === defaultGrade);
                if (filteredUnits.length === 0) {
                    filteredUnits = allUnits; // Fallback if no matching grade units
                }

                setUnits(filteredUnits);
                setQuestionCount(defaultQc);
                setTimeLimit(defaultTl);
                setSelectedUnitId(filteredUnits?.[0]?.id ?? null);
            } catch {
                if (!cancelled) {
                    notify.error(t("tenant.games.curriculum.load_error"));
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingConfig(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [api, t]);

    const currentQuestion = questions[currentIndex] ?? null;
    const selectedUnit = useMemo(() => units.find((unit) => unit.id === selectedUnitId) ?? null, [selectedUnitId, units]);
    const totalQuestions = questions.length;
    const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const currentQuestionNumber = Math.min(currentIndex + 1, totalQuestions || 1);
    const isSessionActive = phase === "practice" && sessionUnit !== null;

    const clearFeedback = useCallback(() => {
        setFeedbackState(initialFeedbackState);
    }, []);

    const resetSessionState = useCallback(() => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearPracticeTimer();
        setSessionUnit(null);
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswerLocked(false);
        setAttempts([]);
        setCurrentStreak(0);
        setBestStreak(0);
        setTimeRemaining(0);
        setCountdownState(null);
        setStartedAt(null);
        clearFeedback();
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedback, clearPracticeTimer]);

    const leaveToSetup = useCallback(() => {
        resetSessionState();
        setIsSavingSummary(false);
        setPhase("setup");
    }, [resetSessionState]);

    const showFeedbackAndContinue = useCallback((payload: CurriculumFeedbackState, autoContinue = false) => {
        setFeedbackState(payload);
        setIsAnswerLocked(true);
        clearAnswerLockTimer();
        answerLockTimerRef.current = window.setTimeout(() => {
            setFeedbackState(initialFeedbackState);
            setIsAnswerLocked(false);
            if (autoContinue) {
                setCurrentIndex((value) => value + 1);
                setSelectedOption(null);
                setTimeRemaining(timeLimit);
            }
        }, payload.isCorrect ? 1200 : 0);
    }, [answerLockTimerRef, clearAnswerLockTimer, timeLimit]);

    const finishSession = useCallback(async (nextAttempts: CurriculumAttemptResult[], nextBestStreak: number) => {
        if (!sessionUnit) {
            return;
        }

        setIsSavingSummary(true);

        try {
            await api.finishSession({
                unit_id: sessionUnit.id,
                question_count: totalQuestions,
                correct_count: nextAttempts.filter((attempt) => attempt.isCorrect).length,
                wrong_count: nextAttempts.filter((attempt) => !attempt.isCorrect).length,
                best_streak: nextBestStreak,
                time_limit: timeLimit,
                duration_seconds: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0,
                started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
                finished_at: new Date().toISOString(),
                summary: {
                    attempts: nextAttempts.map((attempt) => ({
                        question_text: attempt.questionText,
                        selected_answer: attempt.selectedAnswer,
                        correct_answer: attempt.correctAnswer,
                        is_correct: attempt.isCorrect,
                        is_timed_out: attempt.isTimedOut,
                    })),
                },
            });
        } catch {
            notify.error(t("tenant.games.curriculum.save_summary_error"));
        } finally {
            clearPracticeTimer();
            setIsSavingSummary(false);
            setPhase("summary");
        }
    }, [api, clearPracticeTimer, sessionUnit, startedAt, t, timeLimit, totalQuestions]);

    const continuePractice = useCallback(() => {
        clearFeedback();
        setIsAnswerLocked(false);

        if (currentIndex + 1 >= questions.length) {
            void finishSession(attempts, bestStreak);
            return;
        }

        setCurrentIndex((value) => value + 1);
        setSelectedOption(null);
        setTimeRemaining(timeLimit);
    }, [attempts, bestStreak, clearFeedback, currentIndex, finishSession, questions.length, timeLimit]);

    const recordAnswer = useCallback(async (selectedAnswer: string, optionIndex: number | null, isTimedOut = false) => {
        if (!currentQuestion || isAnswerLocked || countdownState !== null) {
            return;
        }

        setIsAnswerLocked(true);
        setSelectedOption(optionIndex);
        clearPracticeTimer();

        try {
            const result = await api.submitAttempt({
                question_id: currentQuestion.id,
                selected_answer: selectedAnswer,
            });

            const nextStreak = result.is_correct ? currentStreak + 1 : 0;
            const nextBestStreak = Math.max(bestStreak, nextStreak);
            const nextAttempts = [
                ...attempts,
                {
                    questionId: result.question_id,
                    questionText: currentQuestion.question_text,
                    selectedAnswer: result.selected_answer || "-",
                    correctAnswer: result.correct_answer,
                    isCorrect: result.is_correct,
                    isTimedOut,
                    streakAfter: nextStreak,
                },
            ];

            setAttempts(nextAttempts);
            setCurrentStreak(nextStreak);
            setBestStreak(nextBestStreak);

            if (currentIndex + 1 >= questions.length) {
                setFeedbackState({
                    show: true,
                    isCorrect: result.is_correct,
                    isTimedOut,
                    message: result.is_correct
                        ? t("tenant.games.feedback.praise.0")
                        : (isTimedOut ? t("tenant.games.shared.feedback.timeout") : t("tenant.games.feedback.encouragement.0")),
                    correctAnswer: result.correct_answer,
                });
                answerLockTimerRef.current = window.setTimeout(() => {
                    setFeedbackState(initialFeedbackState);
                    setIsAnswerLocked(false);
                    void finishSession(nextAttempts, nextBestStreak);
                }, result.is_correct ? 1200 : 400);

                return;
            }

            showFeedbackAndContinue({
                show: true,
                isCorrect: result.is_correct,
                isTimedOut,
                message: result.is_correct
                    ? t("tenant.games.feedback.praise.0")
                    : (isTimedOut ? t("tenant.games.shared.feedback.timeout") : t("tenant.games.feedback.encouragement.0")),
                correctAnswer: result.correct_answer,
            }, result.is_correct);
        } catch {
            notify.error(t("tenant.games.curriculum.answer_error"));
            setIsAnswerLocked(false);
        }
    }, [answerLockTimerRef, api, attempts, bestStreak, countdownState, currentIndex, currentQuestion, currentStreak, finishSession, isAnswerLocked, questions.length, showFeedbackAndContinue, t, clearPracticeTimer]);

    const submitPracticeAnswer = useCallback(async (optionIndex: number) => {
        if (!currentQuestion) {
            return;
        }

        const selectedAnswer = currentQuestion.options[optionIndex] ?? "";
        await recordAnswer(selectedAnswer, optionIndex, false);
    }, [currentQuestion, recordAnswer]);

    const startSession = useCallback(async () => {
        if (!selectedUnitId) {
            return;
        }

        setIsStartingSession(true);
        resetSessionState();

        try {
            const payload = await api.fetchQuestions(selectedUnitId, questionCount);
            if ((payload.questions ?? []).length === 0) {
                notify.error(t("tenant.games.curriculum.empty"));
                return;
            }

            setSessionUnit(payload.unit);
            setQuestions(payload.questions);
            setCurrentIndex(0);
            setSelectedOption(null);
            setTimeRemaining(timeLimit);
            setCountdownState("yellow");
            setPhase("practice");
        } catch {
            notify.error(t("tenant.games.curriculum.start_error"));
        } finally {
            setIsStartingSession(false);
        }
    }, [api, questionCount, resetSessionState, selectedUnitId, t, timeLimit]);

    const restartPractice = useCallback(async () => {
        await startSession();
    }, [startSession]);

    useEffect(() => {
        clearCountdownTimer();

        if (countdownState === "yellow") {
            countdownTimerRef.current = window.setTimeout(() => {
                setCountdownState("green");
            }, 800);
            return;
        }

        if (countdownState === "green") {
            countdownTimerRef.current = window.setTimeout(() => {
                setCountdownState(null);
                setStartedAt(Date.now());
                setTimeRemaining(timeLimit);
            }, 800);
        }
    }, [clearCountdownTimer, countdownState, countdownTimerRef, timeLimit]);

    useEffect(() => {
        clearPracticeTimer();

        if (phase !== "practice" || countdownState !== null || isAnswerLocked || !currentQuestion) {
            return;
        }

        timerRef.current = window.setInterval(() => {
            setTimeRemaining((value) => {
                if (value <= 1) {
                    window.clearInterval(timerRef.current ?? undefined);
                    timerRef.current = null;
                    void recordAnswer("", null, true);
                    return 0;
                }

                return value - 1;
            });
        }, 1000);
    }, [clearPracticeTimer, countdownState, currentQuestion, isAnswerLocked, phase, recordAnswer, timerRef]);

    useEffect(() => {
        setSelectedOption(null);
        clearFeedback();
        setIsAnswerLocked(false);
        setTimeRemaining(timeLimit);
    }, [currentIndex, clearFeedback, timeLimit]);

    return {
        phase,
        isLoadingConfig,
        isStartingSession,
        isSavingSummary,
        isSessionActive,
        units,
        selectedUnitId,
        questionCount,
        questionCountOptions,
        timeLimit,
        timeLimitOptions,
        currentQuestion,
        currentQuestionNumber,
        totalQuestions,
        currentStreak,
        bestStreak,
        correctCount,
        scorePercent,
        timeRemaining,
        countdownState,
        selectedOption,
        isAnswerLocked,
        attempts,
        feedbackState,
        sessionUnit,
        selectedUnit,
        setSelectedUnitId,
        setQuestionCount,
        setTimeLimit,
        startSession,
        submitPracticeAnswer,
        continuePractice,
        leaveToSetup,
        restartPractice,
        setSelectedOption,
    };
};

export default useCurriculumGameController;
