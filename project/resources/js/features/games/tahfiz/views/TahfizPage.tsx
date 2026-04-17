import React from "react";
import { useTranslation } from "react-i18next";

import TahfizLayout from "../components/TahfizLayout";
import TahfizMurojaahScreen from "../components/TahfizMurojaahScreen";
import TahfizReadingScreen from "../components/TahfizReadingScreen";
import TahfizSetupScreen from "../components/TahfizSetupScreen";
import useTahfizGameController from "../hooks/useTahfizGameController";

const TahfizPage: React.FC = () => {
    const { t } = useTranslation();
    const game = useTahfizGameController();

    const isSessionActive = game.phase === "reading" || game.phase === "murojaah";

    const getLayoutTitle = () => {
        if ((game.phase === "murojaah" || game.phase === "reading") && game.selectedSurah) {
            const subTitle = game.phase === "murojaah" 
                ? t("tenant.games.tahfiz.page.subtitle_murojaah")
                : t("tenant.games.tahfiz.page.subtitle_reading");
                
            return (
                <div className="tahfiz-page-title">
                    <span className="tahfiz-page-title__main">{game.selectedSurah.nama_latin}</span>
                    <span className="tahfiz-page-title__sub">{subTitle}</span>
                </div>
            );
        }
        return t("tenant.games.tahfiz.page.title");
    };

    return (
        <TahfizLayout
            title={getLayoutTitle()}
            menuKey="main"
            isSessionActive={isSessionActive}
            allowPageScroll={!isSessionActive}
            onLeavingSession={game.stopSession}
        >
            <div className={`math-game-layout__scroll${isSessionActive ? " math-game-layout__scroll--session" : ""}`}>
                <div className={`math-game${isSessionActive ? " math-game--session" : ""}`}>

                    {/* Loading state */}
                    {game.isLoading && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body d-flex align-items-center gap-2 py-4">
                                <div className="spinner-border spinner-border-sm" role="status" />
                                <span>{t("tenant.games.tahfiz.page.loading")}</span>
                            </div>
                        </div>
                    )}

                    {/* Setup Phase */}
                    {!game.isLoading && game.phase === "setup" && (
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
                            onStart={game.startSession}
                            onResumeProgress={game.resumeProgress}
                            onSelectFavorite={game.loadFavorite}
                        />
                    )}

                    {/* Reading Phase */}
                    {game.phase === "reading" && game.selectedSurah && game.currentAyah && (
                        <TahfizReadingScreen
                            surah={game.selectedSurah}
                            activeSurahAyahs={game.activeSurahAyahs}
                            currentAyahIndex={game.currentAyahIndex}
                            currentAyah={game.currentAyah}
                            isPlaying={game.isPlaying}
                            isTtsPlaying={game.isTtsPlaying}
                            activeTab={game.activeTab}
                            playbackRate={game.playbackRate}
                            currentRepeat={game.currentRepeat}
                            settings={game.settings}
                            uniqueCategories={game.uniqueCategories}
                            audioRef={game.audioRef}
                            onTogglePlay={game.togglePlay}
                            onNext={game.goToNext}
                            onPrev={game.goToPrev}
                            onTabChange={game.setActiveTab}
                            onSpeedChange={game.setPlaybackRate}
                            onAudioEnded={game.handlePlaybackEnded}
                            onToggleFavorite={game.toggleFavorite}
                            onRemoveFavorite={game.removeFavorite}
                        />
                    )}

                    {/* Murojaah Phase */}
                    {game.phase === "murojaah" && game.selectedSurah && game.currentAyah && (
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
                </div>
            </div>
        </TahfizLayout>
    );
};

(TahfizPage as any).layout = null;

export default TahfizPage;
