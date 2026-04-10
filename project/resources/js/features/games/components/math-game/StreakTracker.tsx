import React from "react";

type Props = {
    currentStreak: number;
    masteredCount: number;
};

const StreakTracker: React.FC<Props> = ({ currentStreak, masteredCount }) => {
    if (currentStreak === 0 && masteredCount === 0) return null;

    return (
        <div className="streak-tracker d-flex gap-3 justify-content-center py-2">
            {currentStreak > 0 && (
                <div className="d-flex align-items-center gap-1">
                    <i className="ri-fire-line text-warning"></i>
                    <span className="fw-semibold small">{currentStreak} streak</span>
                </div>
            )}
            {masteredCount > 0 && (
                <div className="d-flex align-items-center gap-1">
                    <i className="ri-medal-line text-success"></i>
                    <span className="fw-semibold small">{masteredCount} mastered</span>
                </div>
            )}
        </div>
    );
};

export default StreakTracker;
