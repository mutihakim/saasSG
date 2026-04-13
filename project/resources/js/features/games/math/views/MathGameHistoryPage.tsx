import React, { useEffect, useMemo, useState } from "react";
import { Badge, Card } from "react-bootstrap";
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
            allowPageScroll
        >
            <div className="container-fluid py-3">
                <div className="row g-3 mb-4 flex-nowrap">
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="small text-muted flex-grow-1">{t("tenant.games.history.total_sessions")}</div>
                                <div className="fs-3 fw-bold mt-auto">{metrics.totalSessions}</div>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="small text-muted flex-grow-1">{t("tenant.games.history.average_score")}</div>
                                <div className="fs-3 fw-bold text-primary mt-auto">{metrics.avgScore}%</div>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="small text-muted flex-grow-1">{t("tenant.games.history.best_streak")}</div>
                                <div className="fs-3 fw-bold text-success mt-auto">{metrics.bestStreak}x</div>
                            </Card.Body>
                        </Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="small text-muted flex-grow-1">{t("tenant.games.history.correct_wrong")}</div>
                                <div className="fs-5 fw-bold mt-auto">
                                    <span className="text-success">{metrics.totalCorrect}</span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-danger">{metrics.totalWrong}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                <h5 className="fw-bold mb-3">{t("tenant.games.history.session_table_title")}</h5>

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
        </MathGameLayout>
    );
};

export default MathGameHistoryPage;
