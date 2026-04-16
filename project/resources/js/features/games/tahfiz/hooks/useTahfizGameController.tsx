import axios from "axios";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { useTenantRoute } from "@/core/config/routes";

export type TahfizSettings = {
    default_provider: string;
    default_reciter: string;
    auto_next: boolean;
    repeat_count: number;
};

export type TahfizPhase = "setup" | "reading";

export type TahfizSurah = {
    id: number;
    nama: string;
    nama_latin: string;
    jumlah_ayat: number;
    tempat_turun?: string;
    arti?: string;
};

export type TahfizAyah = {
    id: number;
    surah_id: number;
    nomor_ayat: number;
    teks_arab: string;
    teks_latin: string;
    teks_indonesia: string;
    audio: string;
};

export type TahfizSurahDetail = TahfizSurah & {
    ayahs: TahfizAyah[];
};

export default function useTahfizGameController() {
    const { apiTo } = useTenantRoute();

    const [phase, setPhase] = useState<TahfizPhase>("setup");
    const [surahs, setSurahs] = useState<TahfizSurah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<TahfizSurahDetail | null>(null);
    const [ayahFrom, setAyahFrom] = useState(1);
    const [ayahTo, setAyahTo] = useState(1);
    const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [currentRepeat, setCurrentRepeat] = useState(0);
    const [settings, setSettings] = useState<TahfizSettings>({
        default_provider: "EQURAN_ID",
        default_reciter: "01",
        auto_next: true,
        repeat_count: 1,
    });
    const [history, setHistory] = useState<any[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stopSignalRef = useRef(false);

    // -- API helpers --
    const fetchSurahs = useCallback(async () => {
        try {
            const res = await axios.get(apiTo("/games/tahfiz/surahs"));
            setSurahs(res.data.data ?? res.data);
        } catch (e) {
            console.error("Failed to fetch surahs", e);
        }
    }, [apiTo]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await axios.get(apiTo("/games/tahfiz/settings"));
            setSettings(res.data.data ?? res.data);
        } catch (e) {
            console.error("Failed to fetch settings", e);
        }
    }, [apiTo]);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get(apiTo("/games/tahfiz/history"));
            setHistory(res.data.data ?? res.data);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    }, [apiTo]);

    const loadSurahDetail = useCallback(async (surahId: number) => {
        setIsSurahLoading(true);
        try {
            const res = await axios.get(apiTo(`/games/tahfiz/surahs/${surahId}`));
            const data: TahfizSurahDetail = res.data.data ?? res.data;
            setSelectedSurah(data);
            setAyahFrom(1);
            setAyahTo(data.jumlah_ayat);
        } catch (e) {
            console.error("Failed to fetch surah detail", e);
        } finally {
            setIsSurahLoading(false);
        }
    }, [apiTo]);

    const updateSettings = useCallback(async (patch: Partial<TahfizSettings>) => {
        const merged = { ...settings, ...patch };
        setSettings(merged);
        try {
            const res = await axios.post(apiTo("/games/tahfiz/settings"), merged);
            setSettings(res.data.data ?? res.data);
            return true;
        } catch (e) {
            console.error("Failed to save settings", e);
            return false;
        }
    }, [apiTo, settings]);

    const recordProgress = useCallback(async (surahNumber: number, from: number, to: number, status = "reading") => {
        try {
            await axios.post(apiTo("/games/tahfiz/progress"), {
                surah_number: surahNumber,
                ayat_awal: from,
                ayat_akhir: to,
                status,
            });
            void fetchHistory();
        } catch (e) {
            console.error("Failed to record progress", e);
        }
    }, [apiTo, fetchHistory]);

    // -- Phase transitions --
    const startReading = useCallback(() => {
        if (!selectedSurah) return;
        setCurrentAyahIndex(ayahFrom - 1);
        setCurrentRepeat(0);
        setPhase("reading");
    }, [selectedSurah, ayahFrom]);

    const stopReading = useCallback(() => {
        stopSignalRef.current = true;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setIsPlaying(false);
        setPhase("setup");
    }, []);

    // -- Navigation --
    const activeSurahAyahs = useMemo(() => {
        if (!selectedSurah) return [];
        return selectedSurah.ayahs.filter(
            (a) => a.nomor_ayat >= ayahFrom && a.nomor_ayat <= ayahTo
        );
    }, [selectedSurah, ayahFrom, ayahTo]);

    const currentAyah = activeSurahAyahs[currentAyahIndex] ?? null;

    const goToNext = useCallback(() => {
        setCurrentAyahIndex((prev) => Math.min(activeSurahAyahs.length - 1, prev + 1));
        setCurrentRepeat(0);
        setIsPlaying(false);
    }, [activeSurahAyahs.length]);

    const goToPrev = useCallback(() => {
        setCurrentAyahIndex((prev) => Math.max(0, prev - 1));
        setCurrentRepeat(0);
        setIsPlaying(false);
    }, []);

    // -- Audio playback --
    const playCurrentAyah = useCallback(() => {
        if (!currentAyah || !audioRef.current) return;
        stopSignalRef.current = false;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.src = currentAyah.audio;
        void audioRef.current.play();
        setIsPlaying(true);
        setCurrentRepeat(1);
    }, [currentAyah, playbackRate]);

    const stopAudio = useCallback(() => {
        stopSignalRef.current = true;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setIsPlaying(false);
        setCurrentRepeat(0);
    }, []);

    const handleAudioEnded = useCallback(() => {
        if (stopSignalRef.current) return;

        if (currentRepeat < settings.repeat_count) {
            // Repeat current ayah
            setCurrentRepeat((prev) => prev + 1);
            if (audioRef.current && currentAyah) {
                audioRef.current.src = currentAyah.audio;
                void audioRef.current.play();
            }
        } else {
            // Move to next
            setCurrentRepeat(0);
            setIsPlaying(false);
            if (settings.auto_next && currentAyahIndex < activeSurahAyahs.length - 1) {
                setCurrentAyahIndex((prev) => prev + 1);
            } else if (settings.auto_next && currentAyahIndex >= activeSurahAyahs.length - 1) {
                // Finished entire range — record progress
                if (selectedSurah) {
                    void recordProgress(selectedSurah.id, ayahFrom, ayahTo, "reading");
                }
            }
        }
    }, [
        currentRepeat, settings.repeat_count, settings.auto_next,
        currentAyah, currentAyahIndex, activeSurahAyahs.length,
        selectedSurah, ayahFrom, ayahTo, recordProgress,
    ]);

    // Auto-play when ayah index changes (if auto_next is on and was playing)
    useEffect(() => {
        if (phase !== "reading" || !isPlaying || stopSignalRef.current) return;
        if (!audioRef.current || !currentAyah) return;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.src = currentAyah.audio;
        void audioRef.current.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAyahIndex]);

    // Cleanup on unmount
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            stopSignalRef.current = true;
            if (audio) {
                audio.pause();
                audio.src = "";
            }
        };
    }, [audioRef]);

    // Initial data load
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchSurahs(), fetchSettings(), fetchHistory()]);
            setIsLoading(false);
        };
        void init();
    }, [fetchSurahs, fetchSettings, fetchHistory]);

    return {
        // State
        phase,
        surahs,
        selectedSurah,
        ayahFrom,
        ayahTo,
        currentAyahIndex,
        currentAyah,
        activeSurahAyahs,
        isLoading,
        isSurahLoading,
        isPlaying,
        playbackRate,
        currentRepeat,
        settings,
        history,
        audioRef,
        // Actions
        loadSurahDetail,
        setAyahFrom,
        setAyahTo,
        startReading,
        stopReading,
        goToNext,
        goToPrev,
        playCurrentAyah,
        stopAudio,
        handleAudioEnded,
        setPlaybackRate,
        updateSettings,
        recordProgress,
    };
}
