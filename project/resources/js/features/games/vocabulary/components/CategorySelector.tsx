import React from "react";


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
    const resolveCategoryTheme = (label: string): string => {
        const normalized = label.toLowerCase();
        if (normalized.includes("anggota tubuh")) return "bg-purple";
        if (normalized.includes("angka")) return "bg-teal";
        if (normalized.includes("rumah")) return "bg-yellow-dark";
        if (normalized.includes("bentuk")) return "bg-pink";
        if (normalized.includes("buah")) return "bg-green";
        if (normalized.includes("hewan darat")) return "bg-red";
        if (normalized.includes("hewan laut")) return "bg-purple"; // using purple to match mockup sort of
        if (normalized.includes("hewan udara")) return "bg-yellow-light";
        if (normalized.includes("kata kerja")) return "bg-blue-dark";
        if (normalized.includes("keluarga")) return "bg-yellow-dark";
        if (normalized.includes("kendaraan")) return "bg-pink";
        if (normalized.includes("pakaian")) return "bg-cyan-light";
        if (normalized.includes("sayur")) return "bg-cyan-dark";
        if (normalized.includes("warna")) return "bg-orange";

        const hashes = ["bg-purple", "bg-teal", "bg-yellow-dark", "bg-pink", "bg-green", "bg-red", "bg-blue", "bg-orange"];
        let hash = 0;
        for (let i = 0; i < label.length; i++) {
            hash = label.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hashes[Math.abs(hash) % hashes.length];
    };

    const resolveCategoryEmoji = (label: string): string => {
        const normalized = label.toLowerCase();
        if (normalized.includes("anggota tubuh")) return "🙋🏽‍♀️";
        if (normalized.includes("angka")) return "1️⃣2️⃣";
        if (normalized.includes("rumah")) return "🛋️";
        if (normalized.includes("bentuk")) return "🔵🔺";
        if (normalized.includes("buah")) return "🍎";
        if (normalized.includes("hewan darat")) return "🐕";
        if (normalized.includes("hewan laut")) return "🐙";
        if (normalized.includes("hewan udara")) return "✈️";
        if (normalized.includes("kata kerja")) return "🏃";
        if (normalized.includes("keluarga")) return "👨‍👩‍👧";
        if (normalized.includes("kendaraan")) return "🚗";
        if (normalized.includes("pakaian")) return "👕";
        if (normalized.includes("sayur")) return "🍅🥬";
        if (normalized.includes("warna")) return "🎨";
        return "📚";
    };

    return (
        <div className="category-selector">
            <div className="vocab-category-grid-v2">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        type="button"
                        className={`vocab-category-card-v2 ${resolveCategoryTheme(cat.label)} ${selected === cat.key ? "is-active" : ""}`}
                        onClick={() => onSelect(cat.key)}
                    >
                        {selected === cat.key && (
                            <span className="badge rounded-pill vocab-category-card-v2__check-badge" aria-hidden="true">
                                <i className="ri-check-line" />
                            </span>
                        )}
                        <div className="card-layout">
                            <div className="text-content d-flex align-items-center justify-content-start w-100 h-100 ps-2">
                                <h3 className="m-0 fw-bold text-dark w-100 vocab-category-card-v2__title">{cat.label}</h3>
                            </div>
                        </div>

                        <div className="progress-bar-wrapper">
                            <div className="progress-fill bg-white vocab-category-card-v2__progress-fill" />
                        </div>

                        <div className="sticker-emoji">
                            {resolveCategoryEmoji(cat.label)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySelector;
