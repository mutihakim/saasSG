import React from "react";

import FinanceModuleBottomNav from "../features/finance/components/pwa/FinanceModuleBottomNav";
import { SURFACE_BG } from "../features/finance/components/pwa/types";

export type FinanceShellProps = {
    children: React.ReactNode;
    activeSection: "home" | "accounts" | "planning" | "review" | "transactions" | "reports" | "budgets";
    planningView?: "budgets" | "goals" | "wishes";
    periodMonth?: string;
    topbar?: React.ReactNode;
    fab?: React.ReactNode;
};

const FinanceShellLayout = ({
    children,
    activeSection,
    planningView = "budgets",
    periodMonth,
    topbar,
    fab
}: FinanceShellProps) => {
    // Map section to bottom nav active state
    const bottomNavSection = (() => {
        if (activeSection === "review") return "home";
        if (activeSection === "budgets") return "planning";
        return activeSection;
    })() as any;

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
            <div className="position-relative d-flex flex-column" style={{ minHeight: "100vh", background: SURFACE_BG }}>
                {topbar}

                <div className="flex-grow-1 px-3 pt-3" style={{ paddingBottom: "calc(180px + env(safe-area-inset-bottom))" }}>
                    {children}
                </div>

                {fab}

                <FinanceModuleBottomNav
                    activeSection={bottomNavSection}
                    planningView={planningView}
                    periodMonth={periodMonth}
                />
            </div>
        </div>
    );
};

export default FinanceShellLayout;
