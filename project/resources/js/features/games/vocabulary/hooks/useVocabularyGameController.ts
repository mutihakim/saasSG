import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useGameFeedbackMessages from "../../shared/hooks/useGameFeedbackMessages";
import useVoiceFeedback from "../../shared/hooks/useVoiceFeedback";
import { createVocabularyApi, type VocabularyConfigResponse, type VocabularyLanguage, type VocabularyMode, type VocabularyProgressDto, type VocabularyTranslationDirection, type VocabularyWordDto } from "../data/api/vocabularyApi";
import type { VocabularyAttemptResult, VocabularyController, VocabularyFeedbackState, VocabularySettingsMap } from "../types";
import { answerLangFor, answerTextFor, buildOptionSet, promptTextFor, shuffle } from "../utils/vocabularyGame";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

const initialFeedbackState: VocabularyFeedbackState = {
    show: false,
    isCorrect: false,
    isTimedOut: false,
    message: "",
    correctAnswer: null,
};

const ANSWER_LOCK_MS = 2000;

const normalizeProgress = (
    current: VocabularyProgressDto | undefined,
    isCorrect: boolean,
    nextStreak: number,
    masteredThreshold: number,
): VocabularyProgressDto => ({
    word_id: current?.word_id ?? 0,
    jumlah_benar: (current?.jumlah_benar ?? 0) + (isCorrect ? 1 : 0),
    jumlah_salah: (current?.jumlah_salah ?? 0) + (isCorrect ? 0 : 1),
    correct_streak: nextStreak,
    max_streak: Math.max(current?.max_streak ?? 0, nextStreak),
    is_mastered: Math.max(current?.max_streak ?? 0, nextStreak) >= masteredThreshold,
});

const useVocabularyGameController = (): VocabularyController => {
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);
    const { speak, isEnabled: voiceEnabled } = useVoiceFeedback();
    const { getNextFeedbackMessage } = useGameFeedbackMessages();

    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [config, setConfig] = useState<VocabularyConfigResponse | null>(null);
    const [settingsMap, setSettingsMap] = useState<VocabularySettingsMap>({});
    const [phase, setPhase] = useState<"setup" | "learn" | "practice" | "summary">("setup");
    const [language, setLanguage] = useState<VocabularyLanguage>("english");
    const [mode, setMode] = useState<VocabularyMode>("learn");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedDay, setSelectedDay] = useState(1);
    const [autoTts, setAutoTts] = useState(true);
    const [timeLimit, setTimeLimit] = useState(8);
    const [translationDirection, setTranslationDirection] = useState<VocabularyTranslationDirection>("id_to_target");
    const [masteredThreshold, setMasteredThreshold] = useState(8);
    const [dayWords, setDayWords] = useState<VocabularyWordDto[]>([]);
    const [poolWords, setPoolWords] = useState<VocabularyWordDto[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, VocabularyProgressDto>>({});
    const [learnIndex, setLearnIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [practiceQueue, setPracticeQueue] = useState<VocabularyWordDto[]>([]);
    const [practiceIndex, setPracticeIndex] = useState(0);
    const [practiceOptions, setPracticeOptions] = useState<string[]>([]);
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

    const answerLockTimerRef = useRef<number | null>(null);
    const countdownTimerRef = useRef<number | null>(null);
    const feedbackVoiceTimerRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);

    const clearAnswerLockTimer = useCallback(() => {
        if (answerLockTimerRef.current) {
            window.clearTimeout(answerLockTimerRef.current);
            answerLockTimerRef.current = null;
        }
    }, []);

    const clearCountdownTimer = useCallback(() => {
        if (countdownTimerRef.current) {
            window.clearTimeout(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
    }, []);

    const clearPracticeTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const clearFeedbackVoiceTimer = useCallback(() => {
        if (feedbackVoiceTimerRef.current) {
            window.clearTimeout(feedbackVoiceTimerRef.current);
            feedbackVoiceTimerRef.current = null;
        }
    }, []);

    const resetFeedback = useCallback(() => {
        setFeedbackState(initialFeedbackState);
    }, []);

    useEffect(() => () => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer]);

    const loadConfig = useCallback(async () => {
        setIsLoadingConfig(true);

        try {
            const response = await api.fetchConfig();
            setConfig(response.config);
            setSettingsMap(response.settings);

            const initialLanguage = response.config.languages[0]?.value ?? "english";
            setLanguage(initialLanguage);

            const firstCategory = response.config.categories[0];
            if (firstCategory) {
                setSelectedCategory(firstCategory.category);
                setSelectedDay(firstCategory.days[0] ?? 1);
            }

            const activeSetting = response.settings[initialLanguage];
            if (activeSetting) {
                setMode(activeSetting.default_mode);
                setAutoTts(activeSetting.auto_tts);
                setTimeLimit(activeSetting.default_time_limit);
                setTranslationDirection(activeSetting.translation_direction);
                setMasteredThreshold(activeSetting.mastered_threshold);
            } else {
                setMode("learn");
                setAutoTts(true);
                setTimeLimit(response.config.default_time_limit ?? 8);
                setTranslationDirection("id_to_target");
                setMasteredThreshold(response.config.default_mastered_threshold ?? 8);
            }
        } catch {
            notify.error("Gagal memuat konfigurasi vocabulary.");
        } finally {
            setIsLoadingConfig(false);
        }
    }, [api]);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    const categoryOptions = useMemo(() => (
        (config?.categories ?? []).map((item) => ({
            key: item.category,
            label: item.category,
            count: item.total_days,
        }))
    ), [config?.categories]);

    const daysForCategory = useMemo(
        () => config?.categories.find((item) => item.category === selectedCategory)?.days ?? [],
        [config?.categories, selectedCategory],
    );

    const hasCategories = categoryOptions.length > 0;
    const hasDaysInSelectedCategory = daysForCategory.length > 0;

    useEffect(() => {
        if (daysForCategory.length > 0 && !daysForCategory.includes(selectedDay)) {
            setSelectedDay(daysForCategory[0] ?? 1);
        }
    }, [daysForCategory, selectedDay]);

    useEffect(() => {
        const activeSetting = settingsMap[language];
        if (activeSetting) {
            setMode(activeSetting.default_mode);
            setAutoTts(activeSetting.auto_tts);
            setTimeLimit(activeSetting.default_time_limit);
            setTranslationDirection(activeSetting.translation_direction);
            setMasteredThreshold(activeSetting.mastered_threshold);
            return;
        }

        if (config) {
            setMode("learn");
            setTimeLimit(config.default_time_limit ?? 8);
            setTranslationDirection("id_to_target");
            setMasteredThreshold(config.default_mastered_threshold ?? 8);
        }
    }, [config, language, settingsMap]);

    const fetchDayWords = useCallback(async () => {
        if (!selectedCategory || !selectedDay) {
            return {
                words: [] as VocabularyWordDto[],
                progress: {} as Record<string, VocabularyProgressDto>,
            };
        }

        const response = await api.fetchWords({
            language,
            category: selectedCategory,
            day: selectedDay,
        });

        setDayWords(response.words);
        setProgressMap(response.progress);

        return response;
    }, [api, language, selectedCategory, selectedDay]);

    const pronounce = useCallback((text: string, lang: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis || !text) {
            return;
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }, []);

    const resetPracticeState = useCallback(() => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();
        setPracticeQueue([]);
        setPoolWords([]);
        setPracticeIndex(0);
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
        resetFeedback();
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer, resetFeedback]);

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
                notify.info("Belum ada kata untuk konfigurasi ini.");
                return;
            }

            setLearnIndex(0);
            setIsFlipped(false);
            setPhase("learn");
        } catch {
            notify.error("Gagal memuat kata untuk Learn Mode.");
        } finally {
            setIsStartingSession(false);
        }
    }, [fetchDayWords]);

    const initializePracticeSession = useCallback((
        words: VocabularyWordDto[],
        pool: VocabularyWordDto[],
        nextIsMemoryTest: boolean,
    ) => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();
        setPoolWords(pool);
        setPracticeQueue(shuffle(words));
        setPracticeIndex(0);
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
        resetFeedback();
        setPhase("practice");
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer, resetFeedback, timeLimit]);

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

            initializePracticeSession(candidateWords, pool, forceMemoryTest);
        } catch {
            notify.error(forceMemoryTest ? "Gagal memulai Tes Ingatan." : "Gagal memulai Practice Mode.");
        } finally {
            setIsStartingSession(false);
        }
    }, [api, clearAnswerLockTimer, fetchDayWords, initializePracticeSession, language, selectedCategory]);

    const startMemoryTest = useCallback(async () => {
        await startPracticeMode(true);
    }, [startPracticeMode]);

    const currentLearnWord = dayWords[learnIndex] ?? null;
    const currentPracticeWord = practiceQueue[practiceIndex] ?? null;

    useEffect(() => {
        if (phase !== "practice" || !currentPracticeWord) {
            return;
        }

        const options = buildOptionSet(currentPracticeWord, language, translationDirection, poolWords);
        if (options.length < 2) {
            notify.error("Pilihan jawaban tidak cukup untuk latihan.");
            leaveToSetup();
            return;
        }

        setPracticeOptions(options);
        setSelectedOption(null);
        setCorrectOption(null);
        setIsAnswerLocked(false);
        setTimeRemaining(timeLimit);
    }, [currentPracticeWord, language, leaveToSetup, phase, poolWords, timeLimit, translationDirection]);

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
    }, [clearCountdownTimer, countdownState, timeLimit]);

    const finishSession = useCallback(async (nextAttempts: VocabularyAttemptResult[]) => {
        if (!selectedCategory || !selectedDay || !startedAt || nextAttempts.length === 0 || isMemoryTest) {
            return;
        }

        const correctCount = nextAttempts.filter((attempt) => attempt.isCorrect).length;
        const wrongCount = nextAttempts.length - correctCount;

        setIsSavingSummary(true);
        try {
            await api.finishSession({
                language,
                mode: "practice",
                category: selectedCategory,
                day: selectedDay,
                question_count: nextAttempts.length,
                correct_count: correctCount,
                wrong_count: wrongCount,
                best_streak: nextAttempts.reduce((max, attempt) => Math.max(max, attempt.streakAfter), 0),
                duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
                started_at: new Date(startedAt).toISOString(),
                finished_at: new Date().toISOString(),
                summary: {
                    attempts: nextAttempts.map((attempt) => ({
                        word_id: attempt.wordId,
                        correct: attempt.isCorrect,
                        selected_answer: attempt.selectedAnswer,
                    })),
                },
            });
        } catch {
            notify.error("Ringkasan latihan gagal disimpan.");
        } finally {
            setIsSavingSummary(false);
        }
    }, [api, isMemoryTest, language, selectedCategory, selectedDay, startedAt]);

    const submitPracticeAnswer = useCallback(async (selectedIdx: number | null, forcedTimedOut = false) => {
        if (!currentPracticeWord || isAnswerLocked) {
            return;
        }

        const correctAnswer = answerTextFor(currentPracticeWord, language, translationDirection);
        const chosenAnswer = selectedIdx === null ? "" : (practiceOptions[selectedIdx] ?? "");
        const isCorrect = !forcedTimedOut && chosenAnswer === correctAnswer;
        const previousProgress = progressMap[String(currentPracticeWord.id)];
        const nextStreak = isCorrect ? ((previousProgress?.correct_streak ?? 0) + 1) : 0;
        const nextProgress = normalizeProgress(previousProgress, isCorrect, nextStreak, masteredThreshold);
        const resolvedCorrectOption = practiceOptions.findIndex((option) => option === correctAnswer);
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
        });

        if (voiceEnabled) {
            feedbackVoiceTimerRef.current = window.setTimeout(() => {
                speak(feedbackMessage);
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
            notify.error("Sinkronisasi jawaban gagal, tapi sesi tetap lanjut.");
        }

        answerLockTimerRef.current = window.setTimeout(() => {
            const isLastQuestion = practiceIndex + 1 >= practiceQueue.length;

            if (isLastQuestion) {
                setPhase("summary");
                const allDayWordsMastered = dayWords.length > 0 && dayWords.every((word) => (
                    progressMap[String(word.id)]?.is_mastered
                    || word.id === currentPracticeWord.id
                ));
                if (allDayWordsMastered && !isMemoryTest) {
                    setShowMemoryTestDialog(true);
                }
                void finishSession(nextAttempts);
                return;
            }

            setPracticeIndex((prev) => prev + 1);
        }, ANSWER_LOCK_MS);
    }, [
        api,
        attempts,
        autoTts,
        currentPracticeWord,
        dayWords,
        finishSession,
        getNextFeedbackMessage,
        isAnswerLocked,
        isMemoryTest,
        language,
        masteredThreshold,
        practiceIndex,
        practiceOptions,
        practiceQueue.length,
        progressMap,
        pronounce,
        clearAnswerLockTimer,
        clearFeedbackVoiceTimer,
        clearPracticeTimer,
        speak,
        translationDirection,
        voiceEnabled,
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
    }, [clearPracticeTimer, countdownState, currentPracticeWord, isAnswerLocked, phase, submitPracticeAnswer]);

    useEffect(() => {
        resetFeedback();
    }, [practiceIndex, phase, resetFeedback]);

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
    const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const selectedCategoryLabel = selectedCategory || "-";
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
        timeLimit,
        translationDirection,
        masteredThreshold,
        dayWords,
        poolWords,
        progressMap,
        learnIndex,
        isFlipped,
        practiceQueue,
        practiceIndex,
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
        hasCategories,
        hasDaysInSelectedCategory,
        currentLearnWord,
        currentPracticeWord,
        currentStreak,
        bestStreak,
        selectedCategoryLabel,
        totalQuestions,
        correctCount,
        scorePercent,
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
        leaveToSetup,
        pronounce,
    };
};

export default useVocabularyGameController;
