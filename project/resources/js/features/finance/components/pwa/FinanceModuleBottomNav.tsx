import { Link } from "@inertiajs/react";
import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type FinanceModuleSection = "home" | "accounts" | "transactions" | "planning" | "reports";
type PlanningView = "budgets" | "goals" | "wishes";

type Props = {
    activeSection: FinanceModuleSection;
    planningView?: PlanningView;
    periodMonth?: string;
};

const FinanceModuleBottomNav = ({ activeSection, planningView = "budgets", periodMonth }: Props) => {
    const { t } = useTranslation();
    const [showPlanningDropdown, setShowPlanningDropdown] = useState(false);

    const items: Array<{ key: FinanceModuleSection; href: string; icon: string; label: string }> = [
        { key: "home", href: "/finance", icon: "ri-home-5-line", label: t("layout.shell.nav.items.overview", { defaultValue: "Home" }) },
        { key: "accounts", href: "/finance/accounts", icon: "ri-bank-card-line", label: t("wallet.tabs.accounts", { defaultValue: "Wallets" }) },
        { key: "transactions", href: "/finance/transactions", icon: "ri-exchange-dollar-line", label: t("finance.pwa.tabs.transactions") },
        { key: "planning", href: "/finance/planning", icon: "ri-flag-2-line", label: "Planning" },
        { key: "reports", href: "/finance/reports", icon: "ri-file-chart-line", label: t("finance.reports.title", { defaultValue: "Reports" }) },
    ];

    const planningItems: Array<{ view: PlanningView; icon: string; label: string; description: string }> = [
        { view: "budgets", icon: "ri-pie-chart-line", label: t("wallet.tabs.budgets"), description: "Kelola alokasi budget bulanan" },
        { view: "goals", icon: "ri-target-line", label: t("wallet.tabs.goals"), description: "Pantau target tabungan Anda" },
        { view: "wishes", icon: "ri-heart-line", label: t("wallet.tabs.wishes"), description: "Kelola daftar keinginan Anda" },
    ];

    return (
        <div className="position-fixed start-50 translate-middle-x z-3" style={{ bottom: "max(12px, env(safe-area-inset-bottom))", width: "min(100% - 24px, 430px)" }}>
            <div className="bg-white border rounded-pill shadow-sm px-2 py-2 d-flex justify-content-between align-items-center">
                {items.map((item) => {
                    if (item.key === "planning") {
                        return (
                            <Dropdown
                                key={item.key}
                                show={showPlanningDropdown}
                                onToggle={(isOpen) => setShowPlanningDropdown(isOpen)}
                            >
                                <Dropdown.Toggle
                                    variant="link"
                                    className={`btn border-0 flex-fill px-1 text-decoration-none ${activeSection === item.key ? "text-info" : "text-muted"}`}
                                    as="button"
                                    id="planning-nav-dropdown"
                                >
                                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 0 }}>
                                        <i className={`fs-5 ${item.icon}`} style={{ lineHeight: 1 }}></i>
                                        <span className="small text-truncate" style={{ maxWidth: "100%", fontSize: 11 }}>{item.label}</span>
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-up rounded-3 shadow-lg border-0" style={{ minWidth: 260, marginBottom: 8 }}>
                                    <div className="px-3 py-2 border-bottom bg-light">
                                        <small className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Menu Planning</small>
                                    </div>
                                    {planningItems.map((pItem) => {
                                        const isActive = activeSection === "planning" && planningView === pItem.view;
                                        return (
                                            <Dropdown.Item
                                                key={pItem.view}
                                                as={Link}
                                                href={`/finance/planning?view=${pItem.view}${periodMonth ? `&period_month=${periodMonth}` : ""}`}
                                                active={isActive}
                                                className="d-flex align-items-center gap-3 py-2 px-3"
                                                onClick={() => setShowPlanningDropdown(false)}
                                            >
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle" style={{ width: 36, height: 36, flexShrink: 0 }}>
                                                    <i className={`${pItem.icon} text-primary fs-5`}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold mb-0">{pItem.label}</div>
                                                    <small className="text-muted">{pItem.description}</small>
                                                </div>
                                            </Dropdown.Item>
                                        );
                                    })}
                                </Dropdown.Menu>
                            </Dropdown>
                        );
                    }

                    return (
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
                    );
                })}
            </div>
        </div>
    );
};

export default FinanceModuleBottomNav;
