import React from "react";
import { useTranslation } from "react-i18next";

type CategoryItem = {
    key: string;
    label: string;
    count: number;
};

type Props = {
    categories: CategoryItem[];
    selected: string | null;
    onSelect: (key: string) => void;
};

const CategorySelector: React.FC<Props> = ({
    categories,
    selected,
    onSelect,
}) => {
    const { t } = useTranslation();

    const resolveCategoryIcon = (label: string): string => {
        const normalized = label.toLowerCase();
        if (normalized.includes("hewan")) return "ri-bear-smile-line";
        if (normalized.includes("buah")) return "ri-apple-line";
        if (normalized.includes("sayur")) return "ri-leaf-line";
        if (normalized.includes("anggota tubuh")) return "ri-heart-pulse-line";
        if (normalized.includes("keluarga")) return "ri-team-line";
        if (normalized.includes("pakaian")) return "ri-t-shirt-line";
        if (normalized.includes("rumah")) return "ri-home-4-line";
        if (normalized.includes("kata kerja")) return "ri-run-line";
        if (normalized.includes("warna")) return "ri-palette-line";
        if (normalized.includes("bentuk")) return "ri-shapes-line";
        if (normalized.includes("angka")) return "ri-hashtag";
        if (normalized.includes("kendaraan")) return "ri-car-line";
        return "ri-book-open-line";
    };

    return (
        <div className="category-selector">
            <h6 className="fw-semibold mb-2">{t("tenant.games.vocabulary.category.title")}</h6>
            {categories.length === 0 && (
                <div className="small text-muted">
                    {t("tenant.games.vocabulary.category.empty")}
                </div>
            )}
            <div className="vocab-category-grid">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        type="button"
                        className={`vocab-category-card ${selected === cat.key ? "is-active" : ""}`}
                        onClick={() => onSelect(cat.key)}
                    >
                        <span className="vocab-category-card__icon-wrap" aria-hidden="true">
                            <i className={`${resolveCategoryIcon(cat.label)} vocab-category-card__icon`} />
                        </span>
                        <span className="vocab-category-card__content">
                            <span className="vocab-category-card__label">{cat.label}</span>
                            <span className="vocab-category-card__meta">
                                <span className="vocab-category-chip">
                                    <i className="ri-calendar-line" />
                                    {t("tenant.games.vocabulary.category.day_count", { count: cat.count })}
                                </span>
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySelector;
