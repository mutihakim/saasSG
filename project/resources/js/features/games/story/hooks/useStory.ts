import { useCallback, useState } from "react";

import type { GeneratedStory, StoryTheme } from "@/features/games/shared/types";

type UseStoryReturn = {
    stories: GeneratedStory[];
    themes: StoryTheme[];
    currentStory: GeneratedStory | null;
    currentSlideIndex: number;
    isGenerating: boolean;
    isFavorite: (id: string) => boolean;
    generateStory: (themeId: string, source: "hadis" | "quran" | "fabel") => Promise<void>;
    selectStory: (id: string) => void;
    nextSlide: () => void;
    prevSlide: () => void;
    toggleFavorite: (id: string) => void;
    expandStory: (id: string) => Promise<void>;
};

/**
 * Manages story generation and reading state: theme selection,
 * AI generation, slide navigation, favorites, and expansion.
 */
const useStory = (): UseStoryReturn => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [stories, _setStories] = useState<GeneratedStory[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [themes, _setThemes] = useState<StoryTheme[]>([]);
    const [currentStory, setCurrentStory] = useState<GeneratedStory | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateStory = useCallback(
        async (_themeId: string, _source: "hadis" | "quran" | "fabel") => {
            // TODO: call AI story generation API
            setIsGenerating(true);
            setIsGenerating(false);
        },
        []
    );

    const selectStory = useCallback(
        (id: string) => {
            const story = stories.find((s) => s.id === id) ?? null;
            setCurrentStory(story);
            setCurrentSlideIndex(0);
        },
        [stories]
    );

    const nextSlide = useCallback(() => {
        if (!currentStory) return;
        setCurrentSlideIndex((prev) =>
            Math.min(prev + 1, currentStory.slides.length - 1)
        );
    }, [currentStory]);

    const prevSlide = useCallback(() => {
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const isFavorite = useCallback(
        (id: string) => stories.some((s) => s.id === id && s.isFavorite),
        [stories]
    );

    const toggleFavorite = useCallback((_id: string) => {
        // TODO: toggle favorite status
    }, []);

    const expandStory = useCallback(async (_id: string) => {
        // TODO: call API to generate expanded version
    }, []);

    return {
        stories,
        themes,
        currentStory,
        currentSlideIndex,
        isGenerating,
        isFavorite,
        generateStory,
        selectStory,
        nextSlide,
        prevSlide,
        toggleFavorite,
        expandStory,
    };
};

export default useStory;
