import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameHistoryView from "../../shared/components/GameHistoryView";
import MathGameLayout from "../components/MathGameLayout";
import { createGamesApi, MathGameMode, MathSessionHistoryItem } from "../data/api/gamesApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type Props = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const modeLabelKey = (mode: MathGameMode) => (
    mode === "mencariB" ? "tenant.games.math.mode.mencariB" : "tenant.games.math.mode.mencariC"
);

const HISTORY_LIMIT = 50;

const MathGameHistoryPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<MathSessionHistoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const rows = await gamesApi.fetchMathHistory(HISTORY_LIMIT);
                if (!cancelled) {
                    setHistory(rows);
                }
            } catch {
                if (!cancelled) {
                    setHistory([]);
                    notify.error(t("tenant.games.history.load_error_toast"));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [gamesApi, t]);

    const metrics = useMemo(() => {
        const totalSessions = history.length;
        const avgScore = totalSessions > 0
            ? Math.round(history.reduce((sum, item) => sum + Number(item.score_percent || 0), 0) / totalSessions)
            : 0;
        const bestStreak = history.reduce((max, item) => Math.max(max, Number(item.best_streak || 0)), 0);
        const totalCorrect = history.reduce((sum, item) => sum + Number(item.correct_count || 0), 0);
        const totalWrong = history.reduce((sum, item) => sum + Number(item.wrong_count || 0), 0);

        return {
            totalSessions,
            avgScore,
            bestStreak,
            totalCorrect,
            totalWrong,
        };
    }, [history]);

    return (
        <MathGameLayout
            title={t("tenant.games.history.title")}
            menuKey="history"
            memberName={member?.full_name ?? member?.name ?? undefined}
        >
            <div className="game-setup-card h-100">
                {/* Stats bar — colored pill cards (using math-stat-card classes from _theme.scss) */}
                <div className="math-stat-row">
                    <div className="math-stat-card math-stat-card--blue">
                        <div className="math-stat-card__value">{metrics.totalSessions}</div>
                        <div className="math-stat-card__label">{t("tenant.games.history.total_sessions")}</div>
                    </div>
                    <div className="math-stat-card math-stat-card--indigo">
                        <div className="math-stat-card__value">{metrics.avgScore}%</div>
                        <div className="math-stat-card__label">{t("tenant.games.history.average_score")}</div>
                    </div>
                    <div className="math-stat-card math-stat-card--teal">
                        <div className="math-stat-card__value">{metrics.bestStreak}x</div>
                        <div className="math-stat-card__label">{t("tenant.games.history.best_streak")}</div>
                    </div>
                    <div className="math-stat-card math-stat-card--split">
                        <div className="math-stat-card__value">
                            <span className="text-success">{metrics.totalCorrect}</span>
                            <span className="text-muted mx-1" style={{ fontSize: "0.8rem" }}>/</span>
                            <span className="text-danger">{metrics.totalWrong}</span>
                        </div>
                        <div className="math-stat-card__label">{t("tenant.games.history.correct_wrong")}</div>
                    </div>
                </div>

                {/* Main content — scrollable */}
                <div className="game-setup-content game-setup-inner-content">
                    <h6 className="fw-bold mb-3">{t("tenant.games.history.session_table_title")}</h6>

                    <GameHistoryView
                        history={history}
                        isLoading={isLoading}
                        emptyMessage={t("tenant.games.history.empty")}
                        renderSubGroupKey={(item) => `${item.operator}-${item.number_range}-${item.random_range ?? "na"}`}
                        renderSubGroupHeader={(item) => (
                            <span>
                                Operator {item.operator} <span className="text-muted mx-1">•</span> Range {t("tenant.games.history.range_value", {
                                    a: item.number_range,
                                    b: item.random_range ?? "-",
                                })}
                            </span>
                        )}
                        renderSummaryBadges={(item) => (
                            <Badge bg="secondary-subtle" text="secondary" className="x-small">
                                {t(modeLabelKey(item.game_mode))}
                            </Badge>
                        )}
                    />
                </div>
            </div>
        </MathGameLayout>
    );
};

(MathGameHistoryPage as any).layout = null;

export default MathGameHistoryPage;
