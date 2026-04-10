import React from "react";
import { useTranslation } from "react-i18next";

import { FinancePlanningTab } from "./types";

type Props = {
    activeTab: FinancePlanningTab;
    onChangeTab: (tab: FinancePlanningTab) => void;
};

const FinancePlanningBottomNav = ({ activeTab, onChangeTab }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="position-fixed start-50 translate-middle-x z-3" style={{ bottom: "max(12px, env(safe-area-inset-bottom))", width: "min(100% - 24px, 430px)" }}>
            <div className="bg-white border rounded-pill shadow-sm px-2 py-2 d-flex justify-content-between align-items-center">
                {[
                    { key: "dashboard", icon: "ri-home-5-line", label: t("wallet.tabs.dashboard") },
                    { key: "accounts", icon: "ri-bank-card-line", label: t("wallet.tabs.accounts") },
                    { key: "wishes", icon: "ri-heart-3-line", label: t("wallet.tabs.wishes") },
                    { key: "goals", icon: "ri-flag-2-line", label: t("wallet.tabs.goals") },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`btn border-0 flex-fill px-1 ${activeTab === item.key ? "text-info" : "text-muted"}`}
                        onClick={() => onChangeTab(item.key as FinancePlanningTab)}
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

export default FinancePlanningBottomNav;
