import axios from "axios";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

export type VocabularyLanguage = "english" | "arabic";
export type VocabularyMode = "learn" | "practice" | "memory_test";
export type VocabularyTranslationDirection = "id_to_target" | "target_to_id";

export interface VocabularyWordDto {
    id: number;
    bahasa_indonesia: string;
    bahasa_inggris: string | null;
    fonetik: string | null;
    bahasa_arab: string | null;
    fonetik_arab: string | null;
    kategori: string;
    hari: number;
}

export interface VocabularyProgressDto {
    word_id: number;
    jumlah_benar: number;
    jumlah_salah: number;
    correct_streak: number;
    max_streak: number;
    is_mastered: boolean;
}

export interface VocabularyConfigResponse {
    languages: Array<{ value: VocabularyLanguage; label: string }>;
    modes: Array<{ value: VocabularyMode; label: string }>;
    directions: Array<{ value: VocabularyTranslationDirection; label: string }>;
    categories: Array<{ category: string; total_days: number; days: number[] }>;
    default_mastered_threshold: number;
    default_time_limit: number;
}

export interface VocabularySetting {
    language: VocabularyLanguage;
    default_mode: VocabularyMode;
    mastered_threshold: number;
    default_time_limit: number;
    auto_tts: boolean;
    translation_direction: VocabularyTranslationDirection;
}

export interface VocabularyAttemptPayload {
    word_id: number;
    language: VocabularyLanguage;
    is_correct: boolean;
    current_streak: number;
}

export interface VocabularyAttemptResponse {
    word_id: number;
    language: VocabularyLanguage;
    jumlah_benar: number;
    jumlah_salah: number;
    correct_streak: number;
    max_streak: number;
    is_mastered: boolean;
}

export interface VocabularyFinishPayload {
    language: VocabularyLanguage;
    mode: VocabularyMode;
    category: string;
    day: number;
    question_count: number;
    correct_count: number;
    wrong_count: number;
    best_streak: number;
    duration_seconds: number;
    started_at?: string;
    finished_at?: string;
    summary?: Record<string, unknown>;
}

export interface VocabularySessionHistoryItem {
    id: string;
    language: VocabularyLanguage;
    mode: string;
    category: string;
    day: number;
    question_count: number;
    correct_count: number;
    wrong_count: number;
    best_streak: number;
    score_percent: number;
    duration_seconds: number;
    started_at: string | null;
    finished_at: string | null;
}

export interface VocabularyMasteredItem {
    word_id: number;
    language: VocabularyLanguage;
    jumlah_benar: number;
    jumlah_salah: number;
    correct_streak: number;
    max_streak: number;
    is_mastered: boolean;
    last_practiced_at: string | null;
    word: VocabularyWordDto;
}

export interface VocabularyApi {
    fetchConfig: () => Promise<{ config: VocabularyConfigResponse; settings: Record<string, VocabularySetting> }>;
    fetchMastered: (params?: { limit?: number; language?: VocabularyLanguage }) => Promise<VocabularyMasteredItem[]>;
    fetchWords: (params: { language: VocabularyLanguage; category: string; day: number }) => Promise<{
        words: VocabularyWordDto[];
        progress: Record<string, VocabularyProgressDto>;
    }>;
    fetchPool: (params: { language: VocabularyLanguage; category: string }) => Promise<{ words: VocabularyWordDto[] }>;
    submitAttempt: (payload: VocabularyAttemptPayload) => Promise<VocabularyAttemptResponse>;
    finishSession: (payload: VocabularyFinishPayload) => Promise<{ id: string; score_percent: number }>;
    fetchHistory: (params?: { limit?: number; language?: VocabularyLanguage }) => Promise<VocabularySessionHistoryItem[]>;
    fetchSettings: (language?: VocabularyLanguage) => Promise<VocabularySetting[]>;
    updateSettings: (payload: VocabularySetting) => Promise<{ message: string }>;
}

export function createVocabularyApi(route: TenantRouteLike): VocabularyApi {
    return {
        fetchConfig: async () => {
            const response = await axios.get(route.apiTo("/games/vocabulary/config"));
            return {
                config: response.data?.data?.config as VocabularyConfigResponse,
                settings: (response.data?.data?.settings ?? {}) as Record<string, VocabularySetting>,
            };
        },
        fetchMastered: async (params) => {
            const response = await axios.get(route.apiTo("/games/vocabulary/mastered"), { params });
            return (response.data?.data?.words ?? []) as VocabularyMasteredItem[];
        },
        fetchWords: async (params) => {
            const response = await axios.get(route.apiTo("/games/vocabulary/words"), { params });
            return {
                words: (response.data?.data?.words ?? []) as VocabularyWordDto[],
                progress: (response.data?.data?.progress ?? {}) as Record<string, VocabularyProgressDto>,
            };
        },
        fetchPool: async (params) => {
            const response = await axios.get(route.apiTo("/games/vocabulary/pool"), { params });
            return {
                words: (response.data?.data?.words ?? []) as VocabularyWordDto[],
            };
        },
        submitAttempt: async (payload) => {
            const response = await axios.post(route.apiTo("/games/vocabulary/attempt"), payload);
            return response.data?.data?.stats as VocabularyAttemptResponse;
        },
        finishSession: async (payload) => {
            const response = await axios.post(route.apiTo("/games/vocabulary/session/finish"), payload);
            return response.data?.data?.session as { id: string; score_percent: number };
        },
        fetchHistory: async (params) => {
            const response = await axios.get(route.apiTo("/games/vocabulary/history"), { params });
            return (response.data?.data?.sessions ?? []) as VocabularySessionHistoryItem[];
        },
        fetchSettings: async (language) => {
            const response = await axios.get(route.apiTo("/games/vocabulary/settings"), {
                params: language ? { language } : undefined,
            });
            return (response.data?.data?.settings ?? []) as VocabularySetting[];
        },
        updateSettings: async (payload) => {
            const response = await axios.post(route.apiTo("/games/vocabulary/settings"), payload);
            return response.data?.data as { message: string };
        },
    };
}
