import { Link } from "@inertiajs/react";
import React from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import FinanceModuleBottomNav from "../../Finance/components/pwa/FinanceModuleBottomNav";
import WalletTopbar from "./pwa/WalletTopbar";
import { WALLET_SURFACE_BG, WalletTab } from "./pwa/types";

type Props = {
    activeSection: "home" | "accounts" | "planning" | "review";
    activeTab: WalletTab;
    title: string;
    entityLabel: string;
    planningHref?: string | null;
    planningMonth?: string | null;
    searchOpen: boolean;
    searchValue: string;
    onToggleSearch: () => void;
    onSearchChange: (value: string) => void;
    periodLabel?: string | null;
    onPrevMonth?: (() => void) | null;
    onNextMonth?: (() => void) | null;
    showFab: boolean;
    canCreateAccount: boolean;
    canCreateBudget: boolean;
    canCreateWish: boolean;
    canCreateGoal: boolean;
    onFabClick: () => void;
    children: React.ReactNode;
};

const WalletPageContent = ({
    activeSection,
    activeTab,
    title,
    entityLabel,
    planningHref,
    planningMonth,
    searchOpen,
    searchValue,
    onToggleSearch,
    onSearchChange,
    periodLabel,
    onPrevMonth,
    onNextMonth,
    showFab,
    canCreateAccount,
    canCreateBudget,
    canCreateWish,
    canCreateGoal,
    onFabClick,
    children,
}: Props) => {
    const { t } = useTranslation();

    return (
        <div style={{ minHeight: "100vh" }}>
            <style>
                {`
                .wallet-account-card {
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                }

                .wallet-account-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08) !important;
                    border-color: rgba(14, 165, 233, 0.16) !important;
                }

                .wallet-account-pressable,
                .wallet-expand-trigger,
                .wallet-row-button {
                    transition: background-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
                }

                .wallet-account-pressable:hover {
                    background: rgba(248, 250, 252, 0.92);
                }

                .wallet-account-pressable:active,
                .wallet-row-button:active {
                    transform: scale(0.995);
                }

                .wallet-expand-trigger {
                    border-radius: 999px;
                }

                .wallet-expand-trigger:hover {
                    background: rgba(14, 165, 233, 0.06) !important;
                }

                .wallet-row-button:hover {
                    background: linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(255, 255, 255, 0.98)) !important;
                }
            `}
            </style>
            <div className="position-relative d-flex flex-column" style={{ minHeight: "100vh", background: WALLET_SURFACE_BG }}>
                <WalletTopbar
                    title={title}
                    entityLabel={entityLabel}
                    searchOpen={searchOpen}
                    searchValue={searchValue}
                    onToggleSearch={onToggleSearch}
                    onSearchChange={onSearchChange}
                    periodLabel={periodLabel}
                    onPrevMonth={onPrevMonth}
                    onNextMonth={onNextMonth}
                />

                <div className="flex-grow-1 px-3 pt-3" style={{ paddingBottom: "calc(180px + env(safe-area-inset-bottom))" }}>
                    {activeSection === "planning" && planningHref ? (
                        <div className="d-flex gap-2 mb-3">
                            <Link
                                href={`${planningHref}?view=budgets${planningMonth ? `&period_month=${planningMonth}` : ""}`}
                                className={`btn flex-fill rounded-pill ${activeTab === "budgets" ? "btn-info text-white" : "btn-light"}`}
                            >
                                {t("wallet.tabs.budgets")}
                            </Link>
                            <Link
                                href={`${planningHref}?view=goals`}
                                className={`btn flex-fill rounded-pill ${activeTab === "goals" ? "btn-info text-white" : "btn-light"}`}
                            >
                                {t("wallet.tabs.goals")}
                            </Link>
                            <Link
                                href={`${planningHref}?view=wishes`}
                                className={`btn flex-fill rounded-pill ${activeTab === "wishes" ? "btn-info text-white" : "btn-light"}`}
                            >
                                {t("wallet.tabs.wishes")}
                            </Link>
                        </div>
                    ) : null}
                    {children}
                </div>

                {showFab && (
                    <div className="position-fixed end-0 z-3" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", right: 20 }}>
                        <Button
                            className="rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center"
                            style={{ width: 58, height: 58 }}
                            disabled={
                                (activeTab === "accounts" && !canCreateAccount)
                                || (activeTab === "budgets" && !canCreateBudget)
                                || (activeTab === "wishes" && !canCreateWish)
                                || (activeTab === "goals" && !canCreateGoal)
                            }
                            onClick={onFabClick}
                        >
                            <i className="ri-add-line fs-3" />
                        </Button>
                    </div>
                )}

                <FinanceModuleBottomNav activeSection={activeSection === "review" ? "home" : activeSection} />
            </div>
        </div>
    );
};

export default WalletPageContent;
