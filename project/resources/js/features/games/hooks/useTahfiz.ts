import { useCallback, useState } from "react";

import type { Surah, TahfizConfig } from "../types";

type UseTahfizReturn = {
    config: TahfizConfig | null;
    selectedSurah: Surah | null;
    fromAyat: number;
    toAyat: number;
    currentAyat: number;
    isPlaying: boolean;
    speed: number;
    repeatCount: number;
    repeatRemaining: number;
    selectSurah: (id: string) => void;
    setAyatRange: (from: number, to: number) => void;
    play: () => void;
    pause: () => void;
    setSpeed: (speed: number) => void;
    setRepeatCount: (count: number) => void;
    highlightAyat: (ayat: number) => void;
};

/**
 * Manages tahfiz memorization session: surah selection, ayat range,
 * audio playback with speed/repeat controls, and character-level highlighting.
 */
const useTahfiz = (): UseTahfizReturn => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [config, _setConfig] = useState<TahfizConfig | null>(null);
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [fromAyat, setFromAyat] = useState(1);
    const [toAyat, setToAyat] = useState(1);
    const [currentAyat, setCurrentAyat] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeedState] = useState(1);
    const [repeatCount, setRepeatCountState] = useState(1);
    const [repeatRemaining, setRepeatRemaining] = useState(0);

    const selectSurah = useCallback((id: string) => {
        // TODO: load surah details
        const surah = config?.surahs.find((s) => s.id === id) ?? null;
        setSelectedSurah(surah);
        if (surah) {
            setFromAyat(1);
            setToAyat(surah.ayatCount);
            setCurrentAyat(1);
        }
    }, [config]);

    const setAyatRange = useCallback((from: number, to: number) => {
        setFromAyat(from);
        setToAyat(to);
        setCurrentAyat(from);
    }, []);

    const play = useCallback(() => {
        // TODO: start audio playback
        setIsPlaying(true);
    }, []);

    const pause = useCallback(() => {
        // TODO: pause audio
        setIsPlaying(false);
    }, []);

    const setSpeed = useCallback((s: number) => {
        setSpeedState(s);
        // TODO: update playback speed
    }, []);

    const setRepeatCount = useCallback((count: number) => {
        setRepeatCountState(count);
        setRepeatRemaining(count);
    }, []);

    const highlightAyat = useCallback((ayat: number) => {
        setCurrentAyat(ayat);
    }, []);

    return {
        config,
        selectedSurah,
        fromAyat,
        toAyat,
        currentAyat,
        isPlaying,
        speed,
        repeatCount,
        repeatRemaining,
        selectSurah,
        setAyatRange,
        play,
        pause,
        setSpeed,
        setRepeatCount,
        highlightAyat,
    };
};

export default useTahfiz;
