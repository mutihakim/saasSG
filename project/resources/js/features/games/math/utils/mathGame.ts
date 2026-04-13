import type { MathAttemptEntry, MathGameConfig, MathGameMode, MathGameOperator, MathQuestion, Option } from "../types";

export const QUESTION_ADVANCE_DELAY_MS = 2000;

export const normalizeNumber = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(1, Math.min(999, Math.floor(value)));
};

export const candidateNumbers = (start: number): number[] => (
    Array.from({ length: 10 }, (_, index) => start + index)
);

export const randomCandidatesFor = (config: MathGameConfig): number[] => (
    config.operator === "-"
        ? candidateNumbers(config.numberRange)
        : candidateNumbers(config.randomRange)
);

export const pairKeyOf = (operator: MathGameOperator, angkaPilihan: number, angkaRandom: number) => (
    `${operator}|${angkaPilihan}|${angkaRandom}`
);

export const shuffle = <T,>(arr: T[]): T[] => {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
};

export const createQuestion = (
    config: MathGameConfig,
    angkaPilihan: number,
    angkaRandom: number,
): MathQuestion => {
    const { operator, mode } = config;
    let a: number;
    let b: number;
    let answer: number;
    let result: number;

    if (mode === "mencariC") {
        if (operator === "-") {
            a = angkaRandom;
            b = angkaPilihan;
        } else if (operator === "/") {
            a = angkaPilihan * angkaRandom;
            b = angkaPilihan;
        } else {
            a = angkaPilihan;
            b = angkaRandom;
        }

        answer = ({ "+": a + b, "-": a - b, "*": a * b, "/": a / b }[operator]);
        result = answer;
    } else {
        answer = angkaRandom;
        if (operator === "+") {
            a = angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan + angkaRandom;
        } else if (operator === "-") {
            a = angkaRandom + angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan;
        } else if (operator === "*") {
            a = angkaPilihan;
            b = angkaRandom;
            result = angkaPilihan * angkaRandom;
        } else {
            a = angkaPilihan * angkaRandom;
            b = angkaRandom;
            result = angkaPilihan;
        }
    }

    [a, b, answer, result] = [a, b, answer, result].map((value) => Math.round(value)) as [number, number, number, number];
    const display = mode === "mencariC" ? `${a} ${operator} ${b} = ?` : `${a} ${operator} ? = ${result}`;

    return {
        a,
        b,
        operator,
        answer,
        mode,
        display,
        result,
        angkaPilihan,
        angkaRandom,
        pairKey: pairKeyOf(operator, angkaPilihan, angkaRandom),
    };
};

export const buildRangeOptions = (options: number[]) => (
    options.filter((num) => (num - 1) % 10 === 0)
);

export const buildNumberGrid = (rangeStart: number) => (
    Array.from({ length: 10 }, (_, index) => rangeStart + index)
);

export const findOption = <T,>(options: Array<Option<T>>, value: T): Option<T> | null => (
    options.find((option) => option.value === value) ?? null
);

export const modeLabelKey = (mode: MathGameMode) => (
    mode === "mencariB" ? "tenant.games.math.mode.mencariB" : "tenant.games.math.mode.mencariC"
);

export const buildPossiblePairs = (operator: MathGameOperator, numberRange: number, randomRange: number) => {
    const randomStart = operator === "-" ? numberRange : randomRange;
    return Array.from({ length: 10 }, (_, index) => ({
        operator,
        angka_pilihan: numberRange,
        angka_random: randomStart + index,
    }));
};

export const answerVariant = (isCorrect: boolean | null) => {
    if (isCorrect === true) {
        return "success";
    }

    if (isCorrect === false) {
        return "danger";
    }

    return "light";
};

export const formatAttemptProblem = (attempt: MathAttemptEntry) => (
    attempt.question.mode === "mencariC"
        ? `${attempt.question.a} ${attempt.question.operator} ${attempt.question.b} = ${attempt.question.answer}`
        : `${attempt.question.a} ${attempt.question.operator} ${attempt.question.answer} = ${attempt.question.result}`
);
