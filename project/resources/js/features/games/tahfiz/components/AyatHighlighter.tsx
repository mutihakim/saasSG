import React from "react";

type Props = {
    text: string;
    highlighted: boolean;
    onClick: () => void;
};

const AyatHighlighter: React.FC<Props> = ({ text, highlighted, onClick }) => {
    return (
        <span
            role="button"
            tabIndex={0}
            className={`ayat-char game-ayat-char ${highlighted ? "highlighted game-ayat-char--highlighted" : ""}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter") onClick();
            }}
        >
            {text}
        </span>
    );
};

export default AyatHighlighter;
