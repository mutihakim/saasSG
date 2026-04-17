import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { 
    TahfizPhase, 
    TahfizMode, 
    TahfizTab, 
    TahfizSurah, 
    TahfizSurahDetail, 
    TahfizSettings, 
    MurojaahReport, 
    TahfizFavorite 
} from "../types";

import { useTahfizApi } from "./useTahfizApi";
import { useTahfizAudio } from "./useTahfizAudio";

export default function useTahfizGameController() {
    const api = useTahfizApi();
    const isInitialMount = useRef(true);
    const isFetching = useRef(false);

    const [phase, setPhase] = useState<TahfizPhase>("setup");
    const [mode, setMode] = useState<TahfizMode>("learn");
    const [activeTab, setActiveTab] = useState<TahfizTab>("arab");
    const [surahs, setSurahs] = useState<TahfizSurah[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<TahfizSurahDetail | null>(null);
    const [ayahFrom, setAyahFrom] = useState(1);
    const [ayahTo, setAyahTo] = useState(1);
    const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSurahLoading, setIsSurahLoading] = useState(false);
    
    const [settings, setSettings] = useState<TahfizSettings>({
        default_provider: "EQURAN_ID",
        default_reciter: "01",
        auto_next: true,
        repeat_count: 1,
    });
    const [history, setHistory] = useState<any[]>([]);
    const [murojaahHistory, setMurojaahHistory] = useState<MurojaahReport[]>([]);
    const [favoriteAyahs, setFavoriteAyahs] = useState<TahfizFavorite[]>([]);

    const activeSurahAyahs = useMemo(() => {
        if (!selectedSurah) return [];
        if (phase === "murojaah") return selectedSurah.ayahs;
        return selectedSurah.ayahs.filter(
            (a) => a.nomor_ayat >= ayahFrom && a.nomor_ayat <= ayahTo
        );
    }, [selectedSurah, ayahFrom, ayahTo, phase]);

    const currentAyah = activeSurahAyahs[currentAyahIndex] ?? null;

    const onNextAuto = useCallback(() => {
        if (settings.auto_next && currentAyahIndex < activeSurahAyahs.length - 1) {
            setCurrentAyahIndex((prev) => prev + 1);
        } else {
            if (settings.auto_next && currentAyahIndex >= activeSurahAyahs.length - 1) {
                if (selectedSurah && mode === "learn") {
                    void api.recordProgress({
                        surah_number: selectedSurah.id,
                        ayat_awal: ayahFrom,
                        ayat_akhir: ayahTo,
                        status: "reading"
                    }).then(() => {
                        api.fetchHistory().then(setHistory);
                    });
                }
            }
        }
    }, [settings.auto_next, currentAyahIndex, activeSurahAyahs.length, selectedSurah, mode, api, ayahFrom, ayahTo]);

    const audio = useTahfizAudio(currentAyah, activeTab, settings, onNextAuto);

    // -- API Fetchers --
    const loadInitialData = useCallback(async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        
        setIsLoading(true);
        try {
            // Enterprise solution: Use a single bootstrap endpoint to avoid 429
            const data = await api.fetchBootstrap();
            
            setSurahs(data.surahs);
            setSettings(data.settings);
            setHistory(data.history);
            setMurojaahHistory(data.murojaah_history);
            setFavoriteAyahs(data.favorites);
        } catch (e) {
            console.error("Failed to load initial tahfiz data", e);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Kosongkan dependensi agar hanya dibuat sekali

    useEffect(() => {
        if (isInitialMount.current) {
            void loadInitialData();
            isInitialMount.current = false;
        }
    }, [loadInitialData]);

    const loadSurahDetail = useCallback(async (surahId: number) => {
        setIsSurahLoading(true);
        try {
            const data = await api.loadSurahDetail(surahId);
            setSelectedSurah(data);
            setAyahFrom(1);
            setAyahTo(data.jumlah_ayat);
            return data;
        } catch (e) {
            console.error("Failed to load surah detail", e);
            return null;
        } finally {
            setIsSurahLoading(false);
        }
    }, [api]);

    const updateSettings = useCallback(async (patch: Partial<TahfizSettings>) => {
        const merged = { ...settings, ...patch };
        setSettings(merged);
        try {
            const updated = await api.updateSettings(merged);
            setSettings(updated);
            return true;
        } catch (e) {
            console.error("Failed to update settings", e);
            return false;
        }
    }, [api, settings]);

    // -- Navigation & Sessions --
    const startSession = useCallback(() => {
        if (!selectedSurah) return;
        audio.setCurrentRepeat(0);
        if (mode === "test") {
            setPhase("murojaah");
            setCurrentAyahIndex(ayahFrom - 1);
        } else {
            setPhase("reading");
            setCurrentAyahIndex(0);
        }
    }, [selectedSurah, mode, ayahFrom, audio]);

    const stopSession = useCallback(() => {
        audio.stop();
        setPhase("setup");
    }, [audio]);

    const goToNext = useCallback(async () => {
        if (currentAyahIndex < activeSurahAyahs.length - 1) {
            const wasPlaying = audio.isPlaying || audio.isTtsPlaying;
            setCurrentAyahIndex((prev) => prev + 1);
            audio.setCurrentRepeat(0);
            if (!wasPlaying) {
                audio.stop();
            }
        } else if (phase === "murojaah" && selectedSurah && selectedSurah.id < 114) {
            const nextId = selectedSurah.id + 1;
            await loadSurahDetail(nextId);
            setCurrentAyahIndex(0);
        }
    }, [currentAyahIndex, activeSurahAyahs.length, audio, phase, selectedSurah, loadSurahDetail]);

    const goToPrev = useCallback(async () => {
        if (currentAyahIndex > 0) {
            const wasPlaying = audio.isPlaying || audio.isTtsPlaying;
            setCurrentAyahIndex((prev) => prev - 1);
            audio.setCurrentRepeat(0);
            if (!wasPlaying) {
                audio.stop();
            }
        } else if (phase === "murojaah" && selectedSurah && selectedSurah.id > 1) {
            const prevId = selectedSurah.id - 1;
            const surah = await loadSurahDetail(prevId);
            if (surah) {
                setCurrentAyahIndex(surah.jumlah_ayat - 1);
            }
        }
    }, [currentAyahIndex, audio, phase, selectedSurah, loadSurahDetail]);

    // Auto-play on index change if was playing
    useEffect(() => {
        if ((phase !== "reading" && phase !== "murojaah") || audio.stopSignalRef.current) return;
        if (!currentAyah) return;
        
        // Gunakan wasPlayingRef (synchronous) bukan isPlaying/isTtsPlaying (async React state)
        // karena state sudah di-reset ke false sebelum useEffect ini berjalan
        if (!audio.wasPlayingRef.current) return;

        // Reset ref setelah kita consume, cegah auto-play ganda
        audio.wasPlayingRef.current = false;
        audio.playCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAyahIndex]);

    const resumeProgress = useCallback(async (type: "reading" | "murojaah") => {
        const item = type === "reading" ? history[0] : murojaahHistory[0];
        if (!item || !item.surah_number) return;

        setIsSurahLoading(true);
        try {
            const data = await api.loadSurahDetail(item.surah_number);
            setSelectedSurah(data);
            if (type === "reading") {
                setAyahFrom(item.ayat_awal || 1);
                setAyahTo(item.ayat_akhir || data.jumlah_ayat);
                setMode("learn");
            } else {
                setAyahFrom(item.ayat || 1);
                setAyahTo(item.ayat || 1);
                setMode("test");
            }
        } catch (e) {
            console.error("Failed to resume progress", e);
        } finally {
            setIsSurahLoading(false);
        }
    }, [api, history, murojaahHistory]);

    const recordMurojaah = useCallback(async (data: any) => {
        try {
            await api.recordMurojaah(data);
            const mh = await api.fetchMurojaahHistory();
            setMurojaahHistory(mh);
            return true;
        } catch (e) {
            console.error("Failed to record murojaah", e);
            return false;
        }
    }, [api]);

    const toggleFavorite = useCallback(async (surahId: number, start: number, end: number, note?: string, category?: string) => {
        try {
            await api.toggleFavorite({ surah_id: surahId, ayah_start: start, ayah_end: end, note, category });
            const [f, s] = await Promise.all([
                api.fetchFavoriteAyahs(),
                selectedSurah ? api.loadSurahDetail(selectedSurah.id) : Promise.resolve(null)
            ]);
            setFavoriteAyahs(f);
            if (s) setSelectedSurah(s);
            return true;
        } catch (e) {
            console.error("Failed to toggle favorite", e);
            return false;
        }
    }, [api, selectedSurah]);

    const removeFavorite = useCallback(async (surahId: number, start: number, end: number) => {
        try {
            await api.removeFavorite(surahId, start, end);
            const [f, s] = await Promise.all([
                api.fetchFavoriteAyahs(),
                selectedSurah ? api.loadSurahDetail(selectedSurah.id) : Promise.resolve(null)
            ]);
            setFavoriteAyahs(f);
            if (s) setSelectedSurah(s);
            return true;
        } catch (e) {
            console.error("Failed to remove favorite", e);
            return false;
        }
    }, [api, selectedSurah]);

    const changeMode = useCallback((newMode: TahfizMode) => {
        setMode(newMode);
        setSelectedSurah(null);
        setAyahFrom(1);
        setAyahTo(1);
    }, []);

    const loadFavorite = useCallback(async (fav: TahfizFavorite) => {
        setIsSurahLoading(true);
        try {
            const data = await api.loadSurahDetail(fav.surah_id);
            setSelectedSurah(data);
            setAyahFrom(fav.ayah_start);
            setAyahTo(fav.ayah_end);
        } catch (e) {
            console.error("Failed to load favorite", e);
        } finally {
            setIsSurahLoading(false);
        }
    }, [api]);

    const uniqueCategories = useMemo(() => {
        const cats = favoriteAyahs.map(f => f.category).filter(Boolean) as string[];
        return Array.from(new Set(cats));
    }, [favoriteAyahs]);

    return {
        phase, mode, activeTab, surahs, selectedSurah, ayahFrom, ayahTo,
        currentAyahIndex, currentAyah, activeSurahAyahs, isLoading, isSurahLoading,
        isPlaying: audio.isPlaying, isTtsPlaying: audio.isTtsPlaying,
        playbackRate: audio.playbackRate, currentRepeat: audio.currentRepeat,
        settings, history, murojaahHistory, favoriteAyahs, uniqueCategories,
        lastReadingProgress: history[0], lastMurojaahProgress: murojaahHistory[0],
        audioRef: audio.audioRef,
        setMode: changeMode, setActiveTab, loadSurahDetail, setAyahFrom, setAyahTo,
        startSession, stopSession, goToNext, goToPrev, togglePlay: audio.togglePlay,
        handlePlaybackEnded: audio.handlePlaybackEnded, setPlaybackRate: audio.setPlaybackRate,
        updateSettings, recordMurojaah, resumeProgress, toggleFavorite, removeFavorite, loadFavorite,
    };
}
