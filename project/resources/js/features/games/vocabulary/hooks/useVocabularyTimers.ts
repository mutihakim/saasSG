import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

type UseVocabularyTimersReturn = {
    answerLockTimerRef: MutableRefObject<number | null>;
    countdownTimerRef: MutableRefObject<number | null>;
    feedbackVoiceTimerRef: MutableRefObject<number | null>;
    timerRef: MutableRefObject<number | null>;
    clearAnswerLockTimer: () => void;
    clearCountdownTimer: () => void;
    clearFeedbackVoiceTimer: () => void;
    clearPracticeTimer: () => void;
};

const useVocabularyTimers = (): UseVocabularyTimersReturn => {
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

    useEffect(() => () => {
        clearAnswerLockTimer();
        clearCountdownTimer();
        clearFeedbackVoiceTimer();
        clearPracticeTimer();

        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [clearAnswerLockTimer, clearCountdownTimer, clearFeedbackVoiceTimer, clearPracticeTimer]);

    return {
        answerLockTimerRef,
        countdownTimerRef,
        feedbackVoiceTimerRef,
        timerRef,
        clearAnswerLockTimer,
        clearCountdownTimer,
        clearFeedbackVoiceTimer,
        clearPracticeTimer,
    };
};

export default useVocabularyTimers;
