import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameHistoryView from "../../shared/components/GameHistoryView";
import CurriculumLayout from "../components/CurriculumLayout";
import { createCurriculumApi, type CurriculumSessionHistoryItem } from "../data/api/curriculumApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type Props = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const CurriculumHistoryPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const curriculumApi = useMemo(() => createCurriculumApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<CurriculumSessionHistoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const rows = await curriculumApi.fetchHistory(50);
                if (!cancelled) {
                    setHistory(rows);
                }
            } catch {
                if (!cancelled) {
                    notify.error(t("tenant.games.curriculum.history.load_error"));
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
    }, [curriculumApi, t]);

    const metrics = useMemo(() => {
        const totalSessions = history.length;
        const avgScore = totalSessions > 0
            ? Math.round(history.reduce((sum, item) => sum + Number(item.score_percent || 0), 0) / totalSessions)
            : 0;

        return {
            totalSessions,
            avgScore,
            bestStreak: history.reduce((max, item) => Math.max(max, item.best_streak), 0),
        };
    }, [history]);

    return (
        <CurriculumLayout
            title={t("tenant.games.curriculum.history.title")}
            menuKey="history"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll
        >
            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <div className="vocab-setup-card">
                        <div className="vocab-stat-row">
                            <div className="vocab-stat-card vocab-stat-card--indigo">
                                <div className="vocab-stat-card__value">{metrics.totalSessions}</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.total_sessions")}</div>
                            </div>
                            <div className="vocab-stat-card vocab-stat-card--mint">
                                <div className="vocab-stat-card__value">{metrics.avgScore}%</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.average_score")}</div>
                            </div>
                            <div className="vocab-stat-card vocab-stat-card--peach">
                                <div className="vocab-stat-card__value">{metrics.bestStreak}</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.best_streak")}</div>
                            </div>
                        </div>

                        <div className="vocab-setup-content vocab-inner-content">
                            <GameHistoryView
                                history={history}
                                isLoading={isLoading}
                                emptyMessage={t("tenant.games.curriculum.history.empty")}
                                renderSubGroupKey={(item) => `${item.subject}-${item.grade ?? "na"}-${item.chapter ?? "na"}`}
                                renderSubGroupHeader={(item) => (
                                    <span>{[item.subject, item.grade ? `${t("tenant.games.curriculum.setup.grade")} ${item.grade}` : null, item.chapter].filter(Boolean).join(" • ")}</span>
                                )}
                                renderSummaryBadges={(item) => (
                                    <>
                                        <Badge bg="info-subtle" text="info" className="x-small">
                                            {t("tenant.games.history.progress_value", { answered: item.correct_count + item.wrong_count, total: item.question_count })}
                                        </Badge>
                                        {item.time_limit_seconds ? (
                                            <Badge bg="secondary-subtle" text="secondary" className="x-small">
                                                {t("tenant.games.curriculum.setup.time_limit_value", { seconds: item.time_limit_seconds })}
                                            </Badge>
                                        ) : null}
                                    </>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </CurriculumLayout>
    );
};

export default CurriculumHistoryPage;
