import { router, usePage } from "@inertiajs/react";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { ExitConfirmModal } from "@/components/pwa";
import useExitConfirm from "@/core/hooks/useExitConfirm";
import { SharedPageProps } from "@/types/page";

export type GameFeatureMenuKey = "main" | "mastered" | "history" | "settings";

export type GameFeatureMenuItem = {
    key: GameFeatureMenuKey;
    label: string;
    href: string;
    icon: string;
};

type GameFeatureLayoutProps = {
    title: string;
    menuKey: GameFeatureMenuKey;
    menuItems: GameFeatureMenuItem[];
    memberName?: string;
    isSessionActive?: boolean;
    allowPageScroll?: boolean;
    onLeavingSession?: () => void;
    children: React.ReactNode;
};

const nameInitials = (name: string) => (
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
);

const GameFeatureLayout: React.FC<GameFeatureLayoutProps> = ({
    title,
    menuKey,
    menuItems,
    memberName,
    isSessionActive = false,
    allowPageScroll = false,
    onLeavingSession,
    children,
}) => {
    const { t } = useTranslation();
    const { props } = usePage<SharedPageProps>();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { requestExit } = useExitConfirm({ eventName: "games:request-exit" });

    const loginName = useMemo(() => {
        const authName = String(props.auth?.user?.name || "").trim();
        if (authName) {
            return authName;
        }

        const fallback = String(memberName || "").trim();
        return fallback || t("tenant.games.layout.member_fallback");
    }, [memberName, props.auth?.user?.name, t]);

    useEffect(() => {
        if (allowPageScroll) {
            return;
        }

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.classList.add("math-game-layout-active");

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
            document.body.classList.remove("math-game-layout-active");
        };
    }, [allowPageScroll]);

    const navigateWithGuard = (href: string) => {
        const go = () => {
            onLeavingSession?.();
            router.visit(href);
        };

        if (isSessionActive) {
            requestExit(go);
            return;
        }

        go();
    };

    return (
        <div className={`math-game-layout${allowPageScroll ? " math-game-layout--page-scroll" : ""}`}>
            <header className="math-game-layout__topbar">
                <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => navigateWithGuard("/games")}
                >
                    <i className="ri-arrow-left-line me-1" />
                    {t("tenant.games.layout.back")}
                </button>

                <div className="math-game-layout__title">{title}</div>

                <Dropdown
                    show={isDropdownOpen}
                    onToggle={(nextShow) => setIsDropdownOpen(nextShow)}
                    className="header-item topbar-user math-game-layout__user-dropdown"
                >
                    <Dropdown.Toggle as="button" type="button" className="btn arrow-none">
                        <span className="d-flex align-items-center">
                            <span className="avatar-xs rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fw-semibold">
                                {nameInitials(loginName)}
                            </span>
                            <span className="text-start ms-2 d-none d-md-inline-block">
                                <span className="fw-medium user-name-text">{loginName}</span>
                            </span>
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu-end">
                        {menuItems.map((item) => (
                            <Dropdown.Item
                                as="button"
                                key={item.key}
                                type="button"
                                onClick={() => navigateWithGuard(item.href)}
                                className={menuKey === item.key ? "active" : ""}
                            >
                                <i className={`${item.icon} text-muted fs-16 align-middle me-1`} />
                                <span className="align-middle">{item.label}</span>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </header>

            <main className="math-game-layout__content">
                {children}
            </main>

            {isSessionActive && (
                <ExitConfirmModal
                    eventName="games:request-exit"
                    title={t("tenant.games.layout.exit.title")}
                    message={t("tenant.games.layout.exit.message")}
                    continueLabel={t("tenant.games.layout.exit.continue")}
                    exitLabel={t("tenant.games.layout.exit.leave")}
                />
            )}
        </div>
    );
};

export default GameFeatureLayout;
