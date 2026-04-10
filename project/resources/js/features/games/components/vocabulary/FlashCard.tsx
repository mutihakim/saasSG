import React from "react";

import type { VocabularyWord } from "../../types";

type Props = {
    word: VocabularyWord;
    language: "english" | "arabic";
    isMastered?: boolean;
    onPronounce: (text: string, lang: string) => void;
    onFlip: () => void;
    isFlipped: boolean;
};

const FlashCard: React.FC<Props> = ({
    word,
    language,
    isMastered = false,
    onPronounce,
    onFlip,
    isFlipped,
}) => {
    const displayText = isFlipped
        ? language === "english"
            ? word.bahasaInggris
            : word.bahasaArab
        : word.bahasaIndonesia;

    const langCode = language === "english" ? "en-US" : "ar-SA";

    return (
        <div
            className={`flash-card card border-0 shadow-sm ${isFlipped ? "flipped" : ""}`}
            role="button"
            tabIndex={0}
            onClick={onFlip}
            onKeyDown={(e) => {
                if (e.key === "Enter") onFlip();
            }}
        >
            <div className="card-body text-center p-4">
                {isMastered && (
                    <span className="badge bg-success-subtle text-success mb-2">
                        <i className="ri-check-double-line me-1"></i>
                        Mastered
                    </span>
                )}
                <h3 className="fw-bold mb-2">{displayText}</h3>
                {!isFlipped && (
                    <p className="text-muted small">Tap untuk melihat terjemahan</p>
                )}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (displayText) onPronounce(displayText, langCode);
                    }}
                >
                    <i className="ri-volume-up-line me-1"></i>
                    Dengarkan
                </button>
            </div>
        </div>
    );
};

export default FlashCard;
