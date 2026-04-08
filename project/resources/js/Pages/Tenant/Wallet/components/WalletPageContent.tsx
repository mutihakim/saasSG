import React from "react";
import { Button } from "react-bootstrap";

import WalletBottomNav from "./pwa/WalletBottomNav";
import WalletTopbar from "./pwa/WalletTopbar";
import { WALLET_SURFACE_BG, WalletTab } from "./pwa/types";

type Props = {
    activeTab: WalletTab;
    setActiveTab: React.Dispatch<React.SetStateAction<WalletTab>>;
    title: string;
    entityLabel: string;
    searchOpen: boolean;
    searchValue: string;
    onToggleSearch: () => void;
    onSearchChange: (value: string) => void;
    permissionsCreate: boolean;
    canCreateAccount: boolean;
    canCreateWish: boolean;
    canCreateGoal: boolean;
    onFabClick: () => void;
    children: React.ReactNode;
};

const WalletPageContent = ({
    activeTab,
    setActiveTab,
    title,
    entityLabel,
    searchOpen,
    searchValue,
    onToggleSearch,
    onSearchChange,
    permissionsCreate,
    canCreateAccount,
    canCreateWish,
    canCreateGoal,
    onFabClick,
    children,
}: Props) => (
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
            />

            <div className="flex-grow-1 px-3 pt-3" style={{ paddingBottom: "calc(180px + env(safe-area-inset-bottom))" }}>
                {children}
            </div>

            {permissionsCreate && (
                <div className="position-fixed end-0 z-3" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", right: 20 }}>
                    <Button
                        className="rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center"
                        style={{ width: 58, height: 58 }}
                        disabled={
                            (activeTab === "accounts" && !canCreateAccount)
                            || (activeTab === "wishes" && !canCreateWish)
                            || (activeTab === "goals" && !canCreateGoal)
                        }
                        onClick={onFabClick}
                    >
                        <i className="ri-add-line fs-3" />
                    </Button>
                </div>
            )}

            <WalletBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>
    </div>
);

export default WalletPageContent;
