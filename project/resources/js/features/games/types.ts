// ---------------------------------------------------------------------------
// Game module domain types
// ---------------------------------------------------------------------------

export interface GameDefinition {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: GameCategory;
    route: string;
    enabled: boolean;
}

export type GameCategory = 'math' | 'vocabulary' | 'story' | 'tahfiz' | 'logic' | 'memory';

export interface GameSession {
    id: string;
    gameId: string;
    childId: string;
    startedAt: string;
    finishedAt: string | null;
    score: number;
    status: 'active' | 'completed' | 'abandoned';
}

export interface GameEvaluation {
    sessionId: string;
    totalQuestions: number;
    correctCount: number;
    streak: number;
    masteryPairs: string[];
    duration: number;
}

export interface VocabularyWord {
    id: string;
    category: string;
    day: number;
    bahasaIndonesia: string;
    bahasaInggris?: string;
    bahasaArab?: string;
    phonetic?: string;
    phoneticArabic?: string;
}

export interface VocabularyProgress {
    wordId: string;
    language: 'english' | 'arabic';
    correctStreak: number;
    isMastered: boolean;
}

export interface StoryTheme {
    id: string;
    name: string;
    description: string;
    akhlakType: 'good' | 'bad';
}

export interface StorySlide {
    order: number;
    text: string;
    imageDescription: string;
    imageUrl?: string;
}

export interface GeneratedStory {
    id: string;
    title: string;
    theme: string;
    source: 'hadis' | 'quran' | 'fabel';
    summary: string;
    moralQuote: string;
    slides: StorySlide[];
    isFavorite: boolean;
    createdAt: string;
}

export interface Surah {
    id: string;
    number: number;
    name: string;
    ayatCount: number;
}

export interface TahfizConfig {
    surahs: Surah[];
    reciters: Reciter[];
    defaultReciter: string;
    defaultSpeed: number;
    defaultRepeat: number;
}

export interface Reciter {
    id: string;
    name: string;
    provider: string;
}

export interface GamesPageProps {
    games: GameDefinition[];
    recentSessions: GameSession[];
    activeMemberId: string | null;
    financeRoute: string;
    demo?: Record<string, unknown>;
}
