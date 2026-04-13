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
            className={`ayat-char ${highlighted ? "highlighted" : ""}`}
            style={{
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                transition: "background-color 0.2s ease",
                backgroundColor: highlighted ? "rgba(56, 189, 248, 0.2)" : "transparent",
            }}
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
