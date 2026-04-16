import type { VocabularyProgressDto } from "../data/api/vocabularyApi";
import type { VocabularyFeedbackState } from "../types";

export const initialFeedbackState: VocabularyFeedbackState = {
    show: false,
    isCorrect: false,
    isTimedOut: false,
    message: "",
    correctAnswer: null,
    correctAnswerPhonetic: null,
};



export const normalizeProgress = (
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
    is_mastered: nextStreak >= masteredThreshold,
});
