import React, { type RefObject, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CreatableSelect from "react-select/creatable";

import { TahfizAyah, TahfizSettings, TahfizSurahDetail, TahfizTab } from "../types";

import { notify } from "@/core/lib/notify";

type Props = {
    surah: TahfizSurahDetail;
    activeSurahAyahs: TahfizAyah[];
    currentAyahIndex: number;
    currentAyah: TahfizAyah | null;
    isPlaying: boolean;
    isTtsPlaying: boolean;
    activeTab: TahfizTab;
    playbackRate: number;
    currentRepeat: number;
    settings: TahfizSettings;
    uniqueCategories: string[];
    audioRef: RefObject<HTMLAudioElement | null>;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onTabChange: (tab: TahfizTab) => void;
    onSpeedChange: (rate: number) => void;
    onAudioEnded: () => void;
    onToggleFavorite: (surahId: number, start: number, end: number, note?: string, category?: string) => Promise<boolean>;
    onRemoveFavorite: (surahId: number, start: number, end: number) => Promise<boolean>;
};

const TahfizReadingScreen: React.FC<Props> = ({
    surah,
    activeSurahAyahs,
    currentAyahIndex,
    currentAyah,
    isPlaying,
    isTtsPlaying,
    activeTab,
    playbackRate,
    currentRepeat,
    settings,
    uniqueCategories,
    audioRef,
    onTogglePlay,
    onNext,
    onPrev,
    onTabChange,
    onSpeedChange,
    onAudioEnded,
    onToggleFavorite,
    onRemoveFavorite,
}) => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [abState, setAbState] = useState<'off' | 'setA' | 'active'>('off');
    const [abRange, setAbRange] = useState<{ a: number, b: number }>({ a: 0, b: 0 });
    
    // Favorite feature state
    const [showFavModal, setShowFavModal] = useState(false);
    const [favNote, setFavNote] = useState("");
    const [favCategory, setFavCategory] = useState("");
    const [isFavSaving, setIsFavSaving] = useState(false);

    const favoriteData = currentAyah?.tenant_favorites?.[0] ?? null;
    const isFavorite = !!favoriteData;

    const openFavModal = () => {
        setFavNote(favoriteData?.note ?? "");
        setFavCategory(favoriteData?.category ?? "");
        setShowFavModal(true);
    };

    const categoryOptions = useMemo(() => {
        return uniqueCategories.map(c => ({ value: c, label: c }));
    }, [uniqueCategories]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate, audioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if (abState === 'active' && audio.currentTime >= abRange.b) {
                audio.currentTime = abRange.a;
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleLoadedMetadata);
        };
    }, [audioRef, abState, abRange]);

    if (!currentAyah) return null;

    const isCurrentlyPlaying = activeTab === "terjemah" ? isTtsPlaying : isPlaying;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleAbRepeatClick = () => {
        setAbState(prev => {
            if (prev === 'off') {
                setAbRange(r => ({ ...r, a: currentTime }));
                return 'setA';
            }
            if (prev === 'setA') {
                if (currentTime > abRange.a) {
                    setAbRange(r => ({ ...r, b: currentTime }));
                    return 'active';
                }
                return 'off';
            }
            return 'off';
        });
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleSaveFavorite = async () => {
        if (!currentAyah) return;
        setIsFavSaving(true);
        const success = await onToggleFavorite(
            surah.id, 
            currentAyah.nomor_ayat, 
            currentAyah.nomor_ayat, 
            favNote,
            favCategory
        );
        if (success) {
            notify.success(isFavorite ? t("tenant.games.tahfiz.favorite.update_success") : t("tenant.games.tahfiz.favorite.add_success"));
            setShowFavModal(false);
        } else {
            notify.error(t("tenant.games.tahfiz.favorite.save_error"));
        }
        setIsFavSaving(false);
    };

    const handleRemoveFavorite = async () => {
        if (!currentAyah) return;
        setIsFavSaving(true);
        const success = await onRemoveFavorite(surah.id, currentAyah.nomor_ayat, currentAyah.nomor_ayat);
        if (success) {
            notify.success(t("tenant.games.tahfiz.favorite.remove_success"));
            setShowFavModal(false);
        } else {
            notify.error(t("tenant.games.tahfiz.favorite.remove_error"));
        }
        setIsFavSaving(false);
    };

    return (
        <div className="tahfiz-reading d-flex flex-column h-100">
            <audio
                ref={audioRef}
                onEnded={onAudioEnded}
                onError={() => onTogglePlay()}
                className="d-none"
            />

            <div className="tahfiz-reading__tabs-area px-3 pt-2">
                <div className="tahfiz-reading__tabs-inner">
                    <button 
                        onClick={() => onTabChange('arab')}
                        className={`tahfiz-reading__tab-btn ${activeTab === 'arab' ? 'is-active' : ''}`}
                    >
                        <i className="ri-character-recognition-line" />
                        {t("tenant.games.tahfiz.reading.tabs.arab")}
                    </button>
                    <button 
                        onClick={() => onTabChange('latin')}
                        className={`tahfiz-reading__tab-btn ${activeTab === 'latin' ? 'is-active' : ''}`}
                    >
                        <i className="ri-translate-2" />
                        {t("tenant.games.tahfiz.reading.tabs.latin")}
                    </button>
                    <button 
                        onClick={() => onTabChange('terjemah')}
                        className={`tahfiz-reading__tab-btn ${activeTab === 'terjemah' ? 'is-active' : ''}`}
                    >
                        <i className="ri-earth-line" />
                        {t("tenant.games.tahfiz.reading.tabs.translation")}
                    </button>
                </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column mt-3" style={{ minHeight: 0 }}>
                <div className="game-setup-card flex-grow-1 d-flex flex-column mb-3" style={{ minHeight: 0, borderRadius: '2rem' }}>
                    <div className="game-setup-content flex-grow-1 position-relative p-0" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <button
                            type="button"
                            className={`tahfiz-reading__fav-btn btn p-0 shadow-sm border ${
                                isFavorite ? 'tahfiz-reading__fav-btn--active' : 'tahfiz-reading__fav-btn--inactive'
                            }`}
                            style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 100 }}
                            onClick={openFavModal}
                        >
                            <i className={`${isFavorite ? 'ri-star-fill' : 'ri-star-line'}`} />
                            {isFavorite && (favoriteData?.note || favoriteData?.category) && <span className="fav-dot"></span>}
                        </button>

                        <span className="tahfiz-reading__ayah-info" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 100 }}>
                            {t("tenant.games.tahfiz.reading.ayah_info", { current: currentAyah.nomor_ayat, total: surah.jumlah_ayat })}
                        </span>

                        <div className="tahfiz-reading__display px-4 w-100" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
                            {activeTab === 'arab' && (
                                <p className="tahfiz-reading__text-arabic mb-0" dir="rtl">
                                    {currentAyah.teks_arab}
                                </p>
                            )}
                            {activeTab === 'latin' && (
                                <p className="tahfiz-reading__text-latin mb-0">
                                    {currentAyah.teks_latin}
                                </p>
                            )}
                            {activeTab === 'terjemah' && (
                                <p className="tahfiz-reading__text-translation mb-0">
                                    {currentAyah.teks_indonesia}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="tahfiz-reading__controls-area flex-shrink-0 pb-3">
                <div className="tahfiz-reading__controls-inner bg-white shadow-lg border mx-auto" style={{ borderRadius: '2rem', width: '96%', maxWidth: '56rem' }}>
                    <div className="tahfiz-reading__timeline px-4 pt-4">
                        <span className="time-label">
                            {formatTime(currentTime)}
                        </span>
                        
                        <div className="tahfiz-reading__progress-container group">
                            <input 
                                type="range"
                                min="0"
                                max={duration || 0}
                                step="0.01"
                                value={currentTime}
                                onChange={handleSeek}
                                className="tahfiz-reading__seek-input"
                            />
                            <div className="tahfiz-reading__progress-track">
                                {abState === 'active' && (
                                    <div 
                                        className="ab-highlight"
                                        style={{ 
                                            left: `${(abRange.a / duration) * 100}%`,
                                            width: `${((abRange.b - abRange.a) / duration) * 100}%`
                                        }}
                                    ></div>
                                )}
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>

                            {abState !== 'off' && (
                                <div 
                                    className="tahfiz-reading__ab-marker"
                                    style={{ left: `calc(${(abRange.a / duration) * 100}% - 1.5px)` }}
                                ></div>
                            )}
                            {abState === 'active' && (
                                <div 
                                    className="tahfiz-reading__ab-marker"
                                    style={{ left: `calc(${(abRange.b / duration) * 100}% - 1.5px)` }}
                                ></div>
                            )}

                            <div 
                                className="tahfiz-reading__progress-thumb"
                                style={{ left: `calc(${progress}% - 8px)` }}
                            ></div>
                        </div>

                        <span className="time-label time-label--end">
                            {formatTime(duration)}
                        </span>
                    </div>

                    <div className="tahfiz-reading__buttons px-4 pb-4">
                        <div className="tahfiz-reading__side-controls">
                            <button 
                                onClick={handleAbRepeatClick}
                                className={`tahfiz-reading__ab-btn btn btn-sm rounded-pill fw-bold transition-all px-3 ${
                                    abState !== 'off' 
                                        ? 'btn-danger border-danger' 
                                        : 'btn-light text-secondary border'
                                }`}
                            >
                                {abState === 'off' ? 'A-B' : abState === 'setA' ? 'A-...' : 'A-B'}
                            </button>
                            
                            <div className="dropdown">
                                <button 
                                    className="tahfiz-reading__speed-btn btn btn-sm btn-light text-secondary rounded-circle border p-0"
                                    data-bs-toggle="dropdown"
                                    title={t("tenant.games.tahfiz.reading.speed_label")}
                                >
                                    <i className="ri-speed-up-line fs-6" />
                                </button>
                                <ul className="dropdown-menu shadow-lg border-0 rounded-4">
                                    {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                                        <li key={rate}>
                                            <button 
                                                className={`dropdown-item py-2 px-3 fw-medium ${playbackRate === rate ? "active bg-success" : ""}`}
                                                onClick={() => onSpeedChange(rate)}
                                            >
                                                {rate}x {t("tenant.games.tahfiz.reading.speed_suffix")}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <button 
                                className="tahfiz-reading__nav-btn btn btn-light text-secondary rounded-circle shadow-sm border"
                                onClick={onPrev}
                                disabled={currentAyahIndex === 0}
                                title={t("tenant.games.tahfiz.reading.prev_btn")}
                            >
                                <i className="ri-skip-back-fill fs-5" />
                            </button>
                            
                            <button 
                                onClick={onTogglePlay}
                                className="tahfiz-reading__play-btn btn rounded-circle shadow-lg"
                                title={isCurrentlyPlaying ? t("tenant.games.tahfiz.reading.pause_btn") : t("tenant.games.tahfiz.reading.play_btn")}
                            >
                                {isCurrentlyPlaying ? (
                                    <i className="ri-pause-fill" />
                                ) : (
                                    <i className="ri-play-fill ms-1" />
                                )}
                            </button>
                            
                            <button 
                                className="tahfiz-reading__nav-btn btn btn-light text-secondary rounded-circle shadow-sm border"
                                onClick={onNext}
                                disabled={currentAyahIndex === activeSurahAyahs.length - 1}
                                title={t("tenant.games.tahfiz.reading.next_btn")}
                            >
                                <i className="ri-skip-forward-fill fs-5" />
                            </button>
                        </div>

                        <div className="tahfiz-reading__side-controls tahfiz-reading__side-controls--end">
                            <div className="tahfiz-reading__repeat-badge" title={t("tenant.games.tahfiz.reading.repeat_tooltip")}>
                                <i className="ri-repeat-line" />
                                <span>{currentRepeat}/{settings.repeat_count}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showFavModal && (
                <div className="tahfiz-fav-modal p-4">
                    <div className="tahfiz-fav-modal__inner">
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                            <h3 className="tahfiz-fav-modal__title">
                                <i className="ri-star-fill me-2 text-warning" />
                                {t("tenant.games.tahfiz.favorite.modal_title")}
                            </h3>
                            <button 
                                onClick={() => setShowFavModal(false)}
                                className="btn btn-sm btn-link text-muted p-1 text-decoration-none rounded-circle"
                            >
                                <i className="ri-close-line fs-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-teal-800 text-uppercase mb-2">
                                    Kategori
                                </label>
                                <CreatableSelect
                                    isClearable
                                    options={categoryOptions}
                                    value={favCategory ? { value: favCategory, label: favCategory } : null}
                                    onChange={(opt) => setFavCategory(opt?.value ?? "")}
                                    placeholder="Pilih atau ketik kategori baru..."
                                    classNamePrefix="react-select"
                                    maxMenuHeight={200}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-teal-800 text-uppercase mb-2">
                                    {t("tenant.games.tahfiz.favorite.note_label")}
                                </label>
                                <textarea
                                    className="tahfiz-fav-modal__textarea form-control border text-secondary"
                                    placeholder={t("tenant.games.tahfiz.favorite.note_placeholder")}
                                    value={favNote}
                                    onChange={(e) => setFavNote(e.target.value)}
                                />
                            </div>
                            
                            <div className="d-flex flex-column gap-2 mt-4">
                                <button
                                    type="button"
                                    className="tahfiz-fav-modal__submit btn w-100 shadow-sm"
                                    onClick={handleSaveFavorite}
                                    disabled={isFavSaving}
                                >
                                    {isFavSaving ? t("tenant.games.tahfiz.favorite.saving") : (isFavorite ? t("tenant.games.tahfiz.favorite.update_btn") : t("tenant.games.tahfiz.favorite.add_btn"))}
                                </button>
                                
                                {isFavorite && (
                                    <button
                                        type="button"
                                        className="btn btn-link text-danger text-decoration-none small fw-bold mt-1"
                                        onClick={handleRemoveFavorite}
                                        disabled={isFavSaving}
                                    >
                                        {t("tenant.games.tahfiz.favorite.remove_btn")}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TahfizReadingScreen;
