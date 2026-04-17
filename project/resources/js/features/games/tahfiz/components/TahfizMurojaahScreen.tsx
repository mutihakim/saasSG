import React, { useState, useEffect } from "react";
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        <>
        <div className="tahfiz-reading tahfiz-murojaah h-100 flex-column d-flex position-relative">
            <div className="tahfiz-reading__bg"></div>

            <div className="tahfiz-reading__content-wrapper px-3 d-flex flex-column h-100">
                <main className="tahfiz-reading__main d-flex flex-column pt-3 flex-grow-1 overflow-hidden mb-4">
                    <div className="tahfiz-reading__card bg-white shadow-sm flex-grow-1 d-flex flex-column align-items-center justify-content-center position-relative p-4">
                        <div className="tahfiz-murojaah__badge-wrap">
                            <span className="tahfiz-murojaah__badge badge bg-light text-secondary border border-light rounded-pill shadow-sm text-uppercase fw-bold px-3 py-1">
                                {t("tenant.games.tahfiz.murojaah.ayah_label", { number: currentAyah.nomor_ayat })}
                            </span>
                        </div>

                        <div className="text-center w-100 my-auto">
                            <div className="tahfiz-murojaah__arabic text-center w-100" dir="rtl">
                                {currentAyah.teks_arab}
                            </div>
                        </div>
                    </div>
                </main>

                <div className="tahfiz-reading__controls-area w-100 position-relative mt-auto">
                    <button
                        type="button"
                        className="tahfiz-murojaah__notes-trigger btn btn-white bg-white shadow-sm border d-flex align-items-center justify-content-center p-0 transition-all rounded-circle"
                        onClick={() => setShowNotesModal(true)}
                    >
                        <i className="ri-chat-3-line fs-5" />
                        {catatan.trim() !== "" && (
                            <span className="note-dot"></span>
                        )}
                    </button>

                    <div className="tahfiz-reading__controls-inner pb-safe-inset d-flex flex-column justify-content-center w-100 mx-auto">
                        <div className="row g-2 mb-3 mt-0">
                            <div className="col-6">
                                <div className="text-center mb-1">
                                    <h3 className="tahfiz-murojaah__meta-label text-slate-800 fw-bold m-0">
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
                                    <h3 className="tahfiz-murojaah__meta-label text-slate-800 fw-bold m-0">
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

                        <div className="d-flex align-items-center justify-content-between gap-3 px-2">
                            <button 
                                className="tahfiz-murojaah__action-btn btn btn-light text-secondary rounded-circle shadow-sm border"
                                onClick={onPrev}
                                disabled={currentAyahIndex === 0}
                            >
                                <i className="ri-skip-back-fill fs-5" />
                            </button>
                            
                            <button
                                type="button"
                                className="tahfiz-murojaah__save-btn btn flex-grow-1 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
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
                                onClick={onNext}
                                disabled={currentAyahIndex === activeSurahAyahs.length - 1}
                            >
                                <i className="ri-skip-forward-fill fs-5" />
                            </button>
                        </div>
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
                            onClick={() => setShowNotesModal(false)}
                        >
                            {t("tenant.games.tahfiz.murojaah.notes_done")}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default TahfizMurojaahScreen;
