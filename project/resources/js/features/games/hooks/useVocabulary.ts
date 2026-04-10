import { useCallback, useState } from "react";

import type { VocabularyWord, VocabularyProgress } from "../types";

type UseVocabularyReturn = {
    words: VocabularyWord[];
    progress: VocabularyProgress[];
    currentWordIndex: number;
    isFlipped: boolean;
    isQuizMode: boolean;
    quizScore: number;
    quizTotal: number;
    flipCard: () => void;
    nextWord: () => void;
    prevWord: () => void;
    submitQuizAnswer: (selectedIndex: number) => void;
    toggleQuizMode: () => void;
    pronounce: (text: string, lang: string) => void;
};

/**
 * Manages vocabulary learning state: flashcard navigation, quiz mode,
 * pronunciation via TTS, and mastery progress tracking.
 */
const useVocabulary = (): UseVocabularyReturn => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [words, _setWords] = useState<VocabularyWord[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [progress, _setProgress] = useState<VocabularyProgress[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [quizTotal, setQuizTotal] = useState(0);

    const flipCard = useCallback(() => {
        setIsFlipped((prev) => !prev);
    }, []);

    const nextWord = useCallback(() => {
        setCurrentWordIndex((prev) => Math.min(prev + 1, words.length - 1));
        setIsFlipped(false);
    }, [words.length]);

    const prevWord = useCallback(() => {
        setCurrentWordIndex((prev) => Math.max(prev - 1, 0));
        setIsFlipped(false);
    }, []);

    const submitQuizAnswer = useCallback((_selectedIndex: number) => {
        // TODO: validate answer and update streak/mastery
        setQuizTotal((prev) => prev + 1);
    }, []);

    const toggleQuizMode = useCallback(() => {
        setIsQuizMode((prev) => !prev);
        setQuizScore(0);
        setQuizTotal(0);
    }, []);

    const pronounce = useCallback((text: string, lang: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }, []);

    return {
        words,
        progress,
        currentWordIndex,
        isFlipped,
        isQuizMode,
        quizScore,
        quizTotal,
        flipCard,
        nextWord,
        prevWord,
        submitQuizAnswer,
        toggleQuizMode,
        pronounce,
    };
};

export default useVocabulary;
