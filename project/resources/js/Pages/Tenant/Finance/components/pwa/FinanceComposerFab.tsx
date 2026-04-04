import React from "react";
import { useTranslation } from "react-i18next";

import { TransactionType } from "./types";

interface FinanceComposerFabProps {
    showComposer: boolean;
    onToggle: () => void;
    onSelect: (type: TransactionType) => void;
}

const FinanceComposerFab = ({ showComposer, onToggle, onSelect }: FinanceComposerFabProps) => {
    const { t } = useTranslation();

    return (
        <div
            className="position-fixed start-50 translate-middle-x z-3"
            style={{ width: "min(100% - 24px, 420px)", bottom: "calc(env(safe-area-inset-bottom) + 94px)" }}
        >
            <div className="d-flex justify-content-end pe-1">
                <div className="position-relative">
                    {showComposer && (
                        <div className="position-absolute end-0 bottom-100 mb-3 d-flex flex-column gap-2" style={{ minWidth: 180 }}>
                            {([
                                { type: "pengeluaran", icon: "ri-arrow-right-up-line", label: t("finance.transactions.types.pengeluaran") },
                                { type: "pemasukan", icon: "ri-arrow-right-down-line", label: t("finance.transactions.types.pemasukan") },
                                { type: "transfer", icon: "ri-repeat-line", label: t("finance.transactions.types.transfer") },
                            ] as { type: TransactionType; icon: string; label: string }[]).map((item) => (
                                <button key={item.type} type="button" className="btn btn-light text-start rounded-pill shadow-sm px-3 py-2" onClick={() => onSelect(item.type)} data-testid={`finance-composer-option-${item.type}`}>
                                    <i className={`${item.icon} me-2`}></i>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        className="btn btn-danger rounded-circle border-0 shadow-lg d-inline-flex align-items-center justify-content-center"
                        style={{ width: 62, height: 62 }}
                        onClick={onToggle}
                        data-testid="finance-fab"
                    >
                        <i className={`fs-2 ${showComposer ? "ri-close-line" : "ri-add-line"}`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinanceComposerFab;
