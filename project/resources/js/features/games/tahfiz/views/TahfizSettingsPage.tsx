import React, { useState } from "react";

import TahfizLayout from "../components/TahfizLayout";
import useTahfizGameController from "../hooks/useTahfizGameController";

const RECITERS = [
    { id: "01", name: "Abdullah Al-Juhany" },
    { id: "02", name: "Abdul-Muhsin Al-Qasim" },
    { id: "03", name: "Abdurrahman as-Sudais" },
    { id: "04", name: "Ibrahim Al-Dossari" },
    { id: "05", name: "Misyari Rasyid Al-Afasi" },
];

const TahfizSettingsPage: React.FC = () => {
    const { settings, isLoading, updateSettings } = useTahfizGameController();
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        const ok = await updateSettings(settings);
        setSaving(false);
        if (ok) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <TahfizLayout
            title="Pengaturan Tahfiz"
            menuKey="settings"
            allowPageScroll
        >
            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                            <h2 className="fs-4 fw-bold mb-0 text-primary">
                                <i className="ri-settings-3-line me-2" /> Pengaturan Default
                            </h2>
                        </div>
                        <div className="card-body p-4 p-md-5">
                            {isLoading ? (
                                <div className="d-flex align-items-center gap-2">
                                    <div className="spinner-border spinner-border-sm" role="status" />
                                    <span>Memuat pengaturan...</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Qari / Reciter</label>
                                            <select
                                                id="tahfiz-settings-reciter"
                                                className="form-select form-select-lg border-secondary-subtle"
                                                value={settings.default_reciter}
                                                onChange={(e) => void updateSettings({ default_reciter: e.target.value })}
                                            >
                                                {RECITERS.map((r) => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <div className="form-text mt-2">Suara yang akan diputar saat memutar audio ayat.</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Jumlah Pengulangan per Ayat</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    id="tahfiz-settings-repeat-minus"
                                                    style={{ width: "2.5rem", height: "2.5rem" }}
                                                    onClick={() => void updateSettings({ repeat_count: Math.max(1, settings.repeat_count - 1) })}
                                                >
                                                    <i className="ri-subtract-line" />
                                                </button>
                                                <span className="fs-4 fw-bold text-primary px-2" style={{ minWidth: "2rem", textAlign: "center" }}>
                                                    {settings.repeat_count}x
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                    id="tahfiz-settings-repeat-plus"
                                                    style={{ width: "2.5rem", height: "2.5rem" }}
                                                    onClick={() => void updateSettings({ repeat_count: Math.min(10, settings.repeat_count + 1) })}
                                                >
                                                    <i className="ri-add-line" />
                                                </button>
                                            </div>
                                            <div className="form-text mt-2">Ulangi setiap ayat sebelum lanjut ke ayat berikutnya.</div>
                                        </div>

                                        <div className="col-12">
                                            <hr className="my-2 opacity-10" />
                                        </div>

                                        <div className="col-12">
                                            <div className="form-check form-switch mb-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    id="tahfiz-settings-auto-next"
                                                    style={{ width: "3rem", height: "1.5rem" }}
                                                    checked={settings.auto_next}
                                                    onChange={(e) => void updateSettings({ auto_next: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-semibold ms-2" htmlFor="tahfiz-settings-auto-next">
                                                    Putar Ayat Berikutnya Otomatis
                                                </label>
                                            </div>
                                            <p className="text-muted small ms-5">
                                                Setelah audio selesai, lanjutkan otomatis ke ayat berikutnya.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 d-flex align-items-center gap-3">
                                        <button
                                            id="tahfiz-settings-save"
                                            type="submit"
                                            className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow-sm fw-bold d-flex align-items-center gap-2"
                                            disabled={saving}
                                        >
                                            {saving ? <div className="spinner-border spinner-border-sm" role="status" /> : <i className="ri-save-line fs-5" />}
                                            Simpan Perubahan
                                        </button>
                                        {success && (
                                            <span className="text-success fw-semibold d-flex align-items-center gap-1">
                                                <i className="ri-checkbox-circle-line fs-5" /> Tersimpan!
                                            </span>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TahfizLayout>
    );
};

(TahfizSettingsPage as any).layout = null;

export default TahfizSettingsPage;
