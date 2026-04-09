import { Link } from "@inertiajs/react";
import React from "react";
import { useTranslation } from "react-i18next";

type FinanceModuleSection = "home" | "accounts" | "transactions" | "planning" | "reports";

type Props = {
    activeSection: FinanceModuleSection;
};

const FinanceModuleBottomNav = ({ activeSection }: Props) => {
    const { t } = useTranslation();

    const items: Array<{ key: FinanceModuleSection; href: string; icon: string; label: string }> = [
        { key: "home", href: "/finance/home", icon: "ri-home-5-line", label: t("layout.shell.nav.items.overview", { defaultValue: "Home" }) },
        { key: "accounts", href: "/finance/accounts", icon: "ri-bank-card-line", label: t("wallet.tabs.accounts", { defaultValue: "Wallets" }) },
        { key: "transactions", href: "/finance/transactions", icon: "ri-exchange-dollar-line", label: t("finance.pwa.tabs.transactions") },
        { key: "planning", href: "/finance/planning", icon: "ri-flag-2-line", label: "Planning" },
        { key: "reports", href: "/finance/reports", icon: "ri-file-chart-line", label: t("finance.reports.title", { defaultValue: "Reports" }) },
    ];

    return (
        <div className="position-fixed start-50 translate-middle-x z-3" style={{ bottom: "max(12px, env(safe-area-inset-bottom))", width: "min(100% - 24px, 430px)" }}>
            <div className="bg-white border rounded-pill shadow-sm px-2 py-2 d-flex justify-content-between align-items-center">
                {items.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`btn border-0 flex-fill px-1 ${activeSection === item.key ? "text-info" : "text-muted"}`}
                    >
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 0 }}>
                            <i className={`fs-5 ${item.icon}`} style={{ lineHeight: 1 }}></i>
                            <span className="small text-truncate" style={{ maxWidth: "100%", fontSize: 11 }}>{item.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default FinanceModuleBottomNav;
