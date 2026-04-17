import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
            title={t("tenant.games.tahfiz.settings.page_title")}
            menuKey="settings"
            allowPageScroll
        >
            <div className="game-setup-card h-100">
                <div className="game-setup-content game-setup-inner-content">
                    <h5 className="fw-bold mb-4">
                        <i className="ri-settings-3-line me-2" /> 
                        {t("tenant.games.tahfiz.settings.section_default")}
                    </h5>

                    {isLoading ? (
                        <div className="d-flex align-items-center gap-2 py-4 justify-content-center text-muted">
                            <div className="spinner-border spinner-border-sm" role="status" />
                            <span>{t("tenant.games.tahfiz.settings.loading")}</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="pb-5">
                            <div className="row g-4">
                                <div className="col-12 col-md-6">
                                    <label className="game-setup-label mb-2">
                                        {t("tenant.games.tahfiz.settings.reciter_label")}
                                    </label>
                                    <select
                                        id="tahfiz-settings-reciter"
                                        className="form-select form-select-lg border-secondary-subtle rounded-4"
                                        value={settings.default_reciter}
                                        onChange={(e) => void updateSettings({ default_reciter: e.target.value })}
                                    >
                                        {RECITERS.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                    <div className="form-text mt-2">{t("tenant.games.tahfiz.settings.reciter_help")}</div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="game-setup-label mb-2">
                                        {t("tenant.games.tahfiz.settings.repeat_label")}
                                    </label>
                                    <div className="d-flex align-items-center gap-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-circle"
                                            style={{ width: '42px', height: '42px', padding: 0 }}
                                            onClick={() => void updateSettings({ repeat_count: Math.max(1, settings.repeat_count - 1) })}
                                        >
                                            <i className="ri-subtract-line" />
                                        </button>
                                        <span className="fs-4 fw-bold" style={{ minWidth: '40px', textAlign: 'center' }}>
                                            {settings.repeat_count}x
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-circle"
                                            style={{ width: '42px', height: '42px', padding: 0 }}
                                            onClick={() => void updateSettings({ repeat_count: Math.min(10, settings.repeat_count + 1) })}
                                        >
                                            <i className="ri-add-line" />
                                        </button>
                                    </div>
                                    <div className="form-text mt-2">{t("tenant.games.tahfiz.settings.repeat_help")}</div>
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
                                            checked={settings.auto_next}
                                            onChange={(e) => void updateSettings({ auto_next: e.target.checked })}
                                            style={{ width: '40px', height: '20px' }}
                                        />
                                        <label className="form-check-label fw-semibold ms-2" htmlFor="tahfiz-settings-auto-next">
                                            {t("tenant.games.tahfiz.settings.auto_next_label")}
                                        </label>
                                    </div>
                                    <p className="text-muted small ms-5">
                                        {t("tenant.games.tahfiz.settings.auto_next_help")}
                                    </p>
                                </div>
                            </div>

                            <div className="game-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 d-flex justify-content-center">
                                <div className="w-100 game-start-floating__inner">
                                    <button
                                        type="submit"
                                        className="btn game-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                                        disabled={saving}
                                    >
                                        {saving ? <div className="spinner-border spinner-border-sm" role="status" /> : <i className="ri-save-line fs-5" />}
                                        {t("tenant.games.tahfiz.settings.save_btn")}
                                    </button>
                                    {success && (
                                        <div className="text-center mt-2 text-white fw-bold">
                                            <i className="ri-checkbox-circle-line me-1" /> {t("tenant.games.tahfiz.settings.save_success")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </TahfizLayout>
    );
};

(TahfizSettingsPage as any).layout = null;

export default TahfizSettingsPage;
