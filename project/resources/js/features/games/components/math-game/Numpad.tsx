import React from "react";

type Props = {
    onDigit: (digit: string) => void;
    onDelete: () => void;
    onEnter: () => void;
    disabled?: boolean;
};

const Numpad: React.FC<Props> = ({
    onDigit,
    onDelete,
    onEnter,
    disabled = false,
}) => {
    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    return (
        <div className="numpad d-grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 280, margin: "0 auto" }}>
            {digits.map((d) => (
                <button
                    key={d}
                    type="button"
                    className="btn btn-outline-secondary btn-lg numpad-btn"
                    disabled={disabled}
                    onClick={() => onDigit(d)}
                >
                    {d}
                </button>
            ))}
            <button
                type="button"
                className="btn btn-outline-warning btn-lg numpad-btn"
                disabled={disabled}
                onClick={onDelete}
            >
                <i className="ri-delete-back-line"></i>
            </button>
            <button
                type="button"
                className="btn btn-success btn-lg numpad-btn"
                disabled={disabled}
                onClick={onEnter}
            >
                <i className="ri-check-line"></i>
            </button>
            {/* spacer for 4th row */}
            <div />
        </div>
    );
};

export default Numpad;
