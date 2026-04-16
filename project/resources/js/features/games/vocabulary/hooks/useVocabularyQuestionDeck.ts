import { useCallback, useRef } from "react";

import { VocabularyWordDto } from "../data/api/vocabularyApi";
import { shuffle } from "../utils/vocabularyGame";

export const useVocabularyQuestionDeck = () => {
    const randomDeckRef = useRef<VocabularyWordDto[]>([]);
    const lastPickedWordIdRef = useRef<number | null>(null);

    const resetDeck = useCallback(() => {
        randomDeckRef.current = [];
        lastPickedWordIdRef.current = null;
    }, []);

    const rebuildDeck = useCallback((candidates: VocabularyWordDto[]) => {
        const shuffled = shuffle(candidates);
        const lastPickedId = lastPickedWordIdRef.current;

        // If the first card of the new deck is the same as the last picked one
        if (lastPickedId !== null && shuffled.length > 1 && shuffled[0].id === lastPickedId) {
            // Swap it with another random card
            const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
            [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
        }

        randomDeckRef.current = shuffled;
    }, []);

    const generateNextQuestion = useCallback((
        dayWords: VocabularyWordDto[],
        progressMap: Record<string, { is_mastered?: boolean }>,
        isMemoryTest?: boolean,
    ): VocabularyWordDto | null => {
        // Filter candidates that are not mastered yet
        const unmasteredWords = dayWords.filter((word) => (
            isMemoryTest || progressMap[String(word.id)]?.is_mastered !== true
        ));

        if (unmasteredWords.length === 0) {
            return null;
        }

        if (randomDeckRef.current.length === 0) {
            rebuildDeck(unmasteredWords);
        }

        let selectedWord: VocabularyWordDto | null = null;
        let guard = 0;
        
        while (selectedWord === null && guard < 100) {
            guard += 1;
            const next = randomDeckRef.current.shift();
            
            if (next === undefined) {
                // Deck is empty but unmasteredWords.length > 0
                rebuildDeck(unmasteredWords);
                continue;
            }

            // Real-time check: is this word already mastered?
            if (!isMemoryTest && progressMap[String(next.id)]?.is_mastered === true) {
                continue;
            }

            selectedWord = next;
        }

        if (selectedWord === null) {
            return null;
        }

        lastPickedWordIdRef.current = selectedWord.id;

        return selectedWord;
    }, [rebuildDeck]);

    return { generateNextQuestion, resetDeck };
};
