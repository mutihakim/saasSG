import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import '../../../../../scss/modules/games/tahfiz.scss';
import GameFeatureLayout, { type GameFeatureMenuItem, type GameFeatureMenuKey } from "../../shared/components/GameFeatureLayout";

type TahfizLayoutProps = {
    title: React.ReactNode;
    menuKey: GameFeatureMenuKey;
    memberName?: string;
    isSessionActive?: boolean;
    allowPageScroll?: boolean;
    onLeavingSession?: () => void;
    children: React.ReactNode;
};

const TahfizLayout: React.FC<TahfizLayoutProps> = ({
    title,
    menuKey,
    memberName,
    isSessionActive = false,
    allowPageScroll = false,
    onLeavingSession,
    children,
}) => {
    const { t } = useTranslation();

    const menuItems = useMemo<GameFeatureMenuItem[]>(() => [
        { key: "main", label: t("tenant.games.layout.menu.main"), href: "/games/tahfiz", icon: "ri-book-read-line" },
        { key: "history", label: t("tenant.games.layout.menu.history"), href: "/games/tahfiz/history", icon: "ri-history-line" },
        { key: "settings", label: t("tenant.games.layout.menu.settings"), href: "/games/tahfiz/settings", icon: "ri-settings-3-line" },
    ], [t]);

    return (
        <GameFeatureLayout
            title={title}
            menuKey={menuKey}
            menuItems={menuItems}
            memberName={memberName}
            isSessionActive={isSessionActive}
            allowPageScroll={allowPageScroll}
            onLeavingSession={onLeavingSession}
            featureClass="module-tahfiz-wrapper"
        >
            {children}
        </GameFeatureLayout>
    );
};

export default TahfizLayout;
