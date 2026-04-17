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
            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <div className="tahfiz-settings__card card">
                        <div className="tahfiz-settings__header card-header">
                            <h2 className="tahfiz-settings__title">
                                <i className="ri-settings-3-line" /> {t("tenant.games.tahfiz.settings.section_default")}
                            </h2>
                        </div>
                        <div className="tahfiz-settings__body card-body">
                            {isLoading ? (
                                <div className="d-flex align-items-center gap-2">
                                    <div className="spinner-border spinner-border-sm" role="status" />
                                    <span>{t("tenant.games.tahfiz.settings.loading")}</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">{t("tenant.games.tahfiz.settings.reciter_label")}</label>
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
                                            <div className="form-text mt-2">{t("tenant.games.tahfiz.settings.reciter_help")}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">{t("tenant.games.tahfiz.settings.repeat_label")}</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="tahfiz-settings__control-btn btn btn-outline-secondary"
                                                    id="tahfiz-settings-repeat-minus"
                                                    onClick={() => void updateSettings({ repeat_count: Math.max(1, settings.repeat_count - 1) })}
                                                >
                                                    <i className="ri-subtract-line" />
                                                </button>
                                                <span className="tahfiz-settings__value-display">
                                                    {settings.repeat_count}x
                                                </span>
                                                <button
                                                    type="button"
                                                    className="tahfiz-settings__control-btn btn btn-outline-secondary"
                                                    id="tahfiz-settings-repeat-plus"
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
                                                    className="tahfiz-settings__switch form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    id="tahfiz-settings-auto-next"
                                                    checked={settings.auto_next}
                                                    onChange={(e) => void updateSettings({ auto_next: e.target.checked })}
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

                                    <div className="mt-5 d-flex align-items-center gap-3">
                                        <button
                                            id="tahfiz-settings-save"
                                            type="submit"
                                            className="tahfiz-settings__save-btn btn btn-primary btn-lg"
                                            disabled={saving}
                                        >
                                            {saving ? <div className="spinner-border spinner-border-sm" role="status" /> : <i className="ri-save-line fs-5" />}
                                            {t("tenant.games.tahfiz.settings.save_btn")}
                                        </button>
                                        {success && (
                                            <span className="text-success fw-semibold d-flex align-items-center gap-1">
                                                <i className="ri-checkbox-circle-line fs-5" /> {t("tenant.games.tahfiz.settings.save_success")}
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
