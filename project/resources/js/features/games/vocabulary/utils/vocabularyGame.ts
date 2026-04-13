import type { VocabularyLanguage, VocabularyTranslationDirection, VocabularyWordDto } from "../data/api/vocabularyApi";

export const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const targetTextFor = (word: VocabularyWordDto, language: VocabularyLanguage): string => (
    language === "english" ? (word.bahasa_inggris ?? "") : (word.bahasa_arab ?? "")
);

export const promptTextFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => (
    direction === "target_to_id" ? targetTextFor(word, language) : word.bahasa_indonesia
);

export const answerTextFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => (
    direction === "target_to_id" ? word.bahasa_indonesia : targetTextFor(word, language)
);

export const promptLangFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => {
    if (direction === "target_to_id") {
        return language === "english" ? "en-US" : "ar-SA";
    }

    return "id-ID";
};

export const answerLangFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => (
    direction === "target_to_id"
        ? "id-ID"
        : (language === "english" ? "en-US" : "ar-SA")
);

export const promptDirectionFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): "ltr" | "rtl" => (
    direction === "target_to_id" && language === "arabic" ? "rtl" : "ltr"
);

export const answerDirectionFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): "ltr" | "rtl" => (
    direction === "target_to_id" ? "ltr" : (language === "arabic" ? "rtl" : "ltr")
);

export const toFlashcardWord = (word: VocabularyWordDto) => ({
    id: word.id,
    bahasaIndonesia: word.bahasa_indonesia,
    bahasaInggris: word.bahasa_inggris,
    bahasaArab: word.bahasa_arab,
    phonetic: word.fonetik,
    phoneticArabic: word.fonetik_arab,
});

export const buildOptionSet = (
    currentWord: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
    pool: VocabularyWordDto[],
): string[] => {
    const correct = answerTextFor(currentWord, language, direction);
    const distractors = shuffle(
        pool
            .filter((item) => item.id !== currentWord.id)
            .map((item) => answerTextFor(item, language, direction))
            .filter((value) => value && value !== correct),
    );

    const unique: string[] = [];
    for (const item of distractors) {
        if (!unique.includes(item)) {
            unique.push(item);
        }
        if (unique.length >= 3) {
            break;
        }
    }

    if (!correct) {
        return [];
    }

    return shuffle([correct, ...unique]);
};
