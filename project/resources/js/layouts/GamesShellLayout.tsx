import React, { useEffect } from "react";

import { ExitConfirmModal, ModuleTopbar } from "../components/pwa";

export type GamesShellProps = {
    children: React.ReactNode;
    title: string;
    /** When true, shows exit confirmation on back navigation */
    preventExit?: boolean;
    /** When true, lock body scroll and force immersive full-height content */
    immersive?: boolean;
    /** Optional right-side action in topbar (e.g. settings, help) */
    topbarAction?: React.ReactNode;
};

const GamesShellLayout = ({
    children,
    title,
    preventExit = false,
    immersive = false,
    topbarAction,
}: GamesShellProps) => {
    useEffect(() => {
        if (!immersive) {
            return;
        }

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
        };
    }, [immersive]);

    return (
        <div className={`games-shell${immersive ? " games-shell--immersive" : ""}`} style={{ minHeight: "100dvh" }}>
            <style>{`
                .games-shell {
                    --games-bg: #0f172a;
                    --games-surface: #1e293b;
                    --games-surface-alt: #334155;
                    --games-accent: #38bdf8;
                    --games-text: #f1f5f9;
                    --games-text-muted: #94a3b8;
                    --games-danger: #f87171;
                    --games-success: #4ade80;
                    --games-warning: #fbbf24;
                    --games-safe-bottom: env(safe-area-inset-bottom, 0px);
                    --games-safe-top: env(safe-area-inset-top, 0px);
                }

                .games-shell__topbar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    padding-top: max(0.75rem, var(--games-safe-top));
                    background: var(--games-surface);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }

                .games-shell__content {
                    display: flex;
                    flex-direction: column;
                    min-height: calc(100dvh - 56px - var(--games-safe-top));
                    padding: 1rem;
                    padding-bottom: max(1rem, var(--games-safe-bottom));
                    overflow-x: hidden;
                    overflow-y: auto;
                    overscroll-behavior: none;
                    -webkit-overscroll-behavior: none;
                }

                /* Portrait: full width content */
                @media (orientation: portrait) {
                    .games-shell__content {
                        padding: 1rem;
                    }
                }

                /* Landscape: centered, max-width for readability */
                @media (orientation: landscape) {
                    .games-shell__content {
                        max-width: 720px;
                        margin: 0 auto;
                        padding: 1.5rem 2rem;
                    }
                }

                /* Prevent pull-to-refresh */
                .games-shell {
                    overscroll-behavior-y: contain;
                }

                /* Game area fills viewport in immersive mode */
                .games-shell__game-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .games-shell--immersive .games-shell__content {
                    height: calc(100dvh - 56px - var(--games-safe-top));
                    min-height: calc(100dvh - 56px - var(--games-safe-top));
                    overflow: hidden;
                }

                /* Landscape game area: wider layout */
                @media (orientation: landscape) {
                    .games-shell__game-area {
                        flex-direction: row;
                        gap: 1.5rem;
                    }
                }

                /* Focus styles for accessibility */
                .games-shell *:focus-visible {
                    outline: 2px solid var(--games-accent);
                    outline-offset: 2px;
                    border-radius: 4px;
                }
            `}</style>

            <ModuleTopbar
                title={title}
                badgeText={preventExit ? "Game Active" : undefined}
                action={topbarAction}
            />

            <div className="games-shell__content">
                {children}
            </div>

            {preventExit && (
                <ExitConfirmModal
                    eventName="games:request-exit"
                    title="Keluar dari Game?"
                    message="Progress game yang belum tersimpan akan hilang."
                    continueLabel="Lanjut Main"
                    exitLabel="Keluar"
                />
            )}
        </div>
    );
};

export default GamesShellLayout;
