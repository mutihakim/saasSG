import type { VocabularyLanguage, VocabularyTranslationDirection, VocabularyWordDto } from "../data/api/vocabularyApi";

export const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const targetTextFor = (word: VocabularyWordDto, language: VocabularyLanguage): string => {
    if (language === "english") return word.bahasa_inggris ?? "";
    if (language === "mandarin") return word.bahasa_mandarin ?? "";
    return word.bahasa_arab ?? "";
};

export const promptTextFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => (
    direction === "target_to_id" ? targetTextFor(word, language) : word.bahasa_indonesia
);

export const phoneticTextFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
): string | null => {
    if (language === "english") return word.fonetik ?? null;
    if (language === "mandarin") return word.fonetik_mandarin ?? null;
    return word.fonetik_arab ?? null;
};

export const promptPhoneticFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string | null => (
    direction === "target_to_id" ? phoneticTextFor(word, language) : null
);

export const answerTextFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => (
    direction === "target_to_id" ? word.bahasa_indonesia : targetTextFor(word, language)
);

export const answerPhoneticFor = (
    word: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string | null => (
    direction === "target_to_id" ? null : phoneticTextFor(word, language)
);

export const promptLangFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => {
    if (direction === "target_to_id") {
        if (language === "english") return "en-US";
        if (language === "mandarin") return "zh-CN";
        return "ar-SA";
    }

    return "id-ID";
};

export const answerLangFor = (
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
): string => {
    if (direction === "target_to_id") return "id-ID";
    if (language === "english") return "en-US";
    if (language === "mandarin") return "zh-CN";
    return "ar-SA";
};

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
    bahasaMandarin: word.bahasa_mandarin,
    phonetic: word.fonetik,
    phoneticArabic: word.fonetik_arab,
    phoneticMandarin: word.fonetik_mandarin,
});

export const buildOptionSet = (
    currentWord: VocabularyWordDto,
    language: VocabularyLanguage,
    direction: VocabularyTranslationDirection,
    pool: VocabularyWordDto[],
): { text: string; phonetic: string | null }[] => {
    const correctText = answerTextFor(currentWord, language, direction);
    const correctPhonetic = answerPhoneticFor(currentWord, language, direction);

    const distractors = shuffle(
        pool
            .filter((item) => item.id !== currentWord.id)
            .map((item) => ({
                text: answerTextFor(item, language, direction),
                phonetic: answerPhoneticFor(item, language, direction),
            }))
            .filter((value) => value.text && value.text !== correctText)
    );

    const unique: { text: string; phonetic: string | null }[] = [];
    const uniqueTexts = new Set<string>();
    for (const item of distractors) {
        if (!uniqueTexts.has(item.text)) {
            unique.push(item);
            uniqueTexts.add(item.text);
        }
        if (unique.length >= 3) {
            break;
        }
    }

    if (!correctText) {
        return [];
    }

    return shuffle([{ text: correctText, phonetic: correctPhonetic }, ...unique]);
};
