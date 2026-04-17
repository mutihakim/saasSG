export type TahfizSettings = {
    default_provider: string;
    default_reciter: string;
    auto_next: boolean;
    repeat_count: number;
};

export type TahfizPhase = "setup" | "reading" | "murojaah";
export type TahfizMode = "learn" | "test";
export type TahfizTab = "arab" | "latin" | "terjemah";

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
    tenant_favorites?: Array<{
        id: number;
        surah_id: number;
        ayah_start: number;
        ayah_end: number;
        note?: string;
        category?: string;
    }>;
};

export type TahfizFavorite = {
    id: number;
    surah_id: number;
    ayah_start: number;
    ayah_end: number;
    category?: string;
    note?: string;
    surah: TahfizSurah;
};

export type TahfizSurahDetail = TahfizSurah & {
    ayahs: TahfizAyah[];
};

export type MurojaahReport = {
    id: number;
    surah_number: number;
    ayat: number;
    tajwid_status: "bagus" | "cukup" | "kurang";
    hafalan_status: "lancar" | "terbata" | "belum_hafal";
    catatan?: string;
    created_at: string;
    surah?: TahfizSurah;
};
