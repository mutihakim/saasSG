import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import useGameFeedbackMessages from "../../shared/hooks/useGameFeedbackMessages";
import type { MathAttemptEntry, MathFeedbackState, MathGameSetupState } from "../types";

const initialFeedbackState: MathFeedbackState = { show: false, isCorrect: false, message: "" };

type Props = {
    attempts: MathAttemptEntry[];
    setup: MathGameSetupState | null;
    speak: (message: string, lang?: string) => void;
    voiceEnabled: boolean;
};

export const useMathGameFeedback = ({ attempts, setup, speak, voiceEnabled }: Props) => {
    const { i18n } = useTranslation();
    const [feedbackState, setFeedbackState] = useState<MathFeedbackState>(initialFeedbackState);
    const lastSpokenAttemptIndexRef = useRef<number>(-1);
    const { getNextFeedbackMessage } = useGameFeedbackMessages();

    const resetFeedback = useCallback(() => {
        lastSpokenAttemptIndexRef.current = -1;
        setFeedbackState(initialFeedbackState);
    }, []);

    useEffect(() => {
        if (attempts.length === 0 || !setup) {
            lastSpokenAttemptIndexRef.current = -1;
            return;
        }

        const currentAttemptIndex = attempts.length - 1;
        if (currentAttemptIndex <= lastSpokenAttemptIndexRef.current) {
            return;
        }

        lastSpokenAttemptIndexRef.current = currentAttemptIndex;
        const latestAttempt = attempts[currentAttemptIndex];
        if (!latestAttempt) {
            return;
        }

        const message = getNextFeedbackMessage(latestAttempt.isCorrect);

        if (voiceEnabled) {
            const langMap: Record<string, string> = {
                en: "en-US",
                id: "id-ID",
            };
            speak(message, langMap[i18n.language] || i18n.language);
        }

        const timer = window.setTimeout(() => {
            setFeedbackState({
                show: true,
                isCorrect: latestAttempt.isCorrect,
                message,
                correctAnswer: latestAttempt.isCorrect ? null : latestAttempt.question.answer,
            });
        }, 0);

        return () => window.clearTimeout(timer);
    }, [attempts, getNextFeedbackMessage, i18n.language, setup, speak, voiceEnabled]);

    return {
        feedbackState,
        handleFeedbackDone: () => setFeedbackState((prev) => ({ ...prev, show: false })),
        resetFeedback,
    };
};
