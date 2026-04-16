import React from "react";

type Props = {
    surahs: any[];
    selectedSurahId: number | null;
    ayahFrom: number;
    ayahTo: number;
    totalAyahs: number;
    isLoading: boolean;
    isSurahLoading: boolean;
    onSurahChange: (id: number) => void;
    onAyahFromChange: (val: number) => void;
    onAyahToChange: (val: number) => void;
    onStart: () => void;
};

const TahfizSetupScreen: React.FC<Props> = ({
    surahs,
    selectedSurahId,
    ayahFrom,
    ayahTo,
    totalAyahs,
    isLoading,
    isSurahLoading,
    onSurahChange,
    onAyahFromChange,
    onAyahToChange,
    onStart,
}) => {
    const ayahOptions = totalAyahs > 0
        ? Array.from({ length: totalAyahs }, (_, i) => i + 1)
        : [];

    const isReady = selectedSurahId !== null && !isSurahLoading && totalAyahs > 0;

    return (
        <>
        <div className="tahfiz-setup d-flex flex-column h-100">
            <div className="vocab-setup-card d-flex flex-column h-100 mb-5 pb-5">
                <div className="vocab-setup-content vocab-inner-content p-3 p-md-4">
                    {/* Surah Selector */}
                    <div className="mb-4">
                        <label className="d-block small fw-bold text-teal-800 text-uppercase letter-spacing-1 mb-2">
                            Pilih Surat 📖
                        </label>
                        {isLoading ? (
                            <div className="d-flex align-items-center gap-2 py-4 justify-content-center bg-light rounded-4">
                                <div className="spinner-border spinner-border-sm text-teal-500" role="status" />
                                <span className="small text-muted fw-medium">Memuat daftar surah...</span>
                            </div>
                        ) : (
                            <div className="surah-card-grid">
                                {surahs.slice(0, 114).map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`surah-card ${selectedSurahId === s.id ? "active" : ""}`}
                                        onClick={() => onSurahChange(s.id)}
                                    >
                                        <div className="surah-card__number">#{s.id}</div>
                                        <div className="surah-card__name">{s.nama_latin}</div>
                                        <div className="surah-card__sub">{s.jumlah_ayat} Ayat</div>
                                        <div className="surah-card__arabic">{s.nama}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ayah Range */}
                    <div className="mb-4 mt-2">
                        <label className="d-block small fw-bold text-teal-800 text-uppercase letter-spacing-1 mb-2">
                            Rentang Ayat 🎯
                        </label>
                        <div className="ayah-range-selector">
                            {isSurahLoading ? (
                                <div className="d-flex align-items-center gap-2 py-2">
                                    <div className="spinner-border spinner-border-sm text-teal-500" role="status" />
                                    <span className="small text-muted fw-medium">Memuat data ayat...</span>
                                </div>
                            ) : (
                                <div className="row g-3 align-items-center">
                                    <div className="col">
                                        <label className="form-label small text-muted mb-1 fw-semibold">Dari</label>
                                        <select
                                            className="form-select border-0 shadow-sm"
                                            value={ayahFrom}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                onAyahFromChange(val);
                                                if (val > ayahTo) onAyahToChange(val);
                                            }}
                                            disabled={!isReady}
                                        >
                                            {ayahOptions.map((n) => (
                                                <option key={n} value={n}>Ayat {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-auto pt-4">
                                        <i className="ri-arrow-right-line text-muted" />
                                    </div>
                                    <div className="col">
                                        <label className="form-label small text-muted mb-1 fw-semibold">Sampai</label>
                                        <select
                                            className="form-select border-0 shadow-sm"
                                            value={ayahTo}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                onAyahToChange(val);
                                                if (val < ayahFrom) onAyahFromChange(val);
                                            }}
                                            disabled={!isReady}
                                        >
                                            {ayahOptions.map((n) => (
                                                <option key={n} value={n}>Ayat {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info summary */}
                    {isReady && (
                        <div className="vocab-bottom-meta d-flex align-items-center gap-3 px-3 py-3 bg-teal-50 border border-teal-100 rounded-4 small mt-4">
                            <span className="text-teal-700 d-flex align-items-center gap-2 fw-bold">
                                <i className="ri-book-open-fill fs-5" />
                                <span>{ayahTo - ayahFrom + 1} Ayat terpilih</span>
                            </span>
                            <div className="vr text-teal-200" />
                            <span className="text-teal-700 d-flex align-items-center gap-2 fw-medium">
                                <i className="ri-volume-up-fill fs-5" />
                                <span>Audio HD Siap</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Floating Start Button */}
            <div
                className="vocab-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 p-md-5 d-flex justify-content-center"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
                <div className="w-100 vocab-start-floating__inner">
                    <button
                        id="tahfiz-btn-start-reading"
                        type="button"
                        className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={onStart}
                        disabled={!isReady}
                    >
                        <i className="ri-book-open-line fs-5" />
                        Tampilkan Ayat 🕌
                    </button>
                </div>
            </div>
        </>
    );
};

export default TahfizSetupScreen;
