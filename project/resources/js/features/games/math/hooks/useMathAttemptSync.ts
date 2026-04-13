import { useCallback, useEffect, useRef } from "react";

import type { GamesApi, MathAttemptPayload, MathAttemptResponse } from "../data/api/gamesApi";
import type { MathAttemptEntry, MathGameSetupState, UseMathGameReturn } from "../types";

type AttemptSyncItem = {
    id: string;
    payload: MathAttemptPayload;
    pairKey: string;
};

type Props = {
    attempts: MathAttemptEntry[];
    gamesApi: GamesApi;
    setup: MathGameSetupState | null;
    syncPairStats: UseMathGameReturn["syncPairStats"];
};

export const useMathAttemptSync = ({ attempts, gamesApi, setup, syncPairStats }: Props) => {
    const syncedAttemptCountRef = useRef(0);
    const pendingAttemptSyncRef = useRef<AttemptSyncItem[]>([]);
    const flushingPendingAttemptRef = useRef(false);

    const syncAttempt = useCallback(async (item: AttemptSyncItem): Promise<boolean> => {
        try {
            const response: MathAttemptResponse = await gamesApi.submitMathAttempt(item.payload);
            syncPairStats(item.pairKey, { currentStreak: response.current_streak_benar, mastered: response.mastered });
            return true;
        } catch {
            return false;
        }
    }, [gamesApi, syncPairStats]);

    const flushPendingAttemptQueue = useCallback(async (maxDurationMs = 2000): Promise<void> => {
        if (flushingPendingAttemptRef.current) {
            return;
        }

        flushingPendingAttemptRef.current = true;
        const started = Date.now();

        try {
            while (pendingAttemptSyncRef.current.length > 0 && Date.now() - started < maxDurationMs) {
                const item = pendingAttemptSyncRef.current[0];
                if (!item || !(await syncAttempt(item))) {
                    break;
                }
                pendingAttemptSyncRef.current.shift();
            }
        } finally {
            flushingPendingAttemptRef.current = false;
        }
    }, [syncAttempt]);

    const resetAttemptSync = useCallback(() => {
        pendingAttemptSyncRef.current = [];
        flushingPendingAttemptRef.current = false;
        syncedAttemptCountRef.current = 0;
    }, []);

    useEffect(() => {
        if (attempts.length === 0 || !setup) {
            return;
        }

        let cancelled = false;
        void (async () => {
            for (let i = syncedAttemptCountRef.current; i < attempts.length; i += 1) {
                if (cancelled) {
                    return;
                }

                const attempt = attempts[i];
                const item: AttemptSyncItem = {
                    id: `${attempt.question.pairKey}|${i}`,
                    pairKey: attempt.question.pairKey,
                    payload: {
                        operator: setup.operator,
                        angka_pilihan: attempt.question.angkaPilihan,
                        angka_random: attempt.question.angkaRandom,
                        is_correct: attempt.isCorrect,
                        current_streak: attempt.streakAfter,
                    },
                };

                if (!(await syncAttempt(item))) {
                    pendingAttemptSyncRef.current.push(item);
                }
                syncedAttemptCountRef.current = i + 1;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [attempts, setup, syncAttempt]);

    useEffect(() => {
        if (!setup) {
            return;
        }

        const retryTimer = setInterval(() => {
            if (pendingAttemptSyncRef.current.length > 0 && !flushingPendingAttemptRef.current) {
                void flushPendingAttemptQueue(1200);
            }
        }, 3000);

        return () => clearInterval(retryTimer);
    }, [flushPendingAttemptQueue, setup]);

    return { flushPendingAttemptQueue, resetAttemptSync };
};
