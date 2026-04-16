import React from "react";

import TahfizLayout from "../components/TahfizLayout";
import TahfizReadingScreen from "../components/TahfizReadingScreen";
import TahfizSetupScreen from "../components/TahfizSetupScreen";
import useTahfizGameController from "../hooks/useTahfizGameController";

const TahfizPage: React.FC = () => {
    const game = useTahfizGameController();

    const isSessionActive = game.phase === "reading";

    return (
        <TahfizLayout
            title="Tahfiz"
            menuKey="main"
            isSessionActive={isSessionActive}
            allowPageScroll={!isSessionActive}
            onLeavingSession={game.stopReading}
        >
            <div className={`math-game-layout__scroll${isSessionActive ? " math-game-layout__scroll--session" : ""}`}>
                <div className={`math-game${isSessionActive ? " math-game--session" : ""}`}>

                    {/* Loading state */}
                    {game.isLoading && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body d-flex align-items-center gap-2 py-4">
                                <div className="spinner-border spinner-border-sm" role="status" />
                                <span>Memuat data Quran...</span>
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
                            onSurahChange={(id) => void game.loadSurahDetail(id)}
                            onAyahFromChange={game.setAyahFrom}
                            onAyahToChange={game.setAyahTo}
                            onStart={game.startReading}
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
                            playbackRate={game.playbackRate}
                            currentRepeat={game.currentRepeat}
                            settings={game.settings}
                            audioRef={game.audioRef}
                            onPlay={game.playCurrentAyah}
                            onStop={game.stopAudio}
                            onNext={game.goToNext}
                            onPrev={game.goToPrev}
                            onSpeedChange={game.setPlaybackRate}
                            onAudioEnded={game.handleAudioEnded}
                            onLeave={game.stopReading}
                        />
                    )}
                </div>
            </div>
        </TahfizLayout>
    );
};

(TahfizPage as any).layout = null;

export default TahfizPage;
