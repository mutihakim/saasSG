import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameHistoryView from "../../shared/components/GameHistoryView";
import LanguageFilterTabs, { type LanguageFilterValue } from "../../shared/components/LanguageFilterTabs";
import SessionDetailModal from "../components/SessionDetailModal";
import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularySessionHistoryItem } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const HISTORY_LIMIT = 200;

const LANGUAGE_FLAGS: Record<string, string> = {
    english: "🇬🇧",
    arabic: "🇸🇦",
    mandarin: "🇨🇳",
};

const VocabularyHistoryPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState<LanguageFilterValue>(null);
    const [history, setHistory] = useState<VocabularySessionHistoryItem[]>([]);
    const [selectedSession, setSelectedSession] = useState<VocabularySessionHistoryItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const rows = await api.fetchHistory({
                    limit: HISTORY_LIMIT,
                    language: language ?? undefined,
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

    const handleSessionClick = useCallback((item: VocabularySessionHistoryItem) => {
        setSelectedSession(item);
        setShowDetailModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowDetailModal(false);
        setSelectedSession(null);
    }, []);

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
        >
            {/* Gunakan struktur yang sama dengan VocabularyPage:
                math-game-layout__scroll → math-game → vocab-setup-card → vocab-setup-content (scrollable) */}
            <div className="math-game-layout__scroll">
                <div className="math-game">

                    <div className="vocab-setup-card">
                        {/* Stats bar — colored pill cards */}
                        <div className="vocab-stat-row">
                            <div className="vocab-stat-card vocab-stat-card--indigo">
                                <div className="vocab-stat-card__value">{metrics.totalSessions}</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.total_sessions")}</div>
                            </div>
                            <div className="vocab-stat-card vocab-stat-card--teal">
                                <div className="vocab-stat-card__value">{metrics.avgScore}%</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.average_score")}</div>
                            </div>
                            <div className="vocab-stat-card vocab-stat-card--amber">
                                <div className="vocab-stat-card__value">{metrics.bestStreak}x</div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.best_streak")}</div>
                            </div>
                            <div className="vocab-stat-card vocab-stat-card--split">
                                <div className="vocab-stat-card__value">
                                    <span className="text-success">{metrics.totalCorrect}</span>
                                    <span className="text-muted mx-1" style={{ fontSize: "0.8rem" }}>/</span>
                                    <span className="text-danger">{metrics.totalWrong}</span>
                                </div>
                                <div className="vocab-stat-card__label">{t("tenant.games.history.correct_wrong")}</div>
                            </div>
                        </div>

                        {/* Konten utama — scrollable */}
                        <div className="vocab-setup-content vocab-inner-content">
                            <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                                <h6 className="fw-bold mb-0">{t("tenant.games.history.session_table_title")}</h6>
                                <LanguageFilterTabs
                                    selected={language}
                                    onChange={setLanguage}
                                />
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
                                        <span className="fs-5 game-history-flag" title={item.language} onClick={() => handleSessionClick(item)}>
                                            {LANGUAGE_FLAGS[item.language] ?? "🏳️"}
                                        </span>
                                        {item.mode === "memory_test" && (
                                            <Badge bg="info-subtle" text="info" className="x-small">{t("tenant.games.vocabulary.setup.mode_memory_test")}</Badge>
                                        )}
                                    </>
                                )}
                                onItemClick={handleSessionClick}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <SessionDetailModal
                session={selectedSession}
                show={showDetailModal}
                onHide={handleCloseModal}
            />
        </VocabularyLayout>
    );
};

(VocabularyHistoryPage as any).layout = null;

export default VocabularyHistoryPage;
