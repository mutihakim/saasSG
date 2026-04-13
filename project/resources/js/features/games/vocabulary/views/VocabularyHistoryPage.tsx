import React, { useEffect, useMemo, useState } from "react";
import { Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameHistoryView from "../../shared/components/GameHistoryView";
import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularyLanguage, type VocabularySessionHistoryItem } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const HISTORY_LIMIT = 50;

const VocabularyHistoryPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState<"all" | VocabularyLanguage>("all");
    const [history, setHistory] = useState<VocabularySessionHistoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const rows = await api.fetchHistory({
                    limit: HISTORY_LIMIT,
                    language: language === "all" ? undefined : language,
                });
                if (!cancelled) {
                    setHistory(rows);
                }
            } catch {
                if (!cancelled) {
                    setHistory([]);
                    notify.error(t("tenant.games.vocabulary.history.load_error"));
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
    }, [api, language, t]);

    const metrics = useMemo(() => {
        const totalSessions = history.length;
        const avgScore = totalSessions > 0
            ? Math.round(history.reduce((sum, item) => sum + Number(item.score_percent || 0), 0) / totalSessions)
            : 0;
        const bestStreak = history.reduce((max, item) => Math.max(max, Number(item.best_streak || 0)), 0);
        const totalCorrect = history.reduce((sum, item) => sum + Number(item.correct_count || 0), 0);
        const totalWrong = history.reduce((sum, item) => sum + Number(item.wrong_count || 0), 0);

        return { totalSessions, avgScore, bestStreak, totalCorrect, totalWrong };
    }, [history]);

    return (
        <VocabularyLayout
            title={t("tenant.games.vocabulary.history.title")}
            menuKey="history"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll
        >
            <div className="container-fluid py-3">
                <div className="row g-3 mb-4 flex-nowrap">
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex flex-column"><div className="small text-muted flex-grow-1">{t("tenant.games.history.total_sessions")}</div><div className="fs-3 fw-bold mt-auto">{metrics.totalSessions}</div></Card.Body></Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex flex-column"><div className="small text-muted flex-grow-1">{t("tenant.games.history.average_score")}</div><div className="fs-3 fw-bold text-primary mt-auto">{metrics.avgScore}%</div></Card.Body></Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex flex-column"><div className="small text-muted flex-grow-1">{t("tenant.games.history.best_streak")}</div><div className="fs-3 fw-bold text-success mt-auto">{metrics.bestStreak}x</div></Card.Body></Card>
                    </div>
                    <div className="col-3">
                        <Card className="border-0 shadow-sm h-100"><Card.Body className="d-flex flex-column"><div className="small text-muted flex-grow-1">{t("tenant.games.history.correct_wrong")}</div><div className="fs-5 fw-bold mt-auto"><span className="text-success">{metrics.totalCorrect}</span><span className="text-muted mx-1">/</span><span className="text-danger">{metrics.totalWrong}</span></div></Card.Body></Card>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                    <h5 className="fw-bold mb-0">{t("tenant.games.history.session_table_title")}</h5>
                    <div className="d-flex gap-2">
                        <button type="button" className={`btn btn-sm ${language === "all" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("all")}>{t("tenant.games.vocabulary.mastered.all")}</button>
                        <button type="button" className={`btn btn-sm ${language === "english" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("english")}>{t("tenant.games.vocabulary.setup.language_en")}</button>
                        <button type="button" className={`btn btn-sm ${language === "arabic" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("arabic")}>{t("tenant.games.vocabulary.setup.language_ar")}</button>
                    </div>
                </div>

                <GameHistoryView
                    history={history}
                    isLoading={isLoading}
                    emptyMessage={t("tenant.games.vocabulary.history.empty")}
                    renderSubGroupKey={(item) => `${item.category}-${item.day}`}
                    renderSubGroupHeader={(item) => (
                        <span>{item.category} <span className="text-muted mx-1">•</span> {t("tenant.games.vocabulary.setup.day_value", { day: item.day })}</span>
                    )}
                    renderSummaryBadges={(item) => (
                        <>
                            <Badge bg="primary-subtle" text="primary" className="x-small">
                                {item.language === "english" ? t("tenant.games.vocabulary.setup.language_en") : t("tenant.games.vocabulary.setup.language_ar")}
                            </Badge>
                            {item.mode === "memory_test" && (
                                <Badge bg="info-subtle" text="info" className="x-small">{t("tenant.games.vocabulary.setup.mode_memory_test")}</Badge>
                            )}
                        </>
                    )}
                />
            </div>
        </VocabularyLayout>
    );
};

(VocabularyHistoryPage as any).layout = null;

export default VocabularyHistoryPage;
