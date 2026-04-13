import axios from "axios";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

export type MathGameOperator = "+" | "-" | "*" | "/";
export type MathGameMode = "mencariC" | "mencariB";

export interface MathConfigResponse {
    operators: Array<{ value: MathGameOperator; label: string }>;
    modes: Array<{ value: MathGameMode; label: string }>;
    number_options: number[];
    question_count_options: number[];
    time_limit_options: number[];
    mastered_streak_threshold: number;
}

export interface MathMasteredPair {
    operator: MathGameOperator;
    angka_pilihan: number;
    angka_random: number;
    max_streak_benar: number;
}

export interface MathAttemptPayload {
    operator: MathGameOperator;
    angka_pilihan: number;
    angka_random: number;
    is_correct: boolean;
    current_streak: number;
}

export interface MathAttemptResponse {
    jumlah_benar: number;
    jumlah_salah: number;
    current_streak_benar: number;
    max_streak_benar: number;
    mastered: boolean;
}

export interface MathStatsPair {
    operator: MathGameOperator;
    angka_pilihan: number;
    angka_random: number;
}

export interface MathPairStats extends MathStatsPair {
    jumlah_benar: number;
    jumlah_salah: number;
    current_streak_benar: number;
    max_streak_benar: number;
    mastered: boolean;
}

export interface MathFinishPayload {
    operator: MathGameOperator;
    game_mode: MathGameMode;
    number_range: number;
    random_range?: number | null;
    question_count: number;
    time_limit: number;
    correct_count: number;
    wrong_count: number;
    best_streak: number;
    duration_seconds: number;
    started_at?: string;
    finished_at?: string;
    summary?: Record<string, unknown>;
}

export interface MathSessionHistoryItem {
    id: string;
    operator: MathGameOperator;
    game_mode: MathGameMode;
    number_range: number;
    random_range: number | null;
    question_count: number;
    time_limit_seconds: number;
    correct_count: number;
    wrong_count: number;
    best_streak: number;
    score_percent: number;
    duration_seconds: number;
    started_at: string | null;
    finished_at: string | null;
}

export interface MathGameSetting {
    operator: MathGameOperator;
    default_mode: MathGameMode;
    default_question_count: number;
    default_time_limit: number;
    mastered_threshold: number;
}

export interface MathGameSettingPayload {
    operator: MathGameOperator;
    default_mode: MathGameMode;
    default_question_count: number;
    default_time_limit: number;
    mastered_threshold: number;
}

export interface GamesApi {
    fetchMathConfig: () => Promise<MathConfigResponse>;
    fetchMathMastery: (operator?: MathGameOperator) => Promise<MathMasteredPair[]>;
    fetchMathStats: (pairs: MathStatsPair[]) => Promise<Record<string, MathPairStats>>;
    submitMathAttempt: (payload: MathAttemptPayload) => Promise<MathAttemptResponse>;
    finishMathSession: (payload: MathFinishPayload) => Promise<{ id: string; score_percent: number }>;
    fetchMathHistory: (limit?: number) => Promise<MathSessionHistoryItem[]>;
    fetchMathSettings: (operator?: MathGameOperator) => Promise<MathGameSetting[]>;
    updateMathSettings: (payload: MathGameSettingPayload) => Promise<{ message: string }>;
}

export function createGamesApi(route: TenantRouteLike): GamesApi {
    return {
        fetchMathConfig: async () => {
            const response = await axios.get(route.apiTo("/games/math/config"));
            return response.data?.data?.config as MathConfigResponse;
        },
        fetchMathMastery: async (operator?: MathGameOperator) => {
            const response = await axios.get(route.apiTo("/games/math/mastered"), {
                params: operator ? { operator } : undefined,
            });
            return (response.data?.data?.pairs ?? []) as MathMasteredPair[];
        },
        fetchMathStats: async (pairs: MathStatsPair[]) => {
            const response = await axios.post(route.apiTo("/games/math/stats"), { pairs });
            return (response.data?.data?.stats ?? {}) as Record<string, MathPairStats>;
        },
        submitMathAttempt: async (payload: MathAttemptPayload) => {
            const response = await axios.post(route.apiTo("/games/math/attempt"), payload);
            return response.data?.data?.stats as MathAttemptResponse;
        },
        finishMathSession: async (payload: MathFinishPayload) => {
            const response = await axios.post(route.apiTo("/games/math/session/finish"), payload);
            return response.data?.data?.session as { id: string; score_percent: number };
        },
        fetchMathHistory: async (limit = 20) => {
            const response = await axios.get(route.apiTo("/games/math/history"), {
                params: { limit },
            });
            return (response.data?.data?.sessions ?? []) as MathSessionHistoryItem[];
        },
        fetchMathSettings: async (operator?: MathGameOperator) => {
            const response = await axios.get(route.apiTo("/games/math/settings"), {
                params: operator ? { operator } : undefined,
            });
            return (response.data?.data?.settings ?? []) as MathGameSetting[];
        },
        updateMathSettings: async (payload: MathGameSettingPayload) => {
            const response = await axios.post(route.apiTo("/games/math/settings"), payload);
            return response.data?.data as { message: string };
        },
    };
}
