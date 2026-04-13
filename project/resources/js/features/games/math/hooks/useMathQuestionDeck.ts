import { useCallback, useRef } from "react";

import type { MathGameConfig, MathQuestion } from "../types";
import { createQuestion, pairKeyOf, randomCandidatesFor, shuffle } from "../utils/mathGame";

export const useMathQuestionDeck = (masteredPairs: string[]) => {
    const randomDeckRef = useRef<number[]>([]);
    const lastPickedRandomRef = useRef<number | null>(null);

    const resetDeck = useCallback(() => {
        randomDeckRef.current = [];
        lastPickedRandomRef.current = null;
    }, []);

    const rebuildDeck = useCallback((candidates: number[]) => {
        const shuffled = shuffle(candidates);
        const lastPicked = lastPickedRandomRef.current;

        if (lastPicked !== null && shuffled.length > 1 && shuffled[0] === lastPicked) {
            const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
            [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
        }

        randomDeckRef.current = shuffled;
    }, []);

    const generateNextQuestion = useCallback((
        gameConfig: MathGameConfig,
        masterySetInput?: Set<string>,
        ignoreMastery?: boolean,
    ): MathQuestion | null => {
        const masterySet = masterySetInput ?? new Set(masteredPairs);
        const possibleRandoms = randomCandidatesFor(gameConfig);
        const unmasteredRandoms = possibleRandoms.filter((angkaRandom) => (
            ignoreMastery || !masterySet.has(pairKeyOf(gameConfig.operator, gameConfig.numberRange, angkaRandom))
        ));

        if (unmasteredRandoms.length === 0) {
            return null;
        }

        if (randomDeckRef.current.length === 0) {
            rebuildDeck(unmasteredRandoms);
        }

        let selectedRandom: number | null = null;
        let guard = 0;
        while (selectedRandom === null && guard < 30) {
            guard += 1;
            const next = randomDeckRef.current.shift();
            if (next === undefined) {
                rebuildDeck(unmasteredRandoms);
                continue;
            }

            const key = pairKeyOf(gameConfig.operator, gameConfig.numberRange, next);
            if (!ignoreMastery && masterySet.has(key)) {
                continue;
            }

            selectedRandom = next;
        }

        if (selectedRandom === null) {
            return null;
        }

        lastPickedRandomRef.current = selectedRandom;

        return createQuestion(gameConfig, gameConfig.numberRange, selectedRandom);
    }, [masteredPairs, rebuildDeck]);

    return { generateNextQuestion, resetDeck };
};
