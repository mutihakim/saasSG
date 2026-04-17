import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { TahfizAyah, TahfizSurahDetail, MurojaahReport } from "../types";

import { notify } from "@/core/lib/notify";

type Props = {
    surah: TahfizSurahDetail;
    activeSurahAyahs: TahfizAyah[];
    currentAyahIndex: number;
    currentAyah: TahfizAyah | null;
    murojaahHistory: MurojaahReport[];
    onNext: () => void;
    onPrev: () => void;
    onRecord: (data: any) => Promise<boolean>;
};

const TahfizMurojaahScreen: React.FC<Props> = ({
    surah,
    activeSurahAyahs,
    currentAyahIndex,
    currentAyah,
    murojaahHistory,
    onNext,
    onPrev,
    onRecord,
}) => {
    const { t } = useTranslation();

    const initialRecord = currentAyah 
        ? murojaahHistory.find((r) => r.surah_number === surah.id && r.ayat === currentAyah.nomor_ayat)
        : null;

    const [tajwidStatus, setTajwidStatus] = useState<string>(initialRecord?.tajwid_status || "");
    const [hafalanStatus, setHafalanStatus] = useState<string>(initialRecord?.hafalan_status || "");
    const [catatan, setCatatan] = useState<string>(initialRecord?.catatan || "");
    const [isSaving, setIsSaving] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    if (!currentAyah) return null;

    const handleSave = async () => {
        if (!tajwidStatus || !hafalanStatus) {
            notify.error(t("tenant.games.tahfiz.murojaah.error_selection"));
            return;
        }

        setIsSaving(true);
        const success = await onRecord({
            surah_number: surah.id,
            ayat: currentAyah.nomor_ayat,
            tajwid_status: tajwidStatus,
            hafalan_status: hafalanStatus,
            catatan: catatan,
        });

        if (success) {
            notify.success(t("tenant.games.tahfiz.murojaah.save_success", { ayat: currentAyah.nomor_ayat }));
        } else {
            notify.error(t("tenant.games.tahfiz.murojaah.save_error"));
        }
        setIsSaving(false);
    };

    const getActiveColorClass = (id: string, type: 'tajwid' | 'hafalan') => {
        const status = type === 'tajwid' ? tajwidStatus : hafalanStatus;
        if (status !== id) return 'bg-transparent text-slate-400';
        
        // Sesuai desain: bukan background ngejreng, tapi text warna aktif dan background soft
        if (id === 'bagus' || id === 'lancar') return 'bg-success-subtle text-success fw-bold';
        if (id === 'cukup' || id === 'terbata') return 'bg-warning-subtle text-warning fw-bold';
        return 'bg-danger-subtle text-danger fw-bold';
    };

    return (
        <div className="tahfiz-reading tahfiz-murojaah d-flex flex-column h-100">
            <div className="flex-grow-1 d-flex flex-column mt-3" style={{ minHeight: 0 }}>
                <div className="game-setup-card flex-grow-1 d-flex flex-column mb-3" style={{ minHeight: 0, borderRadius: '2rem' }}>
                    <div className="game-setup-content flex-grow-1 position-relative p-0" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div className="tahfiz-murojaah__badge-wrap" style={{ position: 'absolute', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                            <span className="tahfiz-murojaah__badge badge bg-light text-secondary border border-light rounded-pill shadow-sm text-uppercase fw-bold px-3 py-1">
                                {t("tenant.games.tahfiz.murojaah.ayah_label", { number: currentAyah.nomor_ayat })}
                            </span>
                        </div>

                        <div className="tahfiz-reading__display px-4 w-100" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
                            <div className="tahfiz-murojaah__arabic text-center w-100" dir="rtl" style={{ fontSize: 'clamp(1.5rem, 5vh, 2.25rem)', lineHeight: 2 }}>
                                {currentAyah.teks_arab}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tahfiz-reading__controls-area flex-shrink-0 pb-3">
                <div className="tahfiz-reading__controls-inner bg-white shadow-lg border mx-auto" style={{ borderRadius: '2rem', width: '96%', maxWidth: '56rem', position: 'relative' }}>
                    <button
                        type="button"
                        className="tahfiz-murojaah__notes-trigger btn btn-white bg-white shadow-sm border d-flex align-items-center justify-content-center p-0 transition-all rounded-circle"
                        style={{ position: 'absolute', top: '-1.25rem', right: '1.25rem', width: '2.5rem', height: '2.5rem', zIndex: 100 }}
                        onClick={() => setShowNotesModal(true)}
                    >
                        <i className="ri-chat-3-line fs-5" />
                        {catatan.trim() !== "" && (
                            <span className="note-dot"></span>
                        )}
                    </button>

                    <div className="pb-safe-inset d-flex flex-column justify-content-center w-100 mx-auto px-4 py-4">
                        <div className="row g-2 mb-3 mt-0">
                            <div className="col-6">
                                <div className="text-center mb-1">
                                    <h3 className="tahfiz-murojaah__meta-label text-slate-800 fw-bold m-0" style={{ fontSize: '0.65rem' }}>
                                        TAJWID 💎
                                    </h3>
                                </div>
                                <div className="d-flex bg-slate-50 rounded-pill p-1 border border-light">
                                    {[
                                        { id: "bagus", icon: "ri-checkbox-circle-line" },
                                        { id: "cukup", icon: "ri-subtract-line" },
                                        { id: "kurang", icon: "ri-close-circle-line" }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`btn btn-sm flex-grow-1 border-0 rounded-pill d-flex align-items-center justify-content-center py-1 transition-all ${getActiveColorClass(item.id, 'tajwid')}`}
                                            onClick={() => setTajwidStatus(item.id)}
                                            title={t(`tenant.games.tahfiz.murojaah.status.${item.id}`)}
                                        >
                                            <i className={`${item.icon} fs-6`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-6">
                                <div className="text-center mb-1">
                                    <h3 className="tahfiz-murojaah__meta-label text-slate-800 fw-bold m-0" style={{ fontSize: '0.65rem' }}>
                                        HAFALAN 🚀
                                    </h3>
                                </div>
                                <div className="d-flex bg-slate-50 rounded-pill p-1 border border-light">
                                    {[
                                        { id: "lancar", icon: "ri-flashlight-line" },
                                        { id: "terbata", icon: "ri-pulse-line" },
                                        { id: "lupa", icon: "ri-error-warning-line" }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`btn btn-sm flex-grow-1 border-0 rounded-pill d-flex align-items-center justify-content-center py-1 transition-all ${getActiveColorClass(item.id, 'hafalan')}`}
                                            onClick={() => setHafalanStatus(item.id)}
                                            title={t(`tenant.games.tahfiz.murojaah.status.${item.id}`)}
                                        >
                                            <i className={`${item.icon} fs-6`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between gap-3">
                            <button 
                                className="tahfiz-murojaah__action-btn btn btn-light text-secondary rounded-circle shadow-sm border"
                                style={{ width: '2.5rem', height: '2.5rem', padding: 0 }}
                                onClick={onPrev}
                                disabled={currentAyahIndex === 0}
                            >
                                <i className="ri-skip-back-fill fs-5" />
                            </button>
                            
                            <button
                                type="button"
                                className="tahfiz-murojaah__save-btn btn flex-grow-1 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: '#4a9d92', borderColor: '#4a9d92', color: 'white', fontWeight: 700, padding: '0.75rem' }}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                    <i className="ri-save-3-line fs-5" />
                                )}
                                <span>{t("tenant.games.tahfiz.murojaah.save_btn")}</span>
                            </button>

                            <button 
                                className="tahfiz-murojaah__action-btn btn btn-light text-secondary rounded-circle shadow-sm border"
                                style={{ width: '2.5rem', height: '2.5rem', padding: 0 }}
                                onClick={onNext}
                                disabled={currentAyahIndex === activeSurahAyahs.length - 1}
                            >
                                <i className="ri-skip-forward-fill fs-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showNotesModal && (
                <div className="tahfiz-murojaah-modal p-4">
                    <div className="tahfiz-murojaah-modal__inner bg-white rounded-4 shadow-lg w-100 overflow-hidden">
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                            <h3 className="tahfiz-murojaah-modal__title m-0 fw-bold text-uppercase d-flex align-items-center">
                                <i className="ri-chat-3-line text-teal-600 me-2 fs-5" />
                                {t("tenant.games.tahfiz.murojaah.notes_title")}
                            </h3>
                            <button 
                                onClick={() => setShowNotesModal(false)}
                                className="btn btn-sm btn-link text-muted p-1 text-decoration-none rounded-circle"
                            >
                                <i className="ri-close-line fs-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea
                                className="tahfiz-murojaah-modal__textarea form-control border bg-slate-50 text-secondary"
                                placeholder={t("tenant.games.tahfiz.murojaah.notes_placeholder")}
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="tahfiz-murojaah-modal__submit btn w-100 rounded-pill py-2 fw-bold text-white shadow-sm mt-4"
                                style={{ backgroundColor: '#4a9d92', borderColor: '#4a9d92' }}
                                onClick={() => setShowNotesModal(false)}
                            >
                                {t("tenant.games.tahfiz.murojaah.notes_done")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TahfizMurojaahScreen;
