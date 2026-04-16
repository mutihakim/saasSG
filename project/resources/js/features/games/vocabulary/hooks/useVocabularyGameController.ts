import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import useGameFeedbackMessages from "../../shared/hooks/useGameFeedbackMessages";
import useVoiceFeedback from "../../shared/hooks/useVoiceFeedback";
import { createVocabularyApi, type VocabularyWordDto } from "../data/api/vocabularyApi";
import type { VocabularyAttemptResult, VocabularyController, VocabularyFeedbackState, VocabularyOption } from "../types";
import { answerLangFor, answerPhoneticFor, answerTextFor, buildOptionSet, promptTextFor } from "../utils/vocabularyGame";

import useVocabularyConfigState from "./useVocabularyConfigState";
import { useVocabularyQuestionDeck } from "./useVocabularyQuestionDeck";
import useVocabularyTimers from "./useVocabularyTimers";
import { initialFeedbackState, normalizeProgress } from "./vocabularyGameController.shared";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

const isDayMastered = (
    words: VocabularyWordDto[],
    progress: Record<string, { is_mastered?: boolean }>,
) => words.length > 0 && words.every((word) => progress[String(word.id)]?.is_mastered === true);

const useVocabularyGameController = (): VocabularyController => {
    const { t, i18n } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);
    const { speak, isEnabled: voiceEnabled } = useVoiceFeedback();
    const { getNextFeedbackMessage } = useGameFeedbackMessages();
    const [phase, setPhase] = useState<"setup" | "learn" | "practice" | "summary">("setup");
    const {
        isLoadingConfig,
        config,
        settingsMap,
        language,
        mode,
        selectedCategory,
        selectedDay,
        autoTts,
        questionCount,
        timeLimit,
        translationDirection,
        masteredThreshold,
        dayWords,
        progressMap,
        categoryOptions,
        daysForCategory,
        masteredDaysForCategory,
        hasCategories,
        hasDaysInSelectedCategory,
        setLanguage,
        setMode,
        setSelectedCategory,
        setSelectedDay,
        setAutoTts,
        setTimeLimit,
        setTranslationDirection,
        setProgressMap,
        fetchDayWords,
    } = useVocabularyConfigState(api);
    const [poolWords, setPoolWords] = useState<VocabularyWordDto[]>([]);
    const [learnIndex, setLearnIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentPracticeWord, setCurrentPracticeWord] = useState<VocabularyWordDto | null>(null);
    const [practiceOptions, setPracticeOptions] = useState<VocabularyOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [correctOption, setCorrectOption] = useState<number | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [attempts, setAttempts] = useState<VocabularyAttemptResult[]>([]);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [isSavingSummary, setIsSavingSummary] = useState(false);
    const [countdownState, setCountdownState] = useState<"yellow" | "green" | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [feedbackState, setFeedbackState] = useState<VocabularyFeedbackState>(initialFeedbackState);
    const [isMemoryTest, setIsMemoryTest] = useState(false);
    const [showMemoryTestDialog, setShowMemoryTestDialog] = useState(false);
    const [sessionQuestionTarget, setSessionQuestionTarget] = useState(0);
    
    const { generateNextQuestion, resetDeck } = useVocabularyQuestionDeck();
    
    const {
        answerLockTimerRef,
        countdownTimerRef,
        feedbackVoiceTimerRef,
        timerRef,
        clearAnswerLockTimer,
        clearCountdownTimer,
        clearFeedbackVoiceTimer,
        clearPracticeTimer,
    } = useVocabularyTimers();

    const resetFeedback = useCallback(() => {
        setFeedbackState(initialFeedbackState);
    }, []);

    const createPracticeWordInstance = useCallback((word: VocabularyWordDto): VocabularyWordDto => ({
        ...word,
    }), []);

    const pronounce = useCallback((text: string, lang: string) => {
        speak(text, lang);
    }, [speak]);

    const resetPracticeState = useCallback(() => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();
        resetDeck();
        setCurrentPracticeWord(null);
        setPoolWords([]);
        setPracticeOptions([]);
        setSelectedOption(null);
        setCorrectOption(null);
        setIsAnswerLocked(false);
        setAttempts([]);
        setStartedAt(null);
        setIsSavingSummary(false);
        setCountdownState(null);
        setTimeRemaining(0);
        setIsMemoryTest(false);
        setSessionQuestionTarget(0);
        resetFeedback();
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer, resetDeck, resetFeedback]);

    const leaveToSetup = useCallback(() => {
        resetPracticeState();
        setShowMemoryTestDialog(false);
        setPhase("setup");
    }, [resetPracticeState]);

    const startLearnMode = useCallback(async () => {
        setIsStartingSession(true);

        try {
            const { words } = await fetchDayWords();
            if (words.length === 0) {
                notify.info(t("tenant.games.vocabulary.error.no_words"));
                return;
            }

            setLearnIndex(0);
            setIsFlipped(false);
            setPhase("learn");
        } catch {
            notify.error(t("tenant.games.vocabulary.error.load_learn_failed"));
        } finally {
            setIsStartingSession(false);
        }
    }, [fetchDayWords, t]);

    const initializePracticeSession = useCallback((
        words: VocabularyWordDto[],
        pool: VocabularyWordDto[],
        progress: Record<string, { correct_streak?: number, is_mastered?: boolean }>,
        nextIsMemoryTest: boolean,
    ) => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();
        resetDeck();
        setPoolWords(pool);
        
        const firstQuestion = generateNextQuestion(words, progress, nextIsMemoryTest);
        if (!firstQuestion) {
            return;
        }
        setCurrentPracticeWord(createPracticeWordInstance(firstQuestion));
        
        setPracticeOptions([]);
        setSelectedOption(null);
        setCorrectOption(null);
        setIsAnswerLocked(false);
        setAttempts([]);
        setStartedAt(null);
        setIsSavingSummary(false);
        setCountdownState("yellow");
        setTimeRemaining(timeLimit);
        setIsMemoryTest(nextIsMemoryTest);
        setSessionQuestionTarget(nextIsMemoryTest ? words.length : questionCount);
        resetFeedback();
        setPhase("practice");
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer, resetDeck, generateNextQuestion, createPracticeWordInstance, questionCount, timeLimit, resetFeedback]);

    const startPracticeMode = useCallback(async (forceMemoryTest = false) => {
        setIsStartingSession(true);
        clearAnswerLockTimer();

        try {
            const [{ words, progress }, { words: pool }] = await Promise.all([
                fetchDayWords(),
                api.fetchPool({ language, category: selectedCategory }),
            ]);

            const candidateWords = forceMemoryTest
                ? words
                : words.filter((word) => !progress[String(word.id)]?.is_mastered);

            if (candidateWords.length === 0) {
                setShowMemoryTestDialog(true);
                return;
            }

            initializePracticeSession(words, pool, progress, forceMemoryTest);
        } catch {
            notify.error(forceMemoryTest ? t("tenant.games.vocabulary.error.start_memory_test_failed") : t("tenant.games.vocabulary.error.start_practice_failed"));
        } finally {
            setIsStartingSession(false);
        }
    }, [api, clearAnswerLockTimer, fetchDayWords, initializePracticeSession, language, selectedCategory, t]);

    const startMemoryTest = useCallback(async () => {
        await startPracticeMode(true);
    }, [startPracticeMode]);

    const currentLearnWord = dayWords[learnIndex] ?? null;

    useEffect(() => {
        if (phase !== "practice" || !currentPracticeWord) {
            return;
        }

        const options = buildOptionSet(currentPracticeWord, language, translationDirection, poolWords);
        if (options.length < 2) {
            notify.error(t("tenant.games.vocabulary.error.not_enough_options"));
            leaveToSetup();
            return;
        }

        setPracticeOptions(options);
        setSelectedOption(null);
        setCorrectOption(null);
        setIsAnswerLocked(false);
        setTimeRemaining(timeLimit);
    }, [currentPracticeWord, language, leaveToSetup, phase, poolWords, t, timeLimit, translationDirection]);

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

    const finishSession = useCallback(async (nextAttempts: VocabularyAttemptResult[]) => {
        if (!selectedCategory || !selectedDay || !startedAt || nextAttempts.length === 0) {
            return;
        }

        const sessionCorrectCount = nextAttempts.filter((attempt) => attempt.isCorrect).length;
        const sessionWrongCount = nextAttempts.length - sessionCorrectCount;

        setIsSavingSummary(true);
        try {
            await api.finishSession({
                language,
                mode: isMemoryTest ? "memory_test" : "practice",
                category: selectedCategory,
                day: selectedDay,
                question_count: nextAttempts.length,
                correct_count: sessionCorrectCount,
                wrong_count: sessionWrongCount,
                best_streak: nextAttempts.reduce((max, attempt) => Math.max(max, attempt.streakAfter), 0),
                duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
                started_at: new Date(startedAt).toISOString(),
                finished_at: new Date().toISOString(),
                summary: {
                    language,
                    attempts: nextAttempts.map((attempt) => ({
                        word_id: attempt.wordId,
                        prompt: attempt.prompt,
                        correct_answer: attempt.correctAnswer,
                        selected_answer: attempt.selectedAnswer,
                        correct: attempt.isCorrect,
                        streak_after: attempt.streakAfter,
                    })),
                },
            });
        } catch {
            notify.error(t("tenant.games.vocabulary.error.save_summary_failed"));
        } finally {
            setIsSavingSummary(false);
        }
    }, [api, isMemoryTest, language, selectedCategory, selectedDay, startedAt, t]);

    const submitPracticeAnswer = useCallback(async (selectedIdx: number | null, forcedTimedOut = false) => {
        if (!currentPracticeWord || isAnswerLocked) {
            return;
        }

        const correctAnswer = answerTextFor(currentPracticeWord, language, translationDirection);
        const correctAnswerPhonetic = answerPhoneticFor(currentPracticeWord, language, translationDirection);
        const chosenOption = practiceOptions[selectedIdx ?? -1];
        const chosenAnswer = chosenOption?.text ?? "Timeout";
        const isCorrect = chosenAnswer === correctAnswer && !forcedTimedOut;
        const previousProgress = progressMap[String(currentPracticeWord.id)];
        const nextStreak = isCorrect
            ? ((previousProgress?.correct_streak ?? 0) + 1)
            : 0;
        const nextProgress = normalizeProgress(previousProgress, isCorrect, nextStreak, masteredThreshold);
        const nextProgressMap = {
            ...progressMap,
            [String(currentPracticeWord.id)]: {
                ...nextProgress,
                word_id: currentPracticeWord.id,
            },
        };
        const resolvedCorrectOption = practiceOptions.findIndex((option) => option.text === correctAnswer);
        const nextAttempt: VocabularyAttemptResult = {
            wordId: currentPracticeWord.id,
            prompt: promptTextFor(currentPracticeWord, language, translationDirection),
            correctAnswer,
            selectedAnswer: chosenAnswer,
            isCorrect,
            isTimedOut: forcedTimedOut,
            streakAfter: nextStreak,
        };
        const nextAttempts = [...attempts, nextAttempt];
        const feedbackMessage = getNextFeedbackMessage(isCorrect);

        clearPracticeTimer();
        clearAnswerLockTimer();
        clearFeedbackVoiceTimer();

        setSelectedOption(selectedIdx);
        setCorrectOption(resolvedCorrectOption >= 0 ? resolvedCorrectOption : null);
        setIsAnswerLocked(true);
        setTimeRemaining(0);
        setProgressMap((prev) => ({
            ...prev,
            [String(currentPracticeWord.id)]: {
                ...nextProgress,
                word_id: currentPracticeWord.id,
            },
        }));
        setAttempts(nextAttempts);
        setFeedbackState({
            show: true,
            isCorrect,
            isTimedOut: forcedTimedOut,
            message: feedbackMessage,
            correctAnswer: isCorrect ? null : correctAnswer,
            correctAnswerPhonetic: isCorrect ? null : correctAnswerPhonetic,
        });

        if (voiceEnabled) {
            feedbackVoiceTimerRef.current = window.setTimeout(() => {
                const langMap: Record<string, string> = {
                    en: "en-US",
                    id: "id-ID",
                };
                speak(feedbackMessage, langMap[i18n.language] || i18n.language);
            }, autoTts && chosenAnswer ? 700 : 120);
        }

        if (autoTts && chosenAnswer && !forcedTimedOut) {
            pronounce(chosenAnswer, answerLangFor(language, translationDirection));
        }

        try {
            const synced = await api.submitAttempt({
                word_id: currentPracticeWord.id,
                language,
                is_correct: isCorrect,
                current_streak: nextStreak,
            });

            setProgressMap((prev) => ({
                ...prev,
                [String(currentPracticeWord.id)]: {
                    word_id: synced.word_id,
                    jumlah_benar: synced.jumlah_benar,
                    jumlah_salah: synced.jumlah_salah,
                    correct_streak: synced.correct_streak,
                    max_streak: synced.max_streak,
                    is_mastered: synced.is_mastered,
                },
            }));
        } catch {
            notify.error(t("tenant.games.vocabulary.error.sync_attempt_failed"));
        }

        // Store whether it was correct for UI
        // If it's correct, autoadvance shortly (as requested by user, correct -> auto next)
        // If wrong, wait for manual continue (no timer set here!)

        if (isCorrect) {
            answerLockTimerRef.current = window.setTimeout(() => {
                const isTargetReached = nextAttempts.length >= sessionQuestionTarget;
                const allDayWordsMastered = !isMemoryTest && isDayMastered(dayWords, nextProgressMap);

                if (isTargetReached || allDayWordsMastered) {
                    setPhase("summary");
                    if (allDayWordsMastered) {
                        setShowMemoryTestDialog(true);
                    }
                    void finishSession(nextAttempts);
                    return;
                }

                const nextQuestion = generateNextQuestion(dayWords, nextProgressMap, isMemoryTest);
                if (!nextQuestion) {
                    setPhase("summary");
                    void finishSession(nextAttempts);
                    return;
                }

                setCurrentPracticeWord(createPracticeWordInstance(nextQuestion));
            }, 1500);
        }
    }, [
        answerLockTimerRef, api, attempts, autoTts, currentPracticeWord, dayWords, finishSession,
        feedbackVoiceTimerRef, getNextFeedbackMessage, i18n.language, isAnswerLocked, isMemoryTest,
        language, masteredThreshold, practiceOptions, progressMap, pronounce, sessionQuestionTarget,
        clearAnswerLockTimer, clearFeedbackVoiceTimer, clearPracticeTimer, setProgressMap, speak, t,
        translationDirection, voiceEnabled, generateNextQuestion, createPracticeWordInstance
    ]);

    const continuePractice = useCallback(() => {
        clearAnswerLockTimer();
        if (!currentPracticeWord || !isAnswerLocked) {
            return;
        }

        const isTargetReached = attempts.length >= sessionQuestionTarget;

        if (isTargetReached) {
            setPhase("summary");
            const allNowMastered = !isMemoryTest && isDayMastered(dayWords, progressMap);
            if (allNowMastered) {
                setShowMemoryTestDialog(true);
            }
            void finishSession(attempts);
            return;
        }

        const nextQuestion = generateNextQuestion(dayWords, progressMap, isMemoryTest);
        if (!nextQuestion) {
            setPhase("summary");
            if (!isMemoryTest) {
                setShowMemoryTestDialog(true);
            }
            void finishSession(attempts);
            return;
        }

        setCurrentPracticeWord(createPracticeWordInstance(nextQuestion));
    }, [
        clearAnswerLockTimer, currentPracticeWord, isAnswerLocked, attempts, sessionQuestionTarget,
        dayWords, progressMap, isMemoryTest, finishSession, generateNextQuestion, createPracticeWordInstance
    ]);

    useEffect(() => {
        clearPracticeTimer();

        if (phase !== "practice" || countdownState !== null || !currentPracticeWord || isAnswerLocked) {
            return;
        }

        timerRef.current = window.setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearPracticeTimer();
                    void submitPracticeAnswer(null, true);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearPracticeTimer();
    }, [clearPracticeTimer, countdownState, currentPracticeWord, isAnswerLocked, phase, submitPracticeAnswer, timerRef]);

    useEffect(() => {
        resetFeedback();
    }, [currentPracticeWord, phase, resetFeedback]);

    const currentStreak = useMemo(() => {
        if (!currentPracticeWord) {
            return 0;
        }

        return progressMap[String(currentPracticeWord.id)]?.correct_streak ?? 0;
    }, [currentPracticeWord, progressMap]);

    const bestStreak = useMemo(() => (
        attempts.reduce((max, attempt) => Math.max(max, attempt.streakAfter), 0)
    ), [attempts]);

    const totalQuestions = attempts.length;
    const sessionCorrectCount = attempts.filter((attempt) => attempt.isCorrect).length;
    const scorePercent = totalQuestions > 0 ? Math.round((sessionCorrectCount / totalQuestions) * 100) : 0;
    const selectedCategoryLabel = selectedCategory || "-";
    const isLevelMastered = useMemo(() => (
        dayWords.length > 0 && dayWords.every((word) => progressMap[String(word.id)]?.is_mastered === true)
    ), [dayWords, progressMap]);
    const isSessionActive = phase === "learn" || phase === "practice";

    return {
        isLoadingConfig,
        config,
        settingsMap,
        phase,
        language,
        mode,
        selectedCategory,
        selectedDay,
        autoTts,
        questionCount,
        sessionQuestionTarget,
        timeLimit,
        translationDirection,
        masteredThreshold,
        dayWords,
        poolWords,
        progressMap,
        learnIndex,
        isFlipped,
        practiceOptions,
        selectedOption,
        correctOption,
        isAnswerLocked,
        attempts,
        isStartingSession,
        startedAt,
        isSavingSummary,
        countdownState,
        timeRemaining,
        feedbackState,
        voiceEnabled,
        categoryOptions,
        daysForCategory,
        masteredDaysForCategory,
        hasCategories,
        hasDaysInSelectedCategory,
        currentLearnWord,
        currentPracticeWord,
        currentStreak,
        bestStreak,
        selectedCategoryLabel,
        totalQuestions,
        correctCount: sessionCorrectCount,
        scorePercent,
        isLevelMastered,
        isSessionActive,
        isMemoryTest,
        showMemoryTestDialog,
        setShowMemoryTestDialog,
        setLanguage,
        setMode,
        setSelectedCategory,
        setSelectedDay,
        setAutoTts,
        setTimeLimit,
        setTranslationDirection,
        setLearnIndex,
        setIsFlipped,
        handleFeedbackDone: resetFeedback,
        startLearnMode,
        startPracticeMode,
        startMemoryTest,
        submitPracticeAnswer: async (selectedIdx: number) => {
            await submitPracticeAnswer(selectedIdx, false);
        },
        continuePractice,
        leaveToSetup,
        pronounce,
    };
};

export default useVocabularyGameController;
