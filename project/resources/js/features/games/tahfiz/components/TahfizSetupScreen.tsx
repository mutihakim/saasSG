import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select, { type FilterOptionOption } from "react-select";

import { TahfizSurah, TahfizFavorite } from "../types";

type Props = {
    surahs: TahfizSurah[];
    selectedSurahId: number | null;
    ayahFrom: number;
    ayahTo: number;
    totalAyahs: number;
    isLoading: boolean;
    isSurahLoading: boolean;
    mode: "learn" | "test";
    lastReadingProgress: any | null;
    lastMurojaahProgress: any | null;
    favoriteAyahs: TahfizFavorite[];
    onSurahChange: (id: number) => void;
    onAyahFromChange: (val: number) => void;
    onAyahToChange: (val: number) => void;
    onModeChange: (mode: "learn" | "test") => void;
    onStart: () => void;
    onResumeProgress: (type: "reading" | "murojaah") => void;
    onSelectFavorite: (fav: TahfizFavorite) => void;
};

type FavoriteOption = {
    value: number;
    label: string;
    note?: string;
    category?: string;
    data: TahfizFavorite;
};

const TahfizSetupScreen: React.FC<Props> = ({
    surahs,
    selectedSurahId,
    ayahFrom,
    ayahTo,
    totalAyahs,
    isLoading,
    isSurahLoading,
    mode,
    lastReadingProgress,
    lastMurojaahProgress,
    favoriteAyahs,
    onSurahChange,
    onAyahFromChange,
    onAyahToChange,
    onModeChange,
    onStart,
    onResumeProgress,
    onSelectFavorite,
}) => {
    const { t } = useTranslation();

    const ayahOptions = totalAyahs > 0
        ? Array.from({ length: totalAyahs }, (_, i) => i + 1)
        : [];

    const isReady = selectedSurahId !== null && !isSurahLoading && totalAyahs > 0;

    const favoriteOptions = useMemo(() => {
        const groups: Record<string, FavoriteOption[]> = {};
        
        favoriteAyahs.forEach(f => {
            const cat = f.category || t("tenant.games.tahfiz.setup.favorite_category_default");
            if (!groups[cat]) groups[cat] = [];
            
            const label = f.ayah_start === f.ayah_end 
                ? t("tenant.games.tahfiz.setup.favorite_label_single", { surah: f.surah.nama_latin, ayat: f.ayah_start })
                : t("tenant.games.tahfiz.setup.favorite_label_range", { surah: f.surah.nama_latin, from: f.ayah_start, to: f.ayah_end });

            groups[cat].push({
                value: f.id,
                label,
                note: f.note,
                category: cat,
                data: f
            });
        });

        return Object.entries(groups).map(([cat, options]) => ({
            label: cat,
            options
        }));
    }, [favoriteAyahs, t]);

    return (
        <>
            <div className="tahfiz-setup d-flex flex-column h-100">
                <div className="vocab-setup-card d-flex flex-column h-100 mb-3">
                    <div className="vocab-setup-content vocab-inner-content p-3 p-md-4">
                        {/* Mode Selector */}
                        <div className="mb-4">
                            <label className="tahfiz-setup__section-label">
                                {t("tenant.games.tahfiz.setup.mode_label")} 🎯
                            </label>
                            <div className="vocab-mode-container">
                                <button 
                                    type="button" 
                                    className={`vocab-mode-btn ${mode === "learn" ? "active" : ""}`} 
                                    onClick={() => onModeChange("learn")}
                                >
                                    {t("tenant.games.tahfiz.setup.mode_learn")}
                                </button>
                                <button 
                                    type="button" 
                                    className={`vocab-mode-btn ${mode === "test" ? "active" : ""}`} 
                                    onClick={() => onModeChange("test")}
                                >
                                    {t("tenant.games.tahfiz.setup.mode_test")}
                                </button>
                                <div className={`vocab-mode-slider ${mode === "test" ? "is-learn" : "is-practice"} has-two-options`} />
                            </div>
                        </div>

                        {/* Surah Selector */}
                        <div className="mb-4">
                            <label className="tahfiz-setup__section-label">
                                {t("tenant.games.tahfiz.setup.surah_label")} 📖
                            </label>
                            {isLoading ? (
                                <div className="tahfiz-setup__loading-placeholder">
                                    <div className="spinner-border spinner-border-sm text-teal-500" role="status" />
                                    <span>{t("tenant.games.tahfiz.setup.loading_surahs")}</span>
                                </div>
                            ) : (
                                <select
                                    className="tahfiz-setup__surah-select form-select"
                                    value={selectedSurahId || ""}
                                    onChange={(e) => onSurahChange(Number(e.target.value))}
                                >
                                    <option value="" disabled>{t("tenant.games.tahfiz.setup.surah_placeholder")}</option>
                                    {[...surahs].slice(0, 114).sort((a, b) => b.id - a.id).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            #{s.id} {s.nama_latin} ({s.nama}) - {s.jumlah_ayat} {t("tenant.games.tahfiz.setup.ayah_count_label")}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Ayah Range */}
                        <div className="mb-3 mt-2">
                            <label className="tahfiz-setup__section-label">
                                {t("tenant.games.tahfiz.setup.range_label")} 🎯
                            </label>
                            <div className="tahfiz-setup__range-wrapper">
                                {isSurahLoading ? (
                                    <div className="d-flex align-items-center gap-2 py-2">
                                        <div className="spinner-border spinner-border-sm text-teal-500" role="status" />
                                        <span className="small text-muted fw-medium">{t("tenant.games.tahfiz.setup.loading_ayahs")}</span>
                                    </div>
                                ) : (
                                    <div className="row g-3 align-items-center">
                                        <div className="col">
                                            <label className="form-label small text-muted mb-1 fw-semibold">{t("tenant.games.tahfiz.setup.range_from")}</label>
                                            <select
                                                className="tahfiz-setup__range-select form-select"
                                                value={ayahFrom}
                                                onChange={(e) => onAyahFromChange(Number(e.target.value))}
                                                disabled={!isReady}
                                            >
                                                {ayahOptions.filter(n => n <= ayahTo).map((n) => (
                                                    <option key={n} value={n}>{t("tenant.games.tahfiz.setup.ayah_number", { n })}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-auto pt-4">
                                            <i className="ri-arrow-right-line text-muted" />
                                        </div>
                                        <div className="col">
                                            <label className="form-label small text-muted mb-1 fw-semibold">{t("tenant.games.tahfiz.setup.range_to")}</label>
                                            <select
                                                className="tahfiz-setup__range-select form-select"
                                                value={ayahTo}
                                                onChange={(e) => onAyahToChange(Number(e.target.value))}
                                                disabled={!isReady}
                                            >
                                                {ayahOptions.filter(n => n >= ayahFrom).map((n) => (
                                                    <option key={n} value={n}>{t("tenant.games.tahfiz.setup.ayah_number", { n })}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info summary */}
                        {isReady && (
                            <div className="tahfiz-setup__info-box">
                                <span className="info-item info-item--bold">
                                    <i className="ri-book-open-fill" />
                                    <span>{t("tenant.games.tahfiz.setup.selected_info", { count: ayahTo - ayahFrom + 1 })}</span>
                                </span>
                                <div className="divider" />
                                <span className="info-item info-item--medium">
                                    <i className="ri-volume-up-fill" />
                                    <span>{t("tenant.games.tahfiz.setup.audio_ready")}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Favorite Ayahs Section */}
                {favoriteAyahs.length > 0 && (
                    <div className="vocab-setup-card mb-3">
                        <div className="vocab-setup-content p-3 p-md-4">
                            <label className="tahfiz-setup__section-label">
                                {t("tenant.games.tahfiz.setup.favorite_section_label")} ⭐
                            </label>
                            
                            <div className="position-relative tahfiz-setup-fav-select">
                                <Select<FavoriteOption, false, any>
                                    options={favoriteOptions}
                                    placeholder={t("tenant.games.tahfiz.setup.favorite_placeholder")}
                                    classNamePrefix="react-select"
                                    isSearchable
                                    value={null}
                                    onChange={(opt) => {
                                        if (opt) {
                                            onSelectFavorite(opt.data);
                                        }
                                    }}
                                    filterOption={(option: FilterOptionOption<FavoriteOption>, inputValue: string) => {
                                        if (!inputValue) return true;
                                        const q = inputValue.toLowerCase();
                                        const label = option.data.label?.toLowerCase() ?? "";
                                        const note = option.data.note?.toLowerCase() ?? "";
                                        const category = option.data.category?.toLowerCase() ?? "";
                                        return label.includes(q) || note.includes(q) || category.includes(q);
                                    }}
                                    formatOptionLabel={(opt) => (
                                        <div className="tahfiz-setup__fav-option">
                                            <span className="label">{opt.label}</span>
                                            {opt.note && <span className="note">{opt.note}</span>}
                                        </div>
                                    )}
                                    noOptionsMessage={() => t("tenant.games.tahfiz.setup.favorite_no_options")}
                                    maxMenuHeight={240}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Start Button / Resume Progress */}
            <div className="vocab-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 p-md-5 d-flex justify-content-center pb-safe-inset">
                <div className="w-100 vocab-start-floating__inner">
                    {!isReady ? (
                        (() => {
                            const lastProgress = mode === "learn" ? lastReadingProgress : lastMurojaahProgress;
                            if (lastProgress) {
                                const surahName = lastProgress.surah?.nama_latin ?? `Surah ${lastProgress.surah_number}`;
                                const ayahNum = mode === "learn" ? lastProgress.ayat_awal : lastProgress.ayat;
                                return (
                                    <button
                                        type="button"
                                        className={`btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2 tahfiz-setup__resume-btn--${mode === "learn" ? "learn" : "test"}`}
                                        onClick={() => onResumeProgress(mode === "learn" ? "reading" : "murojaah")}
                                    >
                                        <i className="ri-history-line fs-5" />
                                        <span>
                                            {t("tenant.games.tahfiz.setup.resume_btn", { 
                                                type: mode === "learn" ? t("tenant.games.tahfiz.setup.resume_type_read") : t("tenant.games.tahfiz.setup.resume_type_test"),
                                                surah: surahName,
                                                ayat: ayahNum
                                            })}
                                        </span>
                                    </button>
                                );
                            }
                            return (
                                <button
                                    type="button"
                                    className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2 opacity-75"
                                    disabled
                                >
                                    <i className="ri-error-warning-line fs-5" />
                                    {t("tenant.games.tahfiz.setup.start_disabled")}
                                </button>
                            );
                        })()
                    ) : (
                        <button
                            id="tahfiz-btn-start-reading"
                            type="button"
                            className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={onStart}
                        >
                            <i className={mode === "test" ? "ri-test-tube-line fs-5" : "ri-book-open-line fs-5"} />
                            {mode === "test" ? t("tenant.games.tahfiz.setup.start_test_btn") : t("tenant.games.tahfiz.setup.start_learn_btn")}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default TahfizSetupScreen;
