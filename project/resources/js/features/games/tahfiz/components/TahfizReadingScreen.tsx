import React, { type RefObject } from "react";

import type { TahfizAyah, TahfizSettings, TahfizSurahDetail } from "../hooks/useTahfizGameController";

type Props = {
    surah: TahfizSurahDetail;
    activeSurahAyahs: TahfizAyah[];
    currentAyahIndex: number;
    currentAyah: TahfizAyah | null;
    isPlaying: boolean;
    playbackRate: number;
    currentRepeat: number;
    settings: TahfizSettings;
    audioRef: RefObject<HTMLAudioElement | null>;
    onPlay: () => void;
    onStop: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSpeedChange: (rate: number) => void;
    onAudioEnded: () => void;
    onLeave: () => void;
};

const TahfizReadingScreen: React.FC<Props> = ({
    surah,
    activeSurahAyahs,
    currentAyahIndex,
    currentAyah,
    isPlaying,
    playbackRate,
    currentRepeat,
    settings,
    audioRef,
    onPlay,
    onStop,
    onNext,
    onPrev,
    onSpeedChange,
    onAudioEnded,
    onLeave,
}) => {
    if (!currentAyah) return null;

    return (
        <div className="tahfiz-reading h-100">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={onAudioEnded}
                onError={() => onStop()}
                style={{ display: "none" }}
            />

            <div className="math-game__session-card h-100 shadow-none border-0 overflow-hidden">
                {/* Header Info */}
                <div className="math-game__session-header px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            type="button" 
                            className="btn btn-link link-secondary p-0 text-decoration-none d-flex align-items-center gap-1"
                            onClick={onLeave}
                        >
                            <i className="ri-arrow-left-line fs-4" />
                            <span className="fw-semibold">Keluar</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <h5 className="mb-0 fw-bold text-teal-900">{surah.nama_latin}</h5>
                        <p className="text-muted small mb-0 fw-medium">Ayat {currentAyah.nomor_ayat} dari {surah.jumlah_ayat}</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-teal-100 text-teal-800 rounded-pill px-3 py-2 border border-teal-200">
                            {currentAyahIndex + 1} / {activeSurahAyahs.length}
                        </span>
                    </div>
                </div>

                {/* Main Reading Area */}
                <div className="ayah-display-area px-4">
                    <div className="ayah-card">
                        <div className="ayah-card__arabic quran-text">
                            {currentAyah.teks_arab}
                        </div>
                        <div className="ayah-card__translation text-muted">
                            {currentAyah.teks_indonesia}
                        </div>
                        <div className="text-center mt-3">
                            <span className="badge bg-light text-muted border px-3 py-1 rounded-pill fw-medium">
                                {currentAyah.teks_latin}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="tahfiz-controls pb-5 mb-5 pb-md-0 mb-md-0">
                    <div className="tahfiz-controls__main">
                        <button 
                            type="button" 
                            className="btn-control"
                            onClick={onPrev}
                            disabled={currentAyahIndex === 0}
                        >
                            <i className="ri-skip-back-fill fs-3" />
                        </button>

                        <button 
                            type="button" 
                            className={`btn-control btn-control--play ${isPlaying ? "playing" : ""}`}
                            onClick={isPlaying ? onStop : onPlay}
                        >
                            <i className={`${isPlaying ? "ri-pause-fill" : "ri-play-fill"} fs-1`} />
                        </button>

                        <button 
                            type="button" 
                            className="btn-control"
                            onClick={onNext}
                            disabled={currentAyahIndex === activeSurahAyahs.length - 1}
                        >
                            <i className="ri-skip-forward-fill fs-3" />
                        </button>
                    </div>

                    <div className="tahfiz-controls__meta">
                        <div className="dropdown">
                            <button 
                                className="btn btn-sm btn-light rounded-pill px-3 py-1.5 border fw-bold text-muted dropdown-toggle d-flex align-items-center gap-1"
                                type="button"
                                data-bs-toggle="dropdown"
                            >
                                <i className="ri-speed-up-line" />
                                {playbackRate}x
                            </button>
                            <ul className="dropdown-menu shadow-lg border-0 rounded-4">
                                {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                                    <li key={rate}>
                                        <button 
                                            className={`dropdown-item py-2 px-3 fw-medium ${playbackRate === rate ? "active bg-teal-500" : ""}`}
                                            onClick={() => onSpeedChange(rate)}
                                        >
                                            {rate}x Speed
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="d-flex align-items-center gap-2 text-teal-700 fw-bold">
                            <i className="ri-repeat-line" />
                            <span>Pengulangan: {currentRepeat + 1} / {settings.repeat_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TahfizReadingScreen;
