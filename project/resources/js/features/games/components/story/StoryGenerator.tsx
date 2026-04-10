import React, { useState } from "react";

import type { StoryTheme } from "../../types";

type Props = {
    themes: StoryTheme[];
    onGenerate: (themeId: string, source: "hadis" | "quran" | "fabel") => void;
    loading: boolean;
};

const StoryGenerator: React.FC<Props> = ({ themes, onGenerate, loading }) => {
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<
        "hadis" | "quran" | "fabel"
    >("hadis");

    const handleGenerate = () => {
        if (selectedTheme) {
            onGenerate(selectedTheme, selectedSource);
        }
    };

    return (
        <div className="story-generator p-3">
            <h6 className="fw-semibold mb-3">Buat Dongeng Baru</h6>

            <div className="mb-3">
                <label className="form-label small text-muted">Tema Akhlak</label>
                <select
                    className="form-select"
                    value={selectedTheme ?? ""}
                    onChange={(e) => setSelectedTheme(e.target.value || null)}
                >
                    <option value="">— Pilih Tema —</option>
                    {themes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small text-muted">Sumber Cerita</label>
                <div className="d-flex gap-2">
                    {(["hadis", "quran", "fabel"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`btn btn-sm ${selectedSource === s ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setSelectedSource(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                className="btn btn-primary w-100"
                disabled={!selectedTheme || loading}
                onClick={handleGenerate}
            >
                {loading ? (
                    <>
                        <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                        />
                        Membuat Cerita...
                    </>
                ) : (
                    "Generate Cerita"
                )}
            </button>
        </div>
    );
};

export default StoryGenerator;
