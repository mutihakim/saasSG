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
    return (
        <div className="category-selector">
            <h6 className="fw-semibold mb-2">Pilih Kategori</h6>
            <div className="d-flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        type="button"
                        className={`btn btn-sm ${selected === cat.key ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => onSelect(cat.key)}
                    >
                        {cat.label}{" "}
                        <span className="badge bg-light text-dark">{cat.count}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySelector;
