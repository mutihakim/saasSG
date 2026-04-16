import React from "react";
import { useTranslation } from "react-i18next";

import type { CurriculumUnit } from "../types";

type Props = {
    units: CurriculumUnit[];
    selectedUnitId: number | null;
    questionCount: number;
    timeLimit: number;
    isLoading: boolean;
    isStartingSession: boolean;
    onUnitChange: (unitId: number | null) => void;
    onStart: () => void;
};

const CurriculumSetupScreen: React.FC<Props> = ({
    units,
    selectedUnitId,
    questionCount,
    timeLimit,
    isLoading,
    isStartingSession,
    onUnitChange,
    onStart,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="vocab-setup-card d-flex flex-column h-100">
                <div className="vocab-setup-content vocab-inner-content pb-5">
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                        <div>
                            <h3 className="fw-bold mb-1">{t("tenant.games.curriculum.setup.title")}</h3>
                            <p className="text-muted mb-0">{t("tenant.games.curriculum.setup.subtitle")}</p>
                        </div>
                        <span className="badge bg-info-subtle text-info rounded-pill">
                            {units.length} {t("tenant.games.curriculum.setup.units_badge")}
                        </span>
                    </div>

                    <div className="mb-3">
                        <label className="d-block text-sm text-gray-600 mb-1 font-medium small fw-semibold text-muted">{t("tenant.games.curriculum.setup.unit")}</label>
                        <div className="vocab-day-container">
                            <button type="button" className="vocab-day-arrow" onClick={() => document.getElementById("curriculum-unit-scroll")?.scrollBy({ left: -180, behavior: "smooth" })}>
                                <i className="ri-arrow-left-s-line fs-5" />
                            </button>
                            <div className="vocab-day-scroll" id="curriculum-unit-scroll">
                                {isLoading && <div className="text-muted small py-1">{t("tenant.games.curriculum.loading")}</div>}
                                {!isLoading && units.length === 0 && <div className="text-muted small py-1">{t("tenant.games.curriculum.empty")}</div>}
                                {units.map((unit) => (
                                    <button
                                        key={unit.id}
                                        type="button"
                                        className={`vocab-day-btn ${selectedUnitId === unit.id ? "active" : ""}`}
                                        onClick={() => onUnitChange(unit.id)}
                                    >
                                        {[unit.subject, unit.grade ? `${t("tenant.games.curriculum.setup.grade")} ${unit.grade}` : null, unit.chapter].filter(Boolean).join(" • ")}
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="vocab-day-arrow" onClick={() => document.getElementById("curriculum-unit-scroll")?.scrollBy({ left: 180, behavior: "smooth" })}>
                                <i className="ri-arrow-right-s-line fs-5" />
                            </button>
                        </div>
                    </div>

                    <div className="vocab-bottom-controls-v2 mt-3 pt-3 border-top pb-5 mb-5 pb-md-0 mb-md-0">
                        <div className="vocab-bottom-meta d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-pill small flex-nowrap text-nowrap">
                            <span className="text-muted d-flex align-items-center gap-1">
                                <i className="ri-file-list-3-line text-success" />
                                <span className="vocab-bottom-meta__value">{t("tenant.games.curriculum.setup.question_count_value", { count: questionCount })}</span>
                            </span>
                            <span className="text-muted">|</span>
                            <span className="text-muted d-flex align-items-center gap-1">
                                <i className="ri-timer-line text-success" />
                                <span className="vocab-bottom-meta__value">{t("tenant.games.curriculum.setup.time_limit_value", { seconds: timeLimit })}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="vocab-start-floating position-fixed bottom-0 start-0 w-100 p-3 p-sm-4 p-md-5 d-flex justify-content-center">
                <div className="w-100 vocab-start-floating__inner">
                    <button
                        type="button"
                        className="btn vocab-start-pwa-btn m-0 w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={onStart}
                        disabled={isStartingSession || isLoading || units.length === 0 || !selectedUnitId}
                    >
                        {isStartingSession ? t("tenant.games.curriculum.setup.starting") : t("tenant.games.curriculum.setup.start")}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CurriculumSetupScreen;
