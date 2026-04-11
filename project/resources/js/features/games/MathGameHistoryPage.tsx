import React, { useEffect, useMemo, useState } from "react";
import { Badge, Card, Col, Row, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import MathGameLayout from "./components/MathGameLayout";
import { createGamesApi, MathGameMode, MathSessionHistoryItem } from "./data/api/gamesApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type Props = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const formatDateTime = (value: string | null) => {
    if (!value) {
        return "-";
    }

    try {
        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "-";
    }
};

const modeLabelKey = (mode: MathGameMode) => (
    mode === "mencariB" ? "tenant.games.math.mode.find_variable" : "tenant.games.math.mode.find_result"
);

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
                const rows = await gamesApi.fetchMathHistory(50);
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
                <Row className="g-3 mb-3">
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="small text-muted">{t("tenant.games.history.total_sessions")}</div>
                                <div className="fs-3 fw-bold">{metrics.totalSessions}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="small text-muted">{t("tenant.games.history.average_score")}</div>
                                <div className="fs-3 fw-bold text-primary">{metrics.avgScore}%</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="small text-muted">{t("tenant.games.history.best_streak")}</div>
                                <div className="fs-3 fw-bold text-success">{metrics.bestStreak}x</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="small text-muted">{t("tenant.games.history.correct_wrong")}</div>
                                <div className="fs-5 fw-bold">
                                    <span className="text-success">{metrics.totalCorrect}</span>
                                    <span className="text-muted mx-1">/</span>
                                    <span className="text-danger">{metrics.totalWrong}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-transparent border-0 pb-0">
                        <h5 className="fw-semibold mb-0">{t("tenant.games.history.session_table_title")}</h5>
                    </Card.Header>
                    <Card.Body>
                        {isLoading ? (
                            <div className="d-flex align-items-center gap-2 text-muted">
                                <Spinner size="sm" animation="border" />
                                <span>{t("tenant.games.history.loading")}</span>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-muted small">{t("tenant.games.history.empty")}</div>
                        ) : (
                            <div className="table-responsive">
                                <Table size="sm" className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>{t("tenant.games.history.table.time")}</th>
                                            <th>{t("tenant.games.history.table.mode")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.operator")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.range")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.progress")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.score")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.duration")}</th>
                                            <th className="text-center">{t("tenant.games.history.table.streak")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((row) => {
                                            const answered = Number(row.correct_count || 0) + Number(row.wrong_count || 0);
                                            return (
                                                <tr key={row.id}>
                                                    <td>{formatDateTime(row.finished_at)}</td>
                                                    <td>
                                                        <Badge bg="secondary-subtle" text="secondary">{t(modeLabelKey(row.game_mode))}</Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg="info-subtle" text="info">{row.operator}</Badge>
                                                    </td>
                                                    <td className="text-center fw-semibold">
                                                        {t("tenant.games.history.range_value", {
                                                            a: row.number_range,
                                                            b: row.random_range ?? "-",
                                                        })}
                                                    </td>
                                                    <td className="text-center">
                                                        {t("tenant.games.history.progress_value", {
                                                            answered,
                                                            total: row.question_count,
                                                        })}
                                                    </td>
                                                    <td className="text-center fw-semibold">{Math.round(row.score_percent)}%</td>
                                                    <td className="text-center">{t("tenant.games.history.duration_seconds", { seconds: row.duration_seconds })}</td>
                                                    <td className="text-center">{row.best_streak}x</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </MathGameLayout>
    );
};

export default MathGameHistoryPage;
