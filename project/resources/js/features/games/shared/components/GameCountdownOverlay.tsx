import React from "react";
import { useTranslation } from "react-i18next";

type CountdownState = "yellow" | "green" | null;

type GameCountdownOverlayProps = {
    countdownState: CountdownState;
    preparingLabelKey?: string;
    startLabelKey?: string;
};

const GameCountdownOverlay: React.FC<GameCountdownOverlayProps> = ({
    countdownState,
    preparingLabelKey = "tenant.games.shared.countdown.ready",
    startLabelKey = "tenant.games.shared.countdown.start",
}) => {
    const { t } = useTranslation();

    if (!countdownState) {
        return null;
    }

    const isPreparing = countdownState === "yellow";

    return (
        <div
            className="game-countdown-overlay position-absolute w-100 h-100 top-0 start-0 d-flex flex-column justify-content-center align-items-center rounded-3"
        >
            <div
                className={`game-countdown-overlay__bubble rounded-circle shadow-lg d-flex justify-content-center align-items-center ${isPreparing ? "bg-warning text-dark" : "bg-success text-white"}`}
            >
                <i className={`display-1 ${isPreparing ? "ri-timer-flash-line" : "ri-check-line"}`}></i>
            </div>
            <h3 className={`fw-bold mt-4 ${isPreparing ? "text-warning" : "text-success"}`}>
                {t(isPreparing ? preparingLabelKey : startLabelKey)}
            </h3>
        </div>
    );
};

export default GameCountdownOverlay;
