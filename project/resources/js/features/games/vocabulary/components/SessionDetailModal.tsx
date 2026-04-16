import React from "react";
import { Badge, Button, Modal, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { VocabularySessionHistoryItem } from "../data/api/vocabularyApi";

type Props = {
    session: VocabularySessionHistoryItem | null;
    show: boolean;
    onHide: () => void;
};

const LANGUAGE_FLAGS: Record<string, string> = {
    english: "🇬🇧",
    arabic: "🇸🇦",
    mandarin: "🇨🇳",
};

const SessionDetailModal: React.FC<Props> = ({ session, show, onHide }) => {
    const { t } = useTranslation();

    if (!session) return null;

    const attempts = session.summary?.attempts ?? [];
    const languageFlag = LANGUAGE_FLAGS[session.language] ?? "🏳️";

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" scrollable>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <div className="d-flex align-items-center gap-2 w-100">
                    <span className="fs-3">{languageFlag}</span>
                    <div>
                        <Modal.Title className="fw-bold">
                            {session.category} — {t("tenant.games.vocabulary.setup.day_value", { day: session.day })}
                        </Modal.Title>
                        <div className="small text-muted">
                            {session.question_count} soal • Skor {Math.round(session.score_percent)}%
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="pt-3">
                {/* Session Stats */}
                <div className="row g-2 mb-3">
                    <div className="col-4">
                        <div className="p-2 rounded bg-success-subtle text-center">
                            <div className="small text-muted">{t("tenant.games.vocabulary.summary.correct")}</div>
                            <div className="fs-5 fw-bold text-success">{session.correct_count}</div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="p-2 rounded bg-danger-subtle text-center">
                            <div className="small text-muted">{t("tenant.games.vocabulary.summary.wrong")}</div>
                            <div className="fs-5 fw-bold text-danger">{session.wrong_count}</div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="p-2 rounded bg-info-subtle text-center">
                            <div className="small text-muted">{t("tenant.games.vocabulary.summary.best_streak")}</div>
                            <div className="fs-5 fw-bold text-info">{session.best_streak}x</div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">{t("tenant.games.vocabulary.history.session_details")}</h6>
                    <Badge bg="secondary-subtle" text="secondary" className="x-small">
                        {formatDuration(session.duration_seconds)}
                    </Badge>
                </div>

                {/* Attempts Table */}
                {attempts.length > 0 ? (
                    <div className="table-responsive">
                        <Table size="sm" className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>{t("tenant.games.vocabulary.history.detail.question")}</th>
                                    <th>{t("tenant.games.vocabulary.history.detail.correct_answer")}</th>
                                    <th>{t("tenant.games.vocabulary.history.detail.your_answer")}</th>
                                    <th className="text-center">{t("tenant.games.vocabulary.history.detail.status")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map((attempt, index) => {
                                    const isCorrect = attempt.correct === true;
                                    const isTimedOut = !attempt.selected_answer && !isCorrect;

                                    return (
                                        <tr
                                            key={`${attempt.word_id}-${index}`}
                                            className={!isCorrect ? "table-danger-subtle" : undefined}
                                        >
                                            <td>{index + 1}</td>
                                            <td className="fw-semibold">{attempt.prompt ?? "-"}</td>
                                            <td>{attempt.correct_answer ?? "-"}</td>
                                            <td className={isTimedOut ? "text-danger fst-italic" : ""}>
                                                {isTimedOut
                                                    ? t("tenant.games.vocabulary.summary.status.time_out_text")
                                                    : (attempt.selected_answer ?? "-")}
                                            </td>
                                            <td className="text-center">
                                                {isCorrect ? (
                                                    <Badge bg="success-subtle" text="success">✓</Badge>
                                                ) : isTimedOut ? (
                                                    <Badge bg="danger-subtle" text="danger">⏱</Badge>
                                                ) : (
                                                    <Badge bg="warning-subtle" text="warning">✗</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted small">
                        {t("tenant.games.vocabulary.history.no_details_available")}
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-top-0 pt-2">
                <Button variant="secondary" size="sm" onClick={onHide}>
                    {t("tenant.games.vocabulary.summary.close")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SessionDetailModal;
