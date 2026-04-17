import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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

const BackgroundPattern = () => {
    const [items] = useState(() => {
        const emojis = ["🕌", "📖", "🌙", "⭐", "📿"];
        return Array.from({ length: 20 }).map((_, i) => ({
            emoji: emojis[i % 5],
            rotation: Math.random() * 360,
        }));
    });

    return (
        <div className="vocab-bg-pattern" aria-hidden="true">
            {items.map((item: { emoji: string; rotation: number }, i: number) => (
                <div key={i} className={`vocab-bg-emoji vocab-bg-emoji--${Math.round(item.rotation) % 6}`}>
                    {item.emoji}
                </div>
            ))}
        </div>
    );
};

const TahfizLayout: React.FC<TahfizLayoutProps> = ({
    title,
    menuKey,
    memberName,
    isSessionActive = false,
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
            allowPageScroll={false}
            onLeavingSession={onLeavingSession}
            featureClass="tahfiz-theme"
        >
            <BackgroundPattern />
            {children}
        </GameFeatureLayout>
    );
};

export default TahfizLayout;
