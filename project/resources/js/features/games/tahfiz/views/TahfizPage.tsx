import { router } from "@inertiajs/react";
import React from "react";
import { useTranslation } from "react-i18next";

import TahfizLayout from "../components/TahfizLayout";
import TahfizSetupScreen from "../components/TahfizSetupScreen";
import useTahfizGameController from "../hooks/useTahfizGameController";

const TahfizPage: React.FC = () => {
    const { t } = useTranslation();
    const game = useTahfizGameController();

    const startSession = () => {
        if (!game.selectedSurah) return;
        
        const params = new URLSearchParams();
        params.append("surah", game.selectedSurah.id.toString());
        
        if (game.mode === "test") {
            params.append("ayah", game.ayahFrom.toString());
            router.visit(`/games/tahfiz/murojaah?${params.toString()}`);
        } else {
            params.append("from", game.ayahFrom.toString());
            params.append("to", game.ayahTo.toString());
            router.visit(`/games/tahfiz/reading?${params.toString()}`);
        }
    };

    const handleResumeProgress = (type: "reading" | "murojaah") => {
        const item = type === "reading" ? game.lastReadingProgress : game.lastMurojaahProgress;
        if (!item) return;

        const params = new URLSearchParams();
        params.append("surah", item.surah_number.toString());
        
        if (type === "murojaah") {
            params.append("ayah", item.ayat?.toString() || "1");
            router.visit(`/games/tahfiz/murojaah?${params.toString()}`);
        } else {
            params.append("from", item.ayat_awal?.toString() || "1");
            params.append("to", item.ayat_akhir?.toString() || "1");
            router.visit(`/games/tahfiz/reading?${params.toString()}`);
        }
    };

    const handleSelectFavorite = (fav: any) => {
        const params = new URLSearchParams();
        params.append("surah", fav.surah_id.toString());
        params.append("from", fav.ayah_start.toString());
        params.append("to", fav.ayah_end.toString());
        router.visit(`/games/tahfiz/reading?${params.toString()}`);
    };

    return (
        <TahfizLayout
            title={t("tenant.games.tahfiz.page.title")}
            menuKey="main"
            isSessionActive={false}
            allowPageScroll={true}
        >
            {/* Loading state */}
            {game.isLoading && (
                <div className="d-flex align-items-center gap-2 py-4 justify-content-center text-muted">
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span>{t("tenant.games.tahfiz.page.loading")}</span>
                </div>
            )}

            {/* Setup Screen Only */}
            {!game.isLoading && (
                <TahfizSetupScreen
                    surahs={game.surahs}
                    selectedSurahId={game.selectedSurah?.id ?? null}
                    ayahFrom={game.ayahFrom}
                    ayahTo={game.ayahTo}
                    totalAyahs={game.selectedSurah?.jumlah_ayat ?? 0}
                    isLoading={game.isLoading}
                    isSurahLoading={game.isSurahLoading}
                    mode={game.mode}
                    lastReadingProgress={game.lastReadingProgress}
                    lastMurojaahProgress={game.lastMurojaahProgress}
                    favoriteAyahs={game.favoriteAyahs}
                    onSurahChange={(id) => void game.loadSurahDetail(id)}
                    onAyahFromChange={game.setAyahFrom}
                    onAyahToChange={game.setAyahTo}
                    onModeChange={game.setMode}
                    onStart={startSession}
                    onResumeProgress={handleResumeProgress}
                    onSelectFavorite={handleSelectFavorite}
                />
            )}
        </TahfizLayout>
    );
};

(TahfizPage as any).layout = null;

export default TahfizPage;
