import axios from "axios";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

export interface CurriculumUnit {
    id: number;
    tenant_id: number | null;
    educational_phase: string | null;
    grade: number | null;
    subject: string;
    semester: number | null;
    chapter: string | null;
    curriculum_type: string;
    difficulty_level: string | null;
    row_version: number;
    metadata?: Record<string, unknown> | null;
}

export interface CurriculumQuestion {
    id: number;
    curriculum_unit_id: number;
    tenant_id: number | null;
    question_key: string | null;
    question_text: string;
    options: string[];
    correct_answer: string;
    question_type: string;
    points: number;
    difficulty_order: number;
    row_version: number;
    metadata?: Record<string, unknown> | null;
}

export interface CurriculumAttemptResult {
    question_id: number;
    is_correct: boolean;
    selected_answer: string;
    correct_answer: string;
    points: number;
}

export interface CurriculumSessionHistoryItem {
    id: string;
    unit_id: number;
    subject: string;
    educational_phase: string | null;
    grade: number | null;
    semester: number | null;
    chapter: string | null;
    time_limit_seconds: number | null;
    question_count: number;
    correct_count: number;
    wrong_count: number;
    best_streak: number;
    score_percent: number;
    duration_seconds: number;
    started_at: string | null;
    finished_at: string | null;
    summary?: {
        attempts?: Array<{
            question_text: string;
            selected_answer: string;
            correct_answer: string;
            is_correct: boolean;
        }>;
    } | null;
}

export interface CurriculumSetting {
    grade: number;
    default_mode: string;
    default_question_count: number;
    default_time_limit: number;
    mastered_threshold: number;
}

export interface CurriculumApi {
    fetchConfig: () => Promise<{ question_count_options: number[]; time_limit_options: number[]; default_time_limit: number; units: CurriculumUnit[] }>;
    fetchQuestions: (unitId: number, limit?: number) => Promise<{ unit: CurriculumUnit; questions: CurriculumQuestion[] }>;
    submitAttempt: (payload: { question_id: number; selected_answer: string }) => Promise<CurriculumAttemptResult>;
    finishSession: (payload: {
        unit_id: number;
        question_count: number;
        correct_count: number;
        wrong_count: number;
        best_streak: number;
        time_limit: number;
        duration_seconds: number;
        started_at?: string;
        finished_at?: string;
        summary?: Record<string, unknown>;
    }) => Promise<{ id: string; score_percent: number }>;
    fetchHistory: (limit?: number) => Promise<CurriculumSessionHistoryItem[]>;
    fetchSettings: () => Promise<CurriculumSetting>;
    updateSettings: (payload: CurriculumSetting) => Promise<void>;
}

export function createCurriculumApi(route: TenantRouteLike): CurriculumApi {
    return {
        fetchConfig: async () => {
            const response = await axios.get(route.apiTo("/games/curriculum/config"));
            return response.data?.data?.config as { question_count_options: number[]; time_limit_options: number[]; default_time_limit: number; units: CurriculumUnit[] };
        },
        fetchQuestions: async (unitId, limit = 10) => {
            const response = await axios.get(route.apiTo(`/games/curriculum/units/${unitId}/questions`), {
                params: { limit },
            });
            return response.data?.data as { unit: CurriculumUnit; questions: CurriculumQuestion[] };
        },
        submitAttempt: async (payload) => {
            const response = await axios.post(route.apiTo("/games/curriculum/attempt"), payload);
            return response.data?.data?.result as CurriculumAttemptResult;
        },
        finishSession: async (payload) => {
            const response = await axios.post(route.apiTo("/games/curriculum/session/finish"), payload);
            return response.data?.data?.session as { id: string; score_percent: number };
        },
        fetchHistory: async (limit = 20) => {
            const response = await axios.get(route.apiTo("/games/curriculum/history"), {
                params: { limit },
            });
            return (response.data?.data?.sessions ?? []) as CurriculumSessionHistoryItem[];
        },
        fetchSettings: async () => {
            const response = await axios.get(route.apiTo("/games/curriculum/settings"));
            return response.data?.data?.settings as CurriculumSetting;
        },
        updateSettings: async (payload) => {
            await axios.post(route.apiTo("/games/curriculum/settings"), payload);
        },
    };
}
