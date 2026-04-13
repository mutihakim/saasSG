import React from "react";

type Props = {
    question: string;
    options: string[];
    selectedIndex: number | null;
    correctIndex: number | null;
    onSelect: (index: number) => void;
    disabled: boolean;
    direction?: "ltr" | "rtl";
    className?: string;
};

const QuizModal: React.FC<Props> = ({
    question,
    options,
    selectedIndex,
    correctIndex,
    onSelect,
    disabled,
    direction = "ltr",
    className,
}) => {
    return (
        <div className={`quiz-section${className ? ` ${className}` : ""}`}>
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
                            onClick={(e) => {
                                e.currentTarget.blur();
                                onSelect(i);
                            }}
                            dir={direction}
                            style={{ textAlign: direction === "rtl" ? "right" : "left", touchAction: "manipulation" }}
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
