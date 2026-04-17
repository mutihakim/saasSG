import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createGamesApi, MathConfigResponse, MathPairStats } from "../data/api/gamesApi";
import type { MathGameOperator, MathGameScreen, MathGameSetupState, MathOperatorMetaMap } from "../types";
import { buildPossiblePairs, buildRangeOptions, pairKeyOf } from "../utils/mathGame";

import { useMathAttemptSync } from "./useMathAttemptSync";
import useMathGame from "./useMathGame";
import { useMathGameFeedback } from "./useMathGameFeedback";
import { useMathSessionPersistence } from "./useMathSessionPersistence";
import useVoiceFeedback from "./useVoiceFeedback";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

export const useMathGameController = () => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);
    const game = useMathGame();
    const { speak, isEnabled: voiceEnabled } = useVoiceFeedback();

    const [mathConfig, setMathConfig] = useState<MathConfigResponse | null>(null);
    const [setup, setSetup] = useState<MathGameSetupState | null>(null);
    const [screen, setScreen] = useState<MathGameScreen>("setup");
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [countdownState, setCountdownState] = useState<"yellow" | "green" | null>(null);
    const [showMemoryTestDialog, setShowMemoryTestDialog] = useState(false);
    const masteredToastShownRef = useRef(false);

    const operatorMeta = useMemo<MathOperatorMetaMap>(() => ({
        "+": { label: t("tenant.games.math.operator.addition"), softClass: "btn-soft-success", textClass: "text-success", iconClass: "ri-add-fill" },
        "-": { label: t("tenant.games.math.operator.subtraction"), softClass: "btn-soft-warning", textClass: "text-warning", iconClass: "ri-subtract-fill" },
        "*": { label: t("tenant.games.math.operator.multiplication"), softClass: "btn-soft-danger", textClass: "text-danger", iconClass: "ri-close-fill" },
        "/": { label: t("tenant.games.math.operator.division"), softClass: "btn-soft-info", textClass: "text-info", iconClass: "ri-divide-fill" },
    }), [t]);

    const { feedbackState, handleFeedbackDone, resetFeedback } = useMathGameFeedback({
        attempts: game.attempts,
        setup,
        speak,
        voiceEnabled,
    });

    const { flushPendingAttemptQueue, resetAttemptSync } = useMathAttemptSync({
        attempts: game.attempts,
        gamesApi,
        setup,
        syncPairStats: game.syncPairStats,
    });

    const { persistPartialSessionOnLeave, resetSessionPersistence, summaryStats } = useMathSessionPersistence({
        attempts: game.attempts,
        finishedAt: game.finishedAt,
        flushPendingAttemptQueue,
        gamesApi,
        isFinished: game.isFinished,
        questionsLength: game.questions.length,
        result: game.result,
        setup,
        startedAt: game.startedAt,
    });

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        setLoadFailed(false);

        try {
            const cfg = await gamesApi.fetchMathConfig();
            const firstNumber = cfg.number_options[0] ?? 1;
            setMathConfig(cfg);
            setSetup({
                operator: cfg.operators[0]?.value ?? "+",
                mode: cfg.modes[0]?.value ?? "mencariC",
                numberRangeStart: firstNumber,
                numberRange: firstNumber,
                randomRange: firstNumber,
                questionCount: 10,
                timeLimit: 5,
            });
        } catch {
            setLoadFailed(true);
            notify.error(t("tenant.games.math.load_error_toast"));
        } finally {
            setIsLoading(false);
        }
    }, [gamesApi, t]);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    const runStartGame = useCallback(async (state: MathGameSetupState, isMemoryTest = false) => {
        setIsStarting(true);

        try {
            const settings = await gamesApi.fetchMathSettings(state.operator);
            const setting = settings.find((item) => item.operator === state.operator);
            const defaultMode = setting?.default_mode ?? state.mode;
            const defaultQuestionCount = setting?.default_question_count ?? state.questionCount;
            const defaultTimeLimit = setting?.default_time_limit ?? state.timeLimit;
            const masteryThreshold = setting?.mastered_threshold ?? mathConfig?.mastered_streak_threshold ?? 8;
            const possiblePairs = buildPossiblePairs(state.operator, state.numberRange, state.randomRange);
            const stats: Record<string, MathPairStats> = await gamesApi.fetchMathStats(possiblePairs).catch(() => ({}));
            const pairStreaks: Record<string, number> = {};
            const masteredKeys: string[] = [];

            for (const pair of possiblePairs) {
                const key = pairKeyOf(pair.operator, pair.angka_pilihan, pair.angka_random);
                const pairStat = stats[key];
                pairStreaks[key] = pairStat?.current_streak_benar ?? 0;
                if (pairStat?.mastered) {
                    masteredKeys.push(key);
                }
            }

            setSetup((prev) => (prev ? { ...prev, operator: state.operator, numberRange: state.numberRange, randomRange: state.randomRange, mode: defaultMode, questionCount: defaultQuestionCount, timeLimit: defaultTimeLimit } : prev));
            resetFeedback();
            resetAttemptSync();
            resetSessionPersistence();
            masteredToastShownRef.current = false;

            game.startGame({
                operator: state.operator,
                mode: defaultMode,
                numberRange: state.numberRange,
                randomRange: state.randomRange,
                questionCount: defaultQuestionCount,
                timeLimit: defaultTimeLimit,
            }, { masteredPairs: masteredKeys, pairStreaks, masteryThreshold, isMemoryTest, startPaused: true });
            setCountdownState("yellow");
        } catch {
            notify.error(t("tenant.games.math.start_failed_toast"));
        } finally {
            setIsStarting(false);
        }
    }, [game, gamesApi, mathConfig?.mastered_streak_threshold, resetAttemptSync, resetFeedback, resetSessionPersistence, t]);

    useEffect(() => {
        if (countdownState === "yellow") {
            const timer = setTimeout(() => setCountdownState("green"), 800);
            return () => clearTimeout(timer);
        }
        if (countdownState === "green") {
            const timer = setTimeout(() => {
                setCountdownState(null);
                game.resume();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [countdownState, game]);

    useEffect(() => {
        const hasRunningSession = game.questions.length > 0;
        if (!game.allPairsMastered || hasRunningSession || masteredToastShownRef.current || isStarting) {
            return;
        }

        setShowMemoryTestDialog(true);
        masteredToastShownRef.current = true;
    }, [game.allPairsMastered, game.questions.length, isStarting]);

    useEffect(() => {
        if (!game.currentQuestion || game.isLocked || game.isFinished) {
            return;
        }

        if (game.userAnswer.length >= game.currentQuestion.answer.toString().length) {
            game.submitAnswer();
        }
    }, [game]);

    useEffect(() => {
        resetFeedback();
    }, [game.currentIndex, game.isFinished, resetFeedback]);

    const rangeOptions = useMemo(() => buildRangeOptions(mathConfig?.number_options ?? []), [mathConfig?.number_options]);
    const hasRunningSession = game.questions.length > 0;
    const isCountdownActive = countdownState !== null;

    return {
        ...game,
        feedbackState,
        mathConfig,
        setup,
        setSetup,
        screen,
        setScreen,
        isLoading,
        isStarting,
        loadFailed,
        summaryStats,
        countdownState,
        isCountdownActive,
        hasRunningSession,
        isSessionActive: (hasRunningSession && !game.isFinished && Boolean(game.currentQuestion)) || isCountdownActive,
        showMemoryTestDialog,
        setShowMemoryTestDialog,
        operatorMeta,
        rangeOptions,
        loadConfig,
        runStartGame,
        persistPartialSessionOnLeave,
        handleFeedbackDone,
        handleOperatorSelect: (operator: MathGameOperator) => {
            setSetup((prev) => (prev ? { ...prev, operator } : prev));
            setScreen("setup");
        },
    };
};
