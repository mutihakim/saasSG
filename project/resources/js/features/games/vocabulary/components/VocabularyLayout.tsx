import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import '../../../../../scss/modules/games/vocabulary.scss';
import GameFeatureLayout, { type GameFeatureMenuItem, type GameFeatureMenuKey } from "../../shared/components/GameFeatureLayout";

type VocabularyLayoutProps = {
    title: string;
    menuKey: GameFeatureMenuKey;
    memberName?: string;
    isSessionActive?: boolean;
    allowPageScroll?: boolean;
    onLeavingSession?: () => void;
    children: React.ReactNode;
};

const BackgroundPattern = () => {
    // Generate pseudo-random positions once per load using lazy useState to satisfy purity
    const [items] = useState(() => {
        const emojis = ['📖', '✏️', '⭐', '✨', '📚'];
        return Array.from({ length: 20 }).map((_, i) => ({
            emoji: emojis[i % 5],
            rotation: Math.random() * 360,
        }));
    });

    return (
        <div className="vocab-bg-pattern" aria-hidden="true">
            {items.map((item: { emoji: string, rotation: number }, i: number) => (
                <div key={i} className={`vocab-bg-emoji vocab-bg-emoji--${Math.round(item.rotation) % 6}`}>
                    {item.emoji}
                </div>
            ))}
        </div>
    );
};

const VocabularyLayout: React.FC<VocabularyLayoutProps> = ({
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
        { key: "main", label: t("tenant.games.layout.menu.main"), href: "/games/vocabulary", icon: "ri-book-read-line" },
        { key: "mastered", label: t("tenant.games.layout.menu.mastered"), href: "/games/vocabulary/mastered", icon: "ri-trophy-line" },
        { key: "history", label: t("tenant.games.layout.menu.history"), href: "/games/vocabulary/history", icon: "ri-history-line" },
        { key: "settings", label: t("tenant.games.layout.menu.settings"), href: "/games/vocabulary/settings", icon: "ri-settings-3-line" },
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
            featureClass="module-vocabulary-wrapper"
        >
            <BackgroundPattern />
            {children}
        </GameFeatureLayout>
    );
};

export default VocabularyLayout;
