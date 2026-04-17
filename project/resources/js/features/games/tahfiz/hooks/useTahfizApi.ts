import axios from "axios";
import { useCallback, useMemo } from "react";

import { 
    TahfizSettings, 
    TahfizSurah, 
    TahfizSurahDetail, 
    MurojaahReport, 
    TahfizFavorite 
} from "../types";

import { useTenantRoute } from "@/core/config/routes";

export type TahfizBootstrapData = {
    surahs: TahfizSurah[];
    settings: TahfizSettings;
    history: any[];
    murojaah_history: MurojaahReport[];
    favorites: TahfizFavorite[];
};

export function useTahfizApi() {
    const { apiTo } = useTenantRoute();

    // Membungkus apiTo di internal callback agar stabil bagi dependensi lain
    const route = useCallback((path: string) => apiTo(path), [apiTo]);

    const fetchBootstrap = useCallback(async (): Promise<TahfizBootstrapData> => {
        const res = await axios.get(route("/games/tahfiz/bootstrap"));
        return res.data.data ?? res.data;
    }, [route]);

    const fetchSurahs = useCallback(async (): Promise<TahfizSurah[]> => {
        const res = await axios.get(route("/games/tahfiz/surahs"));
        return res.data.data ?? res.data;
    }, [route]);

    const fetchSettings = useCallback(async (): Promise<TahfizSettings> => {
        const res = await axios.get(route("/games/tahfiz/settings"));
        return res.data.data ?? res.data;
    }, [route]);

    const fetchHistory = useCallback(async (): Promise<any[]> => {
        const res = await axios.get(route("/games/tahfiz/history"));
        return res.data.data ?? res.data;
    }, [route]);

    const fetchMurojaahHistory = useCallback(async (): Promise<MurojaahReport[]> => {
        const res = await axios.get(route("/games/tahfiz/murojaah/history"));
        return res.data.data ?? res.data;
    }, [route]);

    const fetchFavoriteAyahs = useCallback(async (): Promise<TahfizFavorite[]> => {
        const res = await axios.get(route("/games/tahfiz/favorites"));
        return res.data.data ?? res.data;
    }, [route]);

    const loadSurahDetail = useCallback(async (surahId: number): Promise<TahfizSurahDetail> => {
        const res = await axios.get(route(`/games/tahfiz/surahs/${surahId}`));
        return res.data.data ?? res.data;
    }, [route]);

    const updateSettings = useCallback(async (settings: TahfizSettings): Promise<TahfizSettings> => {
        const res = await axios.post(route("/games/tahfiz/settings"), settings);
        return res.data.data ?? res.data;
    }, [route]);

    const recordProgress = useCallback(async (data: {
        surah_number: number;
        ayat_awal: number;
        ayat_akhir: number;
        status: string;
    }) => {
        await axios.post(route("/games/tahfiz/progress"), data);
    }, [route]);

    const recordMurojaah = useCallback(async (data: {
        surah_number: number;
        ayat: number;
        tajwid_status: string;
        hafalan_status: string;
        catatan?: string;
    }) => {
        await axios.post(route("/games/tahfiz/murojaah"), data);
    }, [route]);

    const toggleFavorite = useCallback(async (data: {
        surah_id: number;
        ayah_start: number;
        ayah_end: number;
        note?: string;
        category?: string;
    }): Promise<TahfizFavorite> => {
        const res = await axios.post(route("/games/tahfiz/favorites"), data);
        return res.data.data ?? res.data;
    }, [route]);

    const removeFavorite = useCallback(async (surahId: number, ayahStart: number, ayahEnd: number) => {
        await axios.post(route("/games/tahfiz/favorites/remove"), {
            surah_id: surahId,
            ayah_start: ayahStart,
            ayah_end: ayahEnd,
        });
    }, [route]);

    return useMemo(() => ({
        fetchBootstrap,
        fetchSurahs,
        fetchSettings,
        fetchHistory,
        fetchMurojaahHistory,
        fetchFavoriteAyahs,
        loadSurahDetail,
        updateSettings,
        recordProgress,
        recordMurojaah,
        toggleFavorite,
        removeFavorite,
    }), [
        fetchBootstrap,
        fetchSurahs,
        fetchSettings,
        fetchHistory,
        fetchMurojaahHistory,
        fetchFavoriteAyahs,
        loadSurahDetail,
        updateSettings,
        recordProgress,
        recordMurojaah,
        toggleFavorite,
        removeFavorite,
    ]);
}
