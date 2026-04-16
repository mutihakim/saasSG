import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

export type LanguageFilterValue = "english" | "arabic" | "mandarin" | null;

type LanguageOption = {
    value: LanguageFilterValue;
    label: string;
    shortLabel: string;
    flag: string;
};

type Props = {
    selected: LanguageFilterValue;
    onChange: (value: LanguageFilterValue) => void;
    className?: string;
};

const FLAGS: Record<string, string> = {
    english: "https://flagcdn.com/w20/us.png",
    arabic: "https://flagcdn.com/w20/sa.png",
    mandarin: "https://flagcdn.com/w20/cn.png",
};

const LanguageFilterTabs: React.FC<Props> = ({
    selected,
    onChange,
    className = "",
}) => {
    const { t } = useTranslation();

    const languages: LanguageOption[] = [
        { value: "english", label: t("tenant.games.vocabulary.setup.language_en"), shortLabel: "EN", flag: FLAGS.english },
        { value: "arabic", label: t("tenant.games.vocabulary.setup.language_ar"), shortLabel: "AR", flag: FLAGS.arabic },
        { value: "mandarin", label: t("tenant.games.vocabulary.setup.language_zh"), shortLabel: "ZH", flag: FLAGS.mandarin },
    ];

    const handleClick = useCallback((value: LanguageFilterValue) => {
        if (selected === value) {
            onChange(null);
        } else {
            onChange(value);
        }
    }, [onChange, selected]);

    return (
        <div className={`vocab-lang-container ${className}`}>
            {languages.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    className={`vocab-lang-btn ${selected === item.value ? "active" : ""}`}
                    onClick={() => handleClick(item.value)}
                >
                    <img
                        src={item.flag}
                        srcSet={item.flag.replace("/w20/", "/w40/")}
                        width="20"
                        alt={item.label}
                        className="rounded-1"
                    />
                    <span className="d-none d-md-inline">{item.label}</span>
                    <span className="d-md-none">{item.shortLabel}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageFilterTabs;
