import React from "react";

type Props = {
    question: string;
    userAnswer: string;
    isCorrect?: boolean | null;
    timeRemaining?: number;
};

const QuestionDisplay: React.FC<Props> = ({
    question,
    userAnswer,
    isCorrect,
    timeRemaining,
}) => {
    const feedbackColor =
        isCorrect === true
            ? "text-success"
            : isCorrect === false
              ? "text-danger"
              : "text-white";

    return (
        <div className="question-display text-center py-4">
            {timeRemaining !== undefined && (
                <div className="mb-2">
                    <span
                        className={`badge ${timeRemaining <= 5 ? "bg-danger" : "bg-secondary"}`}
                    >
                        {timeRemaining}s
                    </span>
                </div>
            )}
            <h2 className="display-6 fw-bold text-white mb-3">{question}</h2>
            <div
                className={`answer-box fs-3 fw-bold px-4 py-2 rounded d-inline-block ${feedbackColor}`}
                style={{
                    minWidth: 120,
                    background: "rgba(255,255,255,0.08)",
                    border: "2px solid rgba(255,255,255,0.15)",
                }}
            >
                {userAnswer || "?"}
            </div>
        </div>
    );
};

export default QuestionDisplay;
