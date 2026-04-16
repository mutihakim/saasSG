import React from "react";

type Props = {
    isPlaying: boolean;
    currentAyat: number;
    totalAyat: number;
    speed: number;
    repeatCount: number;
    onPlayPause: () => void;
    onSpeedChange: (speed: number) => void;
    onRepeatChange: (count: number) => void;
    onAyatChange: (ayat: number) => void;
};

const AudioPlayer: React.FC<Props> = ({
    isPlaying,
    currentAyat,
    totalAyat,
    speed,
    repeatCount,
    onPlayPause,
    onSpeedChange,
    onRepeatChange,
    onAyatChange,
}) => {
    return (
        <div className="audio-player-controls p-3">
            {/* Progress */}
            <div className="mb-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Ayat {currentAyat}</span>
                    <span>dari {totalAyat}</span>
                </div>
                <input
                    type="range"
                    className="form-range"
                    min={1}
                    max={totalAyat}
                    value={currentAyat}
                    onChange={(e) => onAyatChange(parseInt(e.target.value))}
                />
            </div>

            {/* Play/Pause */}
            <div className="d-flex justify-content-center mb-3">
                <button
                    type="button"
                    className="btn btn-primary btn-lg rounded-circle game-audio-player__button"
                    onClick={onPlayPause}
                >
                    <i
                        className={`ri-${isPlaying ? "pause-line" : "play-line"} fs-4`}
                    ></i>
                </button>
            </div>

            {/* Speed & Repeat */}
            <div className="d-flex gap-3 justify-content-center">
                <div className="text-center">
                    <small className="text-muted d-block">Kecepatan</small>
                    <select
                        className="form-select form-select-sm"
                        value={speed}
                        onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    >
                        {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
                            <option key={s} value={s}>
                                {s}x
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-center">
                    <small className="text-muted d-block">Ulangi</small>
                    <select
                        className="form-select form-select-sm"
                        value={repeatCount}
                        onChange={(e) => onRepeatChange(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                                {n}x
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
