import React from "react";

type Props = {
    question: string;
    options: string[];
    selectedIndex: number | null;
    correctIndex: number | null;
    onSelect: (index: number) => void;
    disabled: boolean;
};

const QuizModal: React.FC<Props> = ({
    question,
    options,
    selectedIndex,
    correctIndex,
    onSelect,
    disabled,
}) => {
    return (
        <div className="quiz-section mt-3">
            <h6 className="fw-semibold mb-3">{question}</h6>
            <div className="d-grid gap-2">
                {options.map((opt, i) => {
                    let btnClass = "btn btn-outline-secondary text-start";
                    if (selectedIndex === i && correctIndex !== null) {
                        btnClass =
                            i === correctIndex
                                ? "btn btn-success text-start"
                                : "btn btn-danger text-start";
                    }
                    return (
                        <button
                            key={i}
                            type="button"
                            className={btnClass}
                            disabled={disabled}
                            onClick={() => onSelect(i)}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizModal;
