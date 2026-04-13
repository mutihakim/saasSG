import React from "react";
import { ProgressBar } from "react-bootstrap";

type GameTimerProgressProps = {
    timeRemaining: number;
    timeLimit: number;
    warningThreshold?: number;
    dangerThreshold?: number;
    className?: string;
    style?: React.CSSProperties;
};

const GameTimerProgress: React.FC<GameTimerProgressProps> = ({
    timeRemaining,
    timeLimit,
    warningThreshold = 5,
    dangerThreshold = 3,
    className = "mb-3",
    style = { height: 8 },
}) => {
    // Hitung persentase sisa waktu
    const progress = timeLimit > 0 
        ? Math.max(0, Math.min(100, Math.round((timeRemaining / timeLimit) * 100))) 
        : 0;

    // Tentukan warna berdasarkan sisa detik
    let variant: "info" | "warning" | "danger" = "info";
    if (timeRemaining <= dangerThreshold) {
        variant = "danger";
    } else if (timeRemaining <= warningThreshold) {
        variant = "warning";
    }

    return (
        <ProgressBar
            now={progress}
            variant={variant}
            className={className}
            style={style}
            animated={variant === "danger"} // Animasi kedip saat kritis
        />
    );
};

export default GameTimerProgress;
