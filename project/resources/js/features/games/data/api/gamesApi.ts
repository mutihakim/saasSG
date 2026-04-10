/**
 * Games API client
 *
 * All API calls for the Games module go through this file.
 * Uses the tenantRoute pattern: tenantRoute.apiTo('/games/...')
 */

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

export interface GamesApi {
    /** Fetch available games list */
    fetchGames: () => Promise<unknown>;
    /** Fetch recent game sessions */
    fetchRecentSessions: () => Promise<unknown>;
    /** Save game evaluation */
    saveEvaluation: (data: Record<string, unknown>) => Promise<unknown>;
    /** Save streak data */
    saveStreak: (data: Record<string, unknown>) => Promise<unknown>;
    /** Get mastered pairs/words */
    fetchMastery: (gameId: string, childId: string) => Promise<unknown>;
    /** Generate AI story */
    generateStory: (data: Record<string, unknown>) => Promise<unknown>;
    /** Fetch vocabulary words */
    fetchVocabulary: (language: string, category: string, day: number) => Promise<unknown>;
    /** Submit quiz result */
    submitQuiz: (data: Record<string, unknown>) => Promise<unknown>;
    /** Fetch surah list */
    fetchSurahs: () => Promise<unknown>;
}

/**
 * Creates a games API client bound to the tenant route helper.
 */
export function createGamesApi(_route: TenantRouteLike): GamesApi {
    return {
        fetchGames: async () => {
            // TODO: route.apiTo('/games')
            return [];
        },
        fetchRecentSessions: async () => {
            // TODO: route.apiTo('/games/sessions/recent')
            return [];
        },
        saveEvaluation: async (_data: Record<string, unknown>) => {
            // TODO: route.apiTo('/games/evaluation')
            return null;
        },
        saveStreak: async (_data: Record<string, unknown>) => {
            // TODO: route.apiTo('/games/streak')
            return null;
        },
        fetchMastery: async (_gameId: string, _childId: string) => {
            // TODO: route.apiTo('/games/mastery')
            return [];
        },
        generateStory: async (_data: Record<string, unknown>) => {
            // TODO: route.apiTo('/games/story/generate')
            return null;
        },
        fetchVocabulary: async (_language: string, _category: string, _day: number) => {
            // TODO: route.apiTo('/games/vocabulary')
            return [];
        },
        submitQuiz: async (_data: Record<string, unknown>) => {
            // TODO: route.apiTo('/games/vocabulary/quiz')
            return null;
        },
        fetchSurahs: async () => {
            // TODO: route.apiTo('/games/tahfiz/surahs')
            return [];
        },
    };
}
