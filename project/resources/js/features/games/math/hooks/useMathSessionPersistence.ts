import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GamesApi, MathFinishPayload, MathPairStats } from "../data/api/gamesApi";
import type { MathAttemptEntry, MathGameResult, MathGameSetupState } from "../types";

import { notify } from "@/core/lib/notify";

const buildSessionPayload = (
    setup: MathGameSetupState,
    attempts: MathAttemptEntry[],
    result: MathGameResult,
    startedAt: number | null,
    finishedAt?: number | null,
): MathFinishPayload => ({
    operator: setup.operator,
    game_mode: setup.mode,
    number_range: setup.numberRange,
    random_range: setup.randomRange,
    question_count: result.totalQuestions,
    time_limit: setup.timeLimit,
    correct_count: result.correctCount,
    wrong_count: result.wrongCount,
    best_streak: result.bestStreak,
    duration_seconds: result.duration,
    started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
    finished_at: finishedAt ? new Date(finishedAt).toISOString() : undefined,
    summary: {
        attempts: attempts.map((attempt) => ({
            operator: attempt.question.operator,
            angka_pilihan: attempt.question.angkaPilihan,
            angka_random: attempt.question.angkaRandom,
            correct: attempt.isCorrect,
            timed_out: attempt.timedOut,
        })),
    },
});

type Props = {
    attempts: MathAttemptEntry[];
    finishedAt: number | null;
    flushPendingAttemptQueue: (maxDurationMs?: number) => Promise<void>;
    gamesApi: GamesApi;
    isFinished: boolean;
    questionsLength: number;
    result: MathGameResult;
    setup: MathGameSetupState | null;
    startedAt: number | null;
};

export const useMathSessionPersistence = ({
    attempts,
    finishedAt,
    flushPendingAttemptQueue,
    gamesApi,
    isFinished,
    questionsLength,
    result,
    setup,
    startedAt,
}: Props) => {
    const { t } = useTranslation();
    const [summaryStats, setSummaryStats] = useState<Record<string, MathPairStats>>({});
    const submittedSessionRef = useRef(false);

    const finishSession = useCallback(async (payload: MathFinishPayload) => {
        try {
            await gamesApi.finishMathSession(payload);
        } catch {
            notify.error(t("tenant.games.math.finish_failed_toast"));
        }
    }, [gamesApi, t]);

    const resetSessionPersistence = useCallback(() => {
        setSummaryStats({});
        submittedSessionRef.current = false;
    }, []);

    const persistPartialSessionOnLeave = useCallback(() => {
        if (!setup || submittedSessionRef.current || attempts.length === 0) {
            return;
        }

        submittedSessionRef.current = true;
        const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
        const wrongCount = attempts.length - correctCount;
        const bestStreak = attempts.reduce((max, attempt) => Math.max(max, attempt.streakAfter), 0);

        void (async () => {
            await flushPendingAttemptQueue(1500);
            await finishSession(buildSessionPayload(
                setup,
                attempts,
                { ...result, totalQuestions: setup.questionCount, correctCount, wrongCount, bestStreak, duration: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0 },
                startedAt,
                Date.now(),
            ));
        })();
    }, [attempts, finishSession, flushPendingAttemptQueue, result, setup, startedAt]);

    useEffect(() => {
        if (!isFinished || !setup || questionsLength === 0 || submittedSessionRef.current) {
            return;
        }

        submittedSessionRef.current = true;
        void (async () => {
            await flushPendingAttemptQueue(2000);
            await finishSession(buildSessionPayload(setup, attempts, result, startedAt, finishedAt));
        })();
    }, [attempts, finishSession, finishedAt, flushPendingAttemptQueue, isFinished, questionsLength, result, setup, startedAt]);

    useEffect(() => {
        if (!isFinished || attempts.length === 0) {
            return;
        }

        const uniquePairs = Array.from(new Map(attempts.map((attempt) => [
            attempt.question.pairKey,
            { operator: attempt.question.operator, angka_pilihan: attempt.question.angkaPilihan, angka_random: attempt.question.angkaRandom },
        ])).values());

        void gamesApi.fetchMathStats(uniquePairs).then(setSummaryStats).catch(() => setSummaryStats({}));
    }, [attempts, gamesApi, isFinished]);

    return { persistPartialSessionOnLeave, resetSessionPersistence, summaryStats };
};
