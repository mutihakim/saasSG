import React, { useEffect } from "react";
import { Card } from "react-bootstrap";

interface FeedbackPopupProps {
    show: boolean;
    isCorrect: boolean;
    message: string;
    correctAnswer?: number | null;
    onDone?: () => void;
    duration?: number;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({
    show,
    isCorrect,
    message,
    correctAnswer,
    onDone,
    duration = 2000,
}) => {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => onDone?.(), duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onDone]);

    if (!show) {
        return null;
    }

    return (
        <div
            className="math-game__feedback position-fixed top-50 start-50 translate-middle"
            style={{
                zIndex: 9999,
                minWidth: "280px",
                maxWidth: "400px",
            }}
        >
            <Card
                className={`math-game__feedback-card border-0 shadow-lg text-center ${
                    isCorrect
                        ? "bg-success text-white"
                        : "bg-warning text-dark"
                }`}
            >
                <Card.Body className="p-0">
                    <div className="math-game__feedback-icon mb-2">
                        {isCorrect ? "✓" : "✗"}
                    </div>
                    <h3 className="fw-bold mb-2">
                        {message}
                    </h3>
                    {!isCorrect && correctAnswer !== undefined && correctAnswer !== null && (
                        <div className="mt-2 fs-5">
                            <span className="opacity-75">Jawaban: </span>
                            <span className="fw-bold">{correctAnswer}</span>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default FeedbackPopup;
