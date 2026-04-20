import React from "react";
import { Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { MathPairStats } from "../../data/api/gamesApi";
import type { MathAttemptEntry, MathGameResult } from "../../types";
import { formatAttemptProblem } from "../../utils/mathGame";

type Props = {
    attempts: MathAttemptEntry[];
    result: MathGameResult;
    summaryStats: Record<string, MathPairStats>;
    onChangeSetup: () => void;
    onPlayAgain: () => void;
};

const MathSummaryCard: React.FC<Props> = ({ attempts, result, summaryStats, onChangeSetup, onPlayAgain }) => {
    const { t } = useTranslation();

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
                <h5 className="fw-bold mb-0">{t("tenant.games.math.summary.title")}</h5>
            </Card.Header>
            <Card.Body>
                <Row className="g-3 mb-3">
                    <Col sm={4}>
                        <div className="rounded-3 bg-primary-subtle p-3 text-center h-100">
                            <div className="fs-3 fw-bold text-primary">{Math.round((result.correctCount / Math.max(1, attempts.length)) * 100)}%</div>
                            <div className="small text-muted">{t("tenant.games.math.summary.accuracy")}</div>
                        </div>
                    </Col>
                    <Col sm={4}>
                        <div className="rounded-3 bg-success-subtle p-3 text-center h-100">
                            <div className="fs-3 fw-bold text-success">{result.correctCount}</div>
                            <div className="small text-muted">{t("tenant.games.math.summary.correct_answers")}</div>
                        </div>
                    </Col>
                    <Col sm={4}>
                        <div className="rounded-3 bg-info-subtle p-3 text-center h-100">
                            <div className="fs-3 fw-bold text-info">{result.bestStreak}</div>
                            <div className="small text-muted">{t("tenant.games.math.summary.best_streak")}</div>
                        </div>
                    </Col>
                </Row>

                <div className="math-game__summary-table table-responsive mb-3">
                    <Table size="sm" className="align-middle mb-0">
                        <thead className="table-light position-sticky top-0">
                            <tr>
                                <th>{t("tenant.games.math.summary.table.no")}</th>
                                <th>{t("tenant.games.math.summary.table.problem")}</th>
                                <th>{t("tenant.games.math.summary.table.your_answer")}</th>
                                <th>{t("tenant.games.math.summary.table.status")}</th>
                                <th className="text-center">{t("tenant.games.math.summary.table.success_rate")}</th>
                                <th className="text-center">{t("tenant.games.math.summary.table.streak")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.map((attempt, index) => {
                                const stats = summaryStats[attempt.question.pairKey];
                                const total = (stats?.jumlah_benar ?? 0) + (stats?.jumlah_salah ?? 0);
                                const successRate = total > 0 ? Math.round(((stats?.jumlah_benar ?? 0) / total) * 100) : 0;
                                const statusVariant = attempt.isCorrect ? "success" : attempt.timedOut ? "warning" : "danger";
                                const statusLabel = attempt.isCorrect
                                    ? t("tenant.games.math.summary.status.correct")
                                    : attempt.timedOut
                                        ? t("tenant.games.math.summary.status.late")
                                        : t("tenant.games.math.summary.status.wrong");

                                return (
                                    <tr key={`${attempt.question.pairKey}-${index}`}>
                                        <td className="fw-semibold">{index + 1}</td>
                                        <td>{formatAttemptProblem(attempt)}</td>
                                        <td>{attempt.userAnswer ?? "-"}</td>
                                        <td>
                                            <Badge bg={`${statusVariant}-subtle`} text={statusVariant}>
                                                {statusLabel}
                                            </Badge>
                                        </td>
                                        <td className="text-center">{successRate}%</td>
                                        <td className="text-center">{stats?.current_streak_benar ?? attempt.streakAfter}x</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-end">
                    <Button variant="light" onClick={onChangeSetup}>
                        {t("tenant.games.math.summary.change_setup")}
                    </Button>
                    <Button variant="primary" onClick={onPlayAgain}>
                        {t("tenant.games.math.summary.play_again")}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default MathSummaryCard;
