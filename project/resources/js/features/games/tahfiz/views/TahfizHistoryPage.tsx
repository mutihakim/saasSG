import { router } from "@inertiajs/react";
import React, { useMemo, useState } from "react";
import { Accordion, ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TahfizLayout from "../components/TahfizLayout";
import useTahfizGameController from "../hooks/useTahfizGameController";
import { MurojaahReport } from "../types";

import { useTenantRoute } from "@/core/config/routes";

const TahfizHistoryPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { history, murojaahHistory, isLoading } = useTahfizGameController();
    const { to } = useTenantRoute();
    const [activeTab, setActiveTab] = useState<"reading" | "murojaah">("reading");

    const locale = i18n.language === "id" ? "id-ID" : "en-US";

    const formatDetailDate = (dateStr: string) => {
        return new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date(dateStr));
    };

    const formatGroupDate = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) return t("tenant.games.tahfiz.history.today");
        if (diffDays === 1) return t("tenant.games.tahfiz.history.yesterday");
        
        return new Intl.DateTimeFormat(locale, {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    const dayKeyFormatter = useMemo(() => new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }), []);

    const groupedMurojaah = useMemo(() => {
        const dateGroups: Record<string, Record<string, MurojaahReport[]>> = {};

        murojaahHistory.forEach((item) => {
            const dateKey = dayKeyFormatter.format(new Date(item.created_at));
            const surahKey = `${item.surah_number}-${item.surah?.nama_latin ?? 'Surah ' + item.surah_number}`;

            if (!dateGroups[dateKey]) dateGroups[dateKey] = {};
            if (!dateGroups[dateKey][surahKey]) dateGroups[dateKey][surahKey] = [];
            
            dateGroups[dateKey][surahKey].push(item);
        });

        return Object.entries(dateGroups)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, surahs]) => {
                const sortedSurahs = Object.entries(surahs).sort(([a], [b]) => {
                    const numA = parseInt(a.split('-')[0]);
                    const numB = parseInt(b.split('-')[0]);
                    return numA - numB;
                });
                return [date, sortedSurahs] as const;
            });
    }, [murojaahHistory, dayKeyFormatter]);

    return (
        <TahfizLayout
            title={t("tenant.games.tahfiz.history.page_title")}
            menuKey="history"
            allowPageScroll
        >
            <div className="math-game-layout__scroll">
                <div className="math-game tahfiz-history">
                    
                    {/* Mode Selector Tabs */}
                    <div className="tahfiz-history__tab-container vocab-mode-container mb-4">
                        <button 
                            type="button" 
                            className={`vocab-mode-btn ${activeTab === "reading" ? "active" : ""}`} 
                            onClick={() => setActiveTab("reading")}
                        >
                            {t("tenant.games.tahfiz.history.tab_reading")}
                        </button>
                        <button 
                            type="button" 
                            className={`vocab-mode-btn ${activeTab === "murojaah" ? "active" : ""}`} 
                            onClick={() => setActiveTab("murojaah")}
                        >
                            {t("tenant.games.tahfiz.history.tab_murojaah")}
                        </button>
                        <div className={`vocab-mode-slider ${activeTab === "murojaah" ? "is-learn" : "is-practice"} has-two-options`} />
                    </div>

                    <div>
                        <div className="tahfiz-history__tab-content p-0">
                            {isLoading ? (
                                <div className="d-flex align-items-center gap-2 py-5 justify-content-center">
                                    <div className="spinner-border spinner-border-sm text-teal-500" role="status" />
                                    <span className="text-muted">{t("tenant.games.tahfiz.history.loading")}</span>
                                </div>
                            ) : activeTab === "reading" ? (
                                // Reading History Tab
                                history.length === 0 ? (
                                    <div className="tahfiz-history__empty-state">
                                        <div className="emoji">📖</div>
                                        <p className="text">{t("tenant.games.tahfiz.history.empty_reading")}</p>
                                        <button
                                            type="button"
                                            className="btn btn-primary rounded-pill px-4 mt-2"
                                            onClick={() => router.visit(to("/games/tahfiz"))}
                                        >
                                            {t("tenant.games.tahfiz.history.start_now")}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {(history as any[]).map((entry, i) => {
                                            const statusKey = entry.status || "reading";
                                            const date = entry.tanggal_catat
                                                ? formatDetailDate(entry.tanggal_catat as string)
                                                : "-";
                                            return (
                                                <div
                                                    key={(entry.id as number | string) ?? i}
                                                    className="tahfiz-history__entry"
                                                >
                                                    <div className="tahfiz-history__surah-number">
                                                        {entry.surah_number as number}
                                                    </div>
                                                    <div className="tahfiz-history__info">
                                                        <div className="title">
                                                            {t("tenant.games.tahfiz.history.surah_label", { n: entry.surah_number })}
                                                            <span className="meta">
                                                                {t("tenant.games.tahfiz.history.ayah_range", { from: entry.ayat_awal, to: entry.ayat_akhir })}
                                                            </span>
                                                        </div>
                                                        <div className="date">
                                                            <i className="ri-calendar-line me-1" /> {date}
                                                        </div>
                                                    </div>
                                                    <span className={`tahfiz-history__status-badge badge bg-primary-subtle text-primary border-primary-subtle`}>
                                                        {t(`tenant.games.tahfiz.history.status.${statusKey}`)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                // Murojaah Evaluation Tab
                                murojaahHistory.length === 0 ? (
                                    <div className="tahfiz-history__empty-state">
                                        <div className="emoji">🧠</div>
                                        <p className="text">{t("tenant.games.tahfiz.history.empty_murojaah")}</p>
                                        <button
                                            type="button"
                                            className="btn btn-teal-500 text-white rounded-pill px-4 mt-2"
                                            onClick={() => router.visit(to("/games/tahfiz"))}
                                        >
                                            {t("tenant.games.tahfiz.history.start_test")}
                                        </button>
                                    </div>
                                ) : (
                                    <Accordion defaultActiveKey="0" className="game-history-accordion">
                                        {groupedMurojaah.map(([dateKey, surahs], dateIdx) => (
                                            <Accordion.Item eventKey={String(dateIdx)} key={dateKey} className="border-0 shadow-sm mb-3 rounded-4 overflow-hidden bg-white">
                                                <Accordion.Header className="shadow-none border-bottom-0">
                                                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="tahfiz-history__group-header-icon">
                                                                <i className="ri-calendar-event-line fs-5"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-slate-800">{formatGroupDate(dateKey)}</div>
                                                                <div className="tahfiz-history__group-meta">{formatDetailDate(dateKey)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Accordion.Header>
                                                <Accordion.Body className="p-2 bg-light">
                                                    <Accordion className="nested-accordion" defaultActiveKey="0">
                                                        {surahs.map(([surahKey, items], subIdx) => {
                                                            const surahName = surahKey.split('-').slice(1).join('-');
                                                            return (
                                                            <Accordion.Item eventKey={String(subIdx)} key={surahKey} className="border-0 mb-2 shadow-sm bg-white rounded-4 overflow-hidden mx-2">
                                                                <Accordion.Header className="shadow-none py-1">
                                                                    <div className="d-flex align-items-center gap-2 small fw-bold text-slate-700">
                                                                        <div className="tahfiz-history__surah-header-icon">
                                                                            <i className="ri-book-read-line"></i>
                                                                        </div>
                                                                        <div className="d-flex flex-column align-items-start">
                                                                            <span>{surahName}</span>
                                                                            <span className="tahfiz-history__surah-meta">
                                                                                {t("tenant.games.tahfiz.history.ayah_evaluated_count", { count: items.length })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </Accordion.Header>
                                                                <Accordion.Body className="p-0">
                                                                    <ListGroup variant="flush" className="rounded-bottom tahfiz-history__list-group">
                                                                        {items.map((item, idx) => (
                                                                            <ListGroup.Item
                                                                                key={item.id}
                                                                                className={`py-2 px-3 border-light small ${idx !== items.length - 1 ? 'border-bottom' : ''}`}
                                                                            >
                                                                                <div className="d-flex w-100 gap-3">
                                                                                    {/* Left side: Nomor Ayat (Fixed Size via SCSS) */}
                                                                                    <div className="flex-shrink-0 py-1">
                                                                                        <div className="tahfiz-history__ayat-badge-large">
                                                                                            {item.ayat}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Right side: Konten (2 Baris) */}
                                                                                    <div className="d-flex flex-column flex-grow-1 justify-content-center py-1" style={{ minWidth: 0 }}>
                                                                                        
                                                                                        {/* Baris Atas: Tajwid, Hafalan, Jam */}
                                                                                        <div className="d-flex align-items-center justify-content-between w-100 flex-nowrap overflow-hidden gap-2">
                                                                                            <span className={`tahfiz-history__status-badge badge border flex-shrink-0 ${
                                                                                                item.tajwid_status === "bagus" ? "bg-success-subtle text-success border-success-subtle" : 
                                                                                                item.tajwid_status === "cukup" ? "bg-warning-subtle text-warning border-warning-subtle" : "bg-danger-subtle text-danger border-danger-subtle"
                                                                                            }`}>
                                                                                                <i className={`${item.tajwid_status === "bagus" ? "ri-checkbox-circle-fill" : item.tajwid_status === "cukup" ? "ri-indeterminate-circle-fill" : "ri-close-circle-fill"}`}></i>
                                                                                                {t(`tenant.games.tahfiz.history.tajwid.${item.tajwid_status}`)}
                                                                                            </span>

                                                                                            <span className={`tahfiz-history__status-badge badge border flex-shrink-1 text-truncate mx-auto ${
                                                                                                item.hafalan_status === "lancar" ? "bg-success-subtle text-success border-success-subtle" : 
                                                                                                item.hafalan_status === "terbata" ? "bg-warning-subtle text-warning border-warning-subtle" : "bg-danger-subtle text-danger border-danger-subtle"
                                                                                            }`}>
                                                                                                <i className={`${item.hafalan_status === "lancar" ? "ri-flashlight-fill" : item.hafalan_status === "terbata" ? "ri-pulse-fill" : "ri-error-warning-fill"}`}></i>
                                                                                                {t(`tenant.games.tahfiz.history.hafalan.${item.hafalan_status}`)}
                                                                                            </span>

                                                                                            <div className="tahfiz-history__time-info">
                                                                                                <i className="ri-time-line me-1"></i>
                                                                                                <span style={{ whiteSpace: "nowrap" }}>
                                                                                                    {new Date(item.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Baris Bawah: Catatan */}
                                                                                        {item.catatan && (
                                                                                            <div className="tahfiz-history__note-text">
                                                                                                "{item.catatan}"
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </ListGroup.Item>
                                                                        ))}
                                                                    </ListGroup>
                                                                </Accordion.Body>
                                                            </Accordion.Item>
                                                        )})}
                                                    </Accordion>
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TahfizLayout>
    );
};

(TahfizHistoryPage as any).layout = null;

export default TahfizHistoryPage;
