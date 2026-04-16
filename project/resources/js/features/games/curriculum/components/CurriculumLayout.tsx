import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import GameFeatureLayout, { type GameFeatureMenuItem } from "../../shared/components/GameFeatureLayout";

type Props = {
    title: string;
    menuKey: "main" | "history" | "settings";
    memberName?: string;
    allowPageScroll?: boolean;
    isSessionActive?: boolean;
    children: React.ReactNode;
};

const CurriculumLayout: React.FC<Props> = ({ title, menuKey, memberName, allowPageScroll = false, isSessionActive = false, children }) => {
    const { t } = useTranslation();

    const menuItems = useMemo<GameFeatureMenuItem[]>(() => [
        { key: "main", label: t("tenant.games.layout.menu.main"), href: "/games/curriculum", icon: "ri-book-open-line" },
        { key: "history", label: t("tenant.games.layout.menu.history"), href: "/games/curriculum/history", icon: "ri-history-line" },
        { key: "settings", label: t("tenant.games.layout.menu.settings"), href: "/games/curriculum/settings", icon: "ri-settings-3-line" },
    ], [t]);

    return (
        <GameFeatureLayout
            title={title}
            menuKey={menuKey}
            menuItems={menuItems}
            memberName={memberName}
            allowPageScroll={allowPageScroll}
            isSessionActive={isSessionActive}
            featureClass="vocab-theme"
        >
            {children}
        </GameFeatureLayout>
    );
};

export default CurriculumLayout;
