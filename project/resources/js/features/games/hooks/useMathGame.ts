import { useCallback, useState } from "react";

type MathGameOperator = "+" | "-" | "*" | "/";
type MathGameMode = "mencariC" | "mencariB";

export interface MathQuestion {
    a: number;
    b: number;
    operator: MathGameOperator;
    answer: number;
    mode: MathGameMode;
    display: string;
}

export interface MathGameResult {
    totalQuestions: number;
    correctCount: number;
    currentStreak: number;
    bestStreak: number;
    masteredPairs: string[];
    duration: number;
}

type UseMathGameReturn = {
    questions: MathQuestion[];
    currentIndex: number;
    userAnswer: string;
    isCorrect: boolean | null;
    score: number;
    streak: number;
    bestStreak: number;
    timeRemaining: number;
    isFinished: boolean;
    submitAnswer: () => void;
    inputDigit: (digit: string) => void;
    deleteDigit: () => void;
    startGame: (config: MathGameConfig) => void;
    reset: () => void;
};

export interface MathGameConfig {
    operator: MathGameOperator;
    mode: MathGameMode;
    numberRange: number;
    questionCount: number;
    timeLimit: number;
}

/**
 * Manages math game session state: question generation, answer validation,
 * scoring, streak tracking, and mastery tracking.
 */
const useMathGame = (): UseMathGameReturn => {
    const [questions, setQuestions] = useState<MathQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const submitAnswer = useCallback(() => {
        // TODO: implement answer validation
        setUserAnswer("");
        setIsCorrect(null);
    }, []);

    const inputDigit = useCallback((digit: string) => {
        setUserAnswer((prev) => prev + digit);
    }, []);

    const deleteDigit = useCallback(() => {
        setUserAnswer((prev) => prev.slice(0, -1));
    }, []);

    const startGame = useCallback((_config: MathGameConfig) => {
        // TODO: generate questions based on config
        setIsFinished(false);
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
    }, []);

    const reset = useCallback(() => {
        setQuestions([]);
        setCurrentIndex(0);
        setUserAnswer("");
        setIsCorrect(null);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTimeRemaining(0);
        setIsFinished(false);
    }, []);

    return {
        questions,
        currentIndex,
        userAnswer,
        isCorrect,
        score,
        streak,
        bestStreak,
        timeRemaining,
        isFinished,
        submitAnswer,
        inputDigit,
        deleteDigit,
        startGame,
        reset,
    };
};

export default useMathGame;
