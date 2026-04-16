import React from "react";
import { Alert, Badge, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameSummaryCard from "../../shared/components/GameSummaryCard";
import type { VocabularyAttemptResult } from "../types";

type Props = {
    attempts: VocabularyAttemptResult[];
    scorePercent: number;
    correctCount: number;
    bestStreak: number;
    isSavingSummary: boolean;
    isLevelMastered: boolean;
    onChangeSetup: () => void;
    onPlayAgain: () => void;
    onStartMemoryTest?: () => void;
};

const VocabularySummaryCard: React.FC<Props> = ({
    attempts,
    scorePercent,
    correctCount,
    bestStreak,
    isSavingSummary,
    isLevelMastered,
    onChangeSetup,
    onPlayAgain,
    onStartMemoryTest,
}) => {
    const { t } = useTranslation();

    const actions = [
        { label: t("tenant.games.vocabulary.summary.change_setup"), variant: "light", onClick: onChangeSetup },
        { label: isSavingSummary ? t("tenant.games.vocabulary.summary.saving") : t("tenant.games.vocabulary.summary.play_again"), variant: "primary", disabled: isSavingSummary, onClick: onPlayAgain },
    ];

    if (isLevelMastered && onStartMemoryTest) {
        actions.push({
            label: t("tenant.games.vocabulary.summary.start_memory_test"),
            variant: "success",
            disabled: isSavingSummary,
            onClick: onStartMemoryTest,
        });
    }

    return (
        <GameSummaryCard
            title={t("tenant.games.vocabulary.summary.title")}
            metrics={[
                { value: `${scorePercent}%`, label: t("tenant.games.vocabulary.summary.accuracy"), cardClassName: "bg-primary-subtle", valueClassName: "text-primary" },
                { value: correctCount, label: t("tenant.games.vocabulary.summary.correct"), cardClassName: "bg-success-subtle", valueClassName: "text-success" },
                { value: bestStreak, label: t("tenant.games.vocabulary.summary.best_streak"), cardClassName: "bg-info-subtle", valueClassName: "text-info" },
            ]}
            actions={actions}
        >
            {isLevelMastered && (
                <Alert variant="success" className="border-0 shadow-sm mb-0">
                    <div className="d-flex align-items-center gap-3">
                        <div className="display-6">🏆</div>
                        <div>
                            <h5 className="fw-bold mb-1">{t("tenant.games.math.memory_test.title")}</h5>
                            <p className="mb-0 small opacity-75">
                                {t("tenant.games.math.memory_test.prompt_prefix")} <strong>{t("tenant.games.math.memory_test.name")}</strong>?
                                <br />
                                {t("tenant.games.math.memory_test.description")}
                            </p>
                        </div>
                    </div>
                </Alert>
            )}

            <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            <th>{t("tenant.games.vocabulary.summary.table.word")}</th>
                            <th>{t("tenant.games.vocabulary.summary.table.correct_answer")}</th>
                            <th>{t("tenant.games.vocabulary.summary.table.your_answer")}</th>
                            <th>{t("tenant.games.vocabulary.summary.table.status")}</th>
                            <th className="text-center">{t("tenant.games.vocabulary.summary.table.streak")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map((attempt, index) => (
                            <tr key={`${attempt.wordId}-${index}`}>
                                <td>{index + 1}</td>
                                <td>{attempt.prompt}</td>
                                <td>{attempt.correctAnswer}</td>
                                <td className={attempt.isTimedOut ? "text-danger italic" : ""}>
                                    {attempt.isTimedOut ? t("tenant.games.vocabulary.summary.status.time_out_text") : (attempt.selectedAnswer || "-")}
                                </td>
                                <td>
                                    <Badge bg={attempt.isCorrect ? "success" : (attempt.isTimedOut ? "danger" : "warning")}>
                                        {attempt.isCorrect 
                                            ? t("tenant.games.math.summary.status.correct") 
                                            : (attempt.isTimedOut ? t("tenant.games.vocabulary.summary.status.timeout") : t("tenant.games.math.summary.status.wrong"))}
                                    </Badge>
                                </td>
                                <td className="text-center">{attempt.streakAfter}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </GameSummaryCard>
    );
};

export default VocabularySummaryCard;
