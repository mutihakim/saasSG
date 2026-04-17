import React from "react";

import type { Surah } from "@/features/games/shared/types";

type Props = {
    surahs: Surah[];
    selected: string | null;
    onSelect: (id: string) => void;
};

const SurahSelector: React.FC<Props> = ({ surahs, selected, onSelect }) => {
    return (
        <div className="surah-selector">
            <h6 className="fw-semibold mb-2">Pilih Surah</h6>
            <div className="list-group">
                {[...surahs].sort((a, b) => b.number - a.number).map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected === s.id ? "active" : ""}`}
                        onClick={() => onSelect(s.id)}
                    >
                        <div>
                            <span className="fw-semibold">{s.name}</span>
                            <small className="text-muted d-block">
                                {s.ayatCount} ayat
                            </small>
                        </div>
                        <span className="badge bg-primary-subtle text-primary">
                            #{s.number}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SurahSelector;
