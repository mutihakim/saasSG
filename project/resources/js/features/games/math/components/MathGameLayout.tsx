import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import '../../../../../scss/modules/games/math.scss';
import GameFeatureLayout, { type GameFeatureMenuItem, type GameFeatureMenuKey } from "../../shared/components/GameFeatureLayout";

type MathGameLayoutProps = {
    title: string;
    menuKey: GameFeatureMenuKey;
    memberName?: string;
    isSessionActive?: boolean;
    allowPageScroll?: boolean;
    onLeavingSession?: () => void;
    children: React.ReactNode;
};

const MathGameLayout: React.FC<MathGameLayoutProps> = ({
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
        { key: "main", label: t("tenant.games.layout.menu.main"), href: "/games/math", icon: "ri-calculator-line" },
        { key: "mastered", label: t("tenant.games.layout.menu.mastered"), href: "/games/math/mastered", icon: "ri-trophy-line" },
        { key: "history", label: t("tenant.games.layout.menu.history"), href: "/games/math/history", icon: "ri-history-line" },
        { key: "settings", label: t("tenant.games.layout.menu.settings"), href: "/games/math/settings", icon: "ri-settings-3-line" },
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
            featureClass="module-math-wrapper"
        >
            {children}
        </GameFeatureLayout>
    );
};

export default MathGameLayout;
