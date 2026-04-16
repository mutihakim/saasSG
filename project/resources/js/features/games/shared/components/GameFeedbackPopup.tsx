import React, { useEffect } from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type GameFeedbackPopupProps = {
    show: boolean;
    isCorrect: boolean;
    isTimedOut?: boolean;
    message: string;
    correctAnswer?: number | string | null;
    correctAnswerLabel?: string;
    onDone?: () => void;
    duration?: number;
};

const GameFeedbackPopup: React.FC<GameFeedbackPopupProps> = ({
    show,
    isCorrect,
    isTimedOut = false,
    message,
    correctAnswer,
    correctAnswerLabel,
    onDone,
    duration = 1500,
}) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!show || duration <= 0) {
            return;
        }

        const timer = setTimeout(() => onDone?.(), duration);
        return () => clearTimeout(timer);
    }, [show, duration, onDone]);

    if (!show) {
        return null;
    }

    const variant = isCorrect ? "success" : (isTimedOut ? "danger" : "warning");
    const textColor = isCorrect || isTimedOut ? "white" : "dark";
    const icon = isCorrect ? "ri-checkbox-circle-fill" : (isTimedOut ? "ri-time-fill" : "ri-close-circle-fill");

    return (
        <div
            className="game-feedback-popup game-feedback-popup__container position-fixed top-50 start-50 translate-middle animate__animated animate__zoomIn"
        >
            <Card className={`game-feedback-popup__card border-0 shadow-lg text-center bg-${variant} text-${textColor}`}>
                <Card.Body className="p-4">
                    <div className="game-feedback-popup__icon mb-2 display-1 d-block">
                        <i className={icon}></i>
                    </div>
                    <h2 className={`fw-bold mb-2 text-${textColor}`}>
                        {isTimedOut ? t("tenant.games.shared.feedback.timeout") : message}
                    </h2>
                    {isTimedOut && <p className="lead mb-0 opacity-75">{message}</p>}
                    {!isCorrect && correctAnswer !== undefined && correctAnswer !== null && (
                        <div className="mt-3 p-2 rounded bg-white bg-opacity-25">
                            <span className="opacity-75 d-block small mb-1">
                                {correctAnswerLabel ?? t("tenant.games.feedback.correct_answer")}
                            </span>
                            <span className="fw-bold h4">{correctAnswer}</span>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default GameFeedbackPopup;
