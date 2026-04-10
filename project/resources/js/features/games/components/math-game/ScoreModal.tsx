import React from "react";

type Props = {
    score: number;
    total: number;
    streak: number;
    bestStreak: number;
    onRetry: () => void;
    onHome: () => void;
};

const ScoreModal: React.FC<Props> = ({
    score,
    total,
    streak,
    bestStreak,
    onRetry,
    onHome,
}) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title">Hasil Game</h5>
                    </div>
                    <div className="modal-body text-center py-4">
                        <div className="mb-3">
                            <span className="display-4 fw-bold">{percentage}%</span>
                        </div>
                        <p className="text-muted">
                            {score} benar dari {total} soal
                        </p>
                        <div className="row g-2 mt-3">
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fw-bold fs-5">{streak}</div>
                                    <small className="text-muted">Streak Saat Ini</small>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fw-bold fs-5">{bestStreak}</div>
                                    <small className="text-muted">Best Streak</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer border-0 justify-content-center">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onHome}
                        >
                            Kembali
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onRetry}
                        >
                            Main Lagi
                        </button>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </div>
    );
};

export default ScoreModal;
