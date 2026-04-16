import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

type UseCurriculumTimersReturn = {
    answerLockTimerRef: MutableRefObject<number | null>;
    countdownTimerRef: MutableRefObject<number | null>;
    timerRef: MutableRefObject<number | null>;
    clearAnswerLockTimer: () => void;
    clearCountdownTimer: () => void;
    clearPracticeTimer: () => void;
};

const useCurriculumTimers = (): UseCurriculumTimersReturn => {
    const answerLockTimerRef = useRef<number | null>(null);
    const countdownTimerRef = useRef<number | null>(null);
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

    useEffect(() => () => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearPracticeTimer();
    }, [clearAnswerLockTimer, clearCountdownTimer, clearPracticeTimer]);

    return {
        answerLockTimerRef,
        countdownTimerRef,
        timerRef,
        clearAnswerLockTimer,
        clearCountdownTimer,
        clearPracticeTimer,
    };
};

export default useCurriculumTimers;
