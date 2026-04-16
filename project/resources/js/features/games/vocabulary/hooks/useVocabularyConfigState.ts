import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
    VocabularyApi,
    VocabularyConfigResponse,
    VocabularyLanguage,
    VocabularyMode,
    VocabularyProgressDto,
    VocabularyTranslationDirection,
    VocabularyWordDto,
} from "../data/api/vocabularyApi";
import type { VocabularyCategoryOption, VocabularySettingsMap } from "../types";

import { notify } from "@/core/lib/notify";

type UseVocabularyConfigStateReturn = {
    isLoadingConfig: boolean;
    config: VocabularyConfigResponse | null;
    settingsMap: VocabularySettingsMap;
    language: VocabularyLanguage;
    mode: VocabularyMode;
    selectedCategory: string;
    selectedDay: number;
    autoTts: boolean;
    questionCount: number;
    timeLimit: number;
    translationDirection: VocabularyTranslationDirection;
    masteredThreshold: number;
    dayWords: VocabularyWordDto[];
    progressMap: Record<string, VocabularyProgressDto>;
    categoryOptions: VocabularyCategoryOption[];
    daysForCategory: number[];
    masteredDaysForCategory: number[];
    hasCategories: boolean;
    hasDaysInSelectedCategory: boolean;
    setLanguage: (language: VocabularyLanguage) => void;
    setMode: (mode: VocabularyMode) => void;
    setSelectedCategory: (category: string) => void;
    setSelectedDay: (day: number) => void;
    setAutoTts: (enabled: boolean) => void;
    setQuestionCount: (count: number) => void;
    setTimeLimit: (seconds: number) => void;
    setTranslationDirection: (direction: VocabularyTranslationDirection) => void;
    setProgressMap: Dispatch<SetStateAction<Record<string, VocabularyProgressDto>>>;
    loadConfig: () => Promise<void>;
    fetchDayWords: () => Promise<{
        words: VocabularyWordDto[];
        progress: Record<string, VocabularyProgressDto>;
    }>;
};

const applyActiveSetting = (
    activeSetting: VocabularySettingsMap[string] | undefined,
    fallbackConfig: VocabularyConfigResponse | null,
    setMode: (mode: VocabularyMode) => void,
    setAutoTts: (enabled: boolean) => void,
    setQuestionCount: (count: number) => void,
    setTimeLimit: (seconds: number) => void,
    setTranslationDirection: (direction: VocabularyTranslationDirection) => void,
    setMasteredThreshold: (threshold: number) => void,
) => {
    if (activeSetting) {
        setMode(activeSetting.default_mode);
        setAutoTts(activeSetting.auto_tts);
        setQuestionCount(activeSetting.default_question_count);
        setTimeLimit(activeSetting.default_time_limit);
        setTranslationDirection(activeSetting.translation_direction);
        setMasteredThreshold(activeSetting.mastered_threshold);
        return;
    }

    if (!fallbackConfig) {
        return;
    }

    setMode("learn");
    setAutoTts(true);
    setQuestionCount(fallbackConfig.default_question_count ?? 6);
    setTimeLimit(fallbackConfig.default_time_limit ?? 8);
    setTranslationDirection("id_to_target");
    setMasteredThreshold(fallbackConfig.default_mastered_threshold ?? 8);
};

const useVocabularyConfigState = (api: VocabularyApi): UseVocabularyConfigStateReturn => {
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [config, setConfig] = useState<VocabularyConfigResponse | null>(null);
    const [settingsMap, setSettingsMap] = useState<VocabularySettingsMap>({});
    const [language, setLanguage] = useState<VocabularyLanguage>("english");
    const [mode, setMode] = useState<VocabularyMode>("learn");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedDay, setSelectedDay] = useState(1);
    const [autoTts, setAutoTts] = useState(true);
    const [questionCount, setQuestionCount] = useState(6);
    const [timeLimit, setTimeLimit] = useState(8);
    const [translationDirection, setTranslationDirection] = useState<VocabularyTranslationDirection>("id_to_target");
    const [masteredThreshold, setMasteredThreshold] = useState(8);
    const [dayWords, setDayWords] = useState<VocabularyWordDto[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, VocabularyProgressDto>>({});

    const loadConfig = useCallback(async () => {
        setIsLoadingConfig(true);

        try {
            const response = await api.fetchConfig();
            const initialLanguage = response.config.languages[0]?.value ?? "english";
            const firstCategory = response.config.categories[0];

            setConfig(response.config);
            setSettingsMap(response.settings);
            setLanguage(initialLanguage);

            if (firstCategory) {
                setSelectedCategory(firstCategory.category);
                setSelectedDay(firstCategory.days[0] ?? 1);
            }

            applyActiveSetting(
                response.settings[initialLanguage],
                response.config,
                setMode,
                setAutoTts,
                setQuestionCount,
                setTimeLimit,
                setTranslationDirection,
                setMasteredThreshold,
            );
        } catch {
            notify.error("Gagal memuat konfigurasi vocabulary.");
        } finally {
            setIsLoadingConfig(false);
        }
    }, [api]);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    const categoryOptions = useMemo<VocabularyCategoryOption[]>(() => (
        (config?.categories ?? []).map((item) => ({
            key: item.category,
            label: item.category,
            count: item.total_days,
        }))
    ), [config?.categories]);

    const daysForCategory = useMemo(
        () => config?.categories.find((item) => item.category === selectedCategory)?.days ?? [],
        [config?.categories, selectedCategory],
    );

    const masteredDaysForCategory = useMemo(() => {
        const masteredDays = config?.mastered_days;
        if (!masteredDays || !language || !selectedCategory) return [];
        return masteredDays[language]?.[selectedCategory] ?? [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config?.mastered_days, language, selectedCategory, config?.categories]);

    const hasCategories = categoryOptions.length > 0;
    const hasDaysInSelectedCategory = daysForCategory.length > 0;

    useEffect(() => {
        if (daysForCategory.length > 0 && !daysForCategory.includes(selectedDay)) {
            setSelectedDay(daysForCategory[0] ?? 1);
        }
    }, [daysForCategory, selectedDay]);

    useEffect(() => {
        applyActiveSetting(
            settingsMap[language],
            config,
            setMode,
            setAutoTts,
            setQuestionCount,
            setTimeLimit,
            setTranslationDirection,
            setMasteredThreshold,
        );
    }, [config, language, settingsMap]);

    const fetchDayWords = useCallback(async () => {
        if (!selectedCategory || !selectedDay) {
            return {
                words: [] as VocabularyWordDto[],
                progress: {} as Record<string, VocabularyProgressDto>,
            };
        }

        const response = await api.fetchWords({
            language,
            category: selectedCategory,
            day: selectedDay,
        });

        setDayWords(response.words);
        setProgressMap(response.progress);

        return response;
    }, [api, language, selectedCategory, selectedDay]);

    return {
        isLoadingConfig,
        config,
        settingsMap,
        language,
        mode,
        selectedCategory,
        selectedDay,
        autoTts,
        questionCount,
        timeLimit,
        translationDirection,
        masteredThreshold,
        dayWords,
        progressMap,
        categoryOptions,
        daysForCategory,
        masteredDaysForCategory,
        hasCategories,
        hasDaysInSelectedCategory,
        setLanguage,
        setMode,
        setSelectedCategory,
        setSelectedDay,
        setAutoTts,
        setQuestionCount,
        setTimeLimit,
        setTranslationDirection,
        setProgressMap,
        loadConfig,
        fetchDayWords,
    };
};

export default useVocabularyConfigState;
