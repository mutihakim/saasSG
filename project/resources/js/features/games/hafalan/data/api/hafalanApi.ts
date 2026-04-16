// hafalanApi.ts - API layer for hafalan feature
import axios from 'axios';

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

export interface HafalanRecord {
    id: number;
    surah_nomor: number;
    surah_nama: string;
    ayat_awal: number;
    ayat_akhir: number;
    tanggal_catat: string;
}

export interface HafalanProgress {
    surah_nomor: number;
    surah_nama: string;
    total_ayat: number;
    hafalan_count: number;
    progress_percent: number;
}

export interface HafalanApi {
    fetchHafalan: () => Promise<{ records: HafalanRecord[]; progress: HafalanProgress[] }>;
    createHafalan: (payload: Omit<HafalanRecord, 'id'>) => Promise<HafalanRecord>;
    deleteHafalan: (id: number) => Promise<void>;
}

export function createHafalanApi(route: TenantRouteLike): HafalanApi {
    return {
        fetchHafalan: async () => {
            const response = await axios.get(route.apiTo('/games/hafalan'));
            return response.data?.data ?? { records: [], progress: [] };
        },
        createHafalan: async (payload) => {
            const response = await axios.post(route.apiTo('/games/hafalan'), payload);
            return response.data?.data ?? {};
        },
        deleteHafalan: async (id) => {
            await axios.delete(route.apiTo(`/games/hafalan/${id}`));
        },
    };
}
