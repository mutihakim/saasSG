import React from "react";
import { useTranslation } from "react-i18next";

type Props = {
    word: {
        id: number | string;
        bahasaIndonesia: string;
        bahasaInggris?: string | null;
        bahasaArab?: string | null;
        phonetic?: string | null;
        phoneticArabic?: string | null;
    };
    language: "english" | "arabic";
    translationDirection?: "id_to_target" | "target_to_id";
    isMastered?: boolean;
    onPronounce: (text: string, lang: string) => void;
    onFlip: () => void;
    isFlipped: boolean;
};

const FlashCard: React.FC<Props> = ({
    word,
    language,
    translationDirection = "id_to_target",
    isMastered = false,
    onPronounce,
    onFlip,
    isFlipped,
}) => {
    const { t } = useTranslation();
    const targetText = language === "english" ? word.bahasaInggris : word.bahasaArab;
    const phonetic = language === "english" ? word.phonetic : word.phoneticArabic;
    const frontText = translationDirection === "target_to_id" ? targetText : word.bahasaIndonesia;
    const backText = translationDirection === "target_to_id" ? word.bahasaIndonesia : targetText;
    const displayText = isFlipped ? backText : frontText;
    const langCode = translationDirection === "target_to_id"
        ? (isFlipped ? "id-ID" : (language === "english" ? "en-US" : "ar-SA"))
        : (isFlipped ? (language === "english" ? "en-US" : "ar-SA") : "id-ID");
    const textDirection = translationDirection === "target_to_id" && !isFlipped && language === "arabic"
        ? "rtl"
        : "ltr";

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
                        {t("tenant.games.vocabulary.session.mastered_badge")}
                    </span>
                )}
                <h3 className="fw-bold mb-2" dir={textDirection}>{displayText}</h3>
                {isFlipped && phonetic && (
                    <p className="text-muted small mb-1">{phonetic}</p>
                )}
                {!isFlipped && (
                    <p className="text-muted small">{t("tenant.games.vocabulary.session.tap_to_flip")}</p>
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
                    {t("tenant.games.vocabulary.session.listen")}
                </button>
            </div>
        </div>
    );
};

export default FlashCard;
