import React from "react";
import { useTranslation } from "react-i18next";

import { MainTab } from "./types";

interface FinanceBottomNavProps {
    activeTab: MainTab;
    onChangeTab: (tab: MainTab) => void;
}

const FinanceBottomNav = ({ activeTab, onChangeTab }: FinanceBottomNavProps) => {
    const { t } = useTranslation();

    return (
        <div className="position-fixed start-50 translate-middle-x z-3" style={{ bottom: "max(12px, env(safe-area-inset-bottom))", width: "min(100% - 24px, 420px)" }}>
            <div className="bg-white border rounded-pill shadow-sm px-2 py-2 d-flex justify-content-between align-items-center">
                {[
                    { key: "transactions", icon: "ri-exchange-dollar-line", label: t("finance.pwa.tabs.transactions") },
                    { key: "stats", icon: "ri-bar-chart-box-line", label: t("finance.pwa.tabs.stats") },
                    { key: "accounts", icon: "ri-bank-card-line", label: t("finance.pwa.tabs.accounts") },
                    { key: "more", icon: "ri-more-2-line", label: t("finance.pwa.tabs.more") },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`btn border-0 flex-fill px-1 ${activeTab === item.key ? "text-info" : "text-muted"}`}
                        onClick={() => onChangeTab(item.key as MainTab)}
                    >
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 0 }}>
                            <i className={`fs-5 ${item.icon}`} style={{ lineHeight: 1 }}></i>
                            <span className="small text-truncate" style={{ maxWidth: "100%", fontSize: 11 }}>{item.label}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FinanceBottomNav;
