import { router, usePage } from "@inertiajs/react";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import TahfizLayout from "../components/TahfizLayout";
import TahfizMurojaahScreen from "../components/TahfizMurojaahScreen";
import useTahfizGameController from "../hooks/useTahfizGameController";

const TahfizMurojaahPage: React.FC = () => {
    const { t } = useTranslation();
    const { url } = usePage();
    const game = useTahfizGameController();

    // Parse params from URL
    const params = useMemo(() => {
        const search = new URLSearchParams(url.split('?')[1] || '');
        return {
            surah: parseInt(search.get('surah') || '0'),
            ayah: parseInt(search.get('ayah') || '1'),
        };
    }, [url]);

    // Initial load
    useEffect(() => {
        if (params.surah > 0 && !game.selectedSurah && !game.isSurahLoading) {
            void game.loadSurahDetail(params.surah).then((surah) => {
                if (surah) {
                    // For murojaah, usually we want to jump to specific ayah
                    // The activeSurahAyahs logic in controller handles currentAyahIndex
                }
            });
        }
    }, [params, game]);

    const layoutTitle = useMemo(() => {
        if (!game.selectedSurah) return t("tenant.games.tahfiz.page.title");
        return (
            <div className="game-feature-shell__title-container">
                <div className="game-feature-shell__title">{game.selectedSurah.nama_latin}</div>
                <div className="small text-white-50 text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    {t("tenant.games.tahfiz.page.subtitle_murojaah")}
                </div>
            </div>
        );
    }, [game.selectedSurah, t]);

    const handleBack = () => {
        game.stopSession();
        router.visit("/games/tahfiz");
    };

    return (
        <TahfizLayout
            title={layoutTitle}
            menuKey="main"
            isSessionActive={true}
            allowPageScroll={false}
            onLeavingSession={handleBack}
        >
            {game.isSurahLoading || !game.selectedSurah || !game.currentAyah ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white-50 p-5">
                    <div className="spinner-border mb-3" role="status" />
                    <span className="fw-bold text-uppercase">{t("tenant.games.tahfiz.page.loading")}</span>
                </div>
            ) : (
                <TahfizMurojaahScreen
                    key={`${game.selectedSurah.id}-${game.currentAyah.nomor_ayat}`}
                    surah={game.selectedSurah}
                    activeSurahAyahs={game.activeSurahAyahs}
                    currentAyahIndex={game.currentAyahIndex}
                    currentAyah={game.currentAyah}
                    murojaahHistory={game.murojaahHistory}
                    onNext={game.goToNext}
                    onPrev={game.goToPrev}
                    onRecord={game.recordMurojaah}
                />
            )}
        </TahfizLayout>
    );
};

(TahfizMurojaahPage as any).layout = null;

export default TahfizMurojaahPage;
