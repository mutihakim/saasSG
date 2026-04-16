import { router } from "@inertiajs/react";
import React from "react";

import TahfizLayout from "../components/TahfizLayout";
import useTahfizGameController from "../hooks/useTahfizGameController";

import { useTenantRoute } from "@/core/config/routes";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    reading: { label: "Membaca", color: "bg-primary-subtle text-primary border-primary-subtle" },
    memorizing: { label: "Menghafal", color: "bg-success-subtle text-success border-success-subtle" },
    review: { label: "Review", color: "bg-warning-subtle text-warning border-warning-subtle" },
};

const TahfizHistoryPage: React.FC = () => {
    const { history, isLoading } = useTahfizGameController();
    const { to } = useTenantRoute();

    return (
        <TahfizLayout
            title="Riwayat Tahfiz"
            menuKey="history"
            allowPageScroll
        >
            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                            <h2 className="fs-4 fw-bold mb-0 text-primary">
                                <i className="ri-history-line me-2" /> Riwayat Membaca
                            </h2>
                        </div>
                        <div className="card-body p-4 p-md-5">
                            {isLoading ? (
                                <div className="d-flex align-items-center gap-2">
                                    <div className="spinner-border spinner-border-sm" role="status" />
                                    <span>Memuat riwayat...</span>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-5">
                                    <div style={{ fontSize: "4rem" }}>📖</div>
                                    <p className="text-muted mt-3 fs-5">Belum ada riwayat membaca.</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary rounded-pill px-4 mt-2"
                                        onClick={() => router.visit(to("/games/tahfiz"))}
                                    >
                                        Mulai Sekarang
                                    </button>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {(history as any[]).map((entry, i) => {
                                        const badge = STATUS_LABELS[entry.status] ?? STATUS_LABELS.reading;
                                        const date = entry.tanggal_catat
                                            ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(entry.tanggal_catat as string))
                                            : "-";
                                        return (
                                            <div
                                                key={(entry.id as number | string) ?? i}
                                                className="d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 border bg-white"
                                                style={{ transition: "box-shadow 0.2s" }}
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3 text-white fw-bold fs-5"
                                                    style={{ minWidth: "3rem", height: "3rem", background: "var(--vz-primary)" }}
                                                >
                                                    {entry.surah_number as number}
                                                </div>
                                                <div className="flex-fill">
                                                    <div className="fw-semibold">
                                                        Surah {entry.surah_number as number}
                                                        <span className="text-muted fw-normal ms-2 small">
                                                            Ayat {entry.ayat_awal as number}–{entry.ayat_akhir as number}
                                                        </span>
                                                    </div>
                                                    <div className="small text-muted mt-1">{date}</div>
                                                </div>
                                                <span className={`badge border rounded-pill px-3 py-2 ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
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
