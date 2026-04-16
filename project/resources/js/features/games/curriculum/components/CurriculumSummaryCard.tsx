import React from "react";
import { Badge, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameSummaryCard from "../../shared/components/GameSummaryCard";
import type { CurriculumAttemptResult } from "../types";

type Props = {
    attempts: CurriculumAttemptResult[];
    scorePercent: number;
    correctCount: number;
    bestStreak: number;
    isSavingSummary: boolean;
    onChangeSetup: () => void;
    onPlayAgain: () => void;
};

const CurriculumSummaryCard: React.FC<Props> = ({
    attempts,
    scorePercent,
    correctCount,
    bestStreak,
    isSavingSummary,
    onChangeSetup,
    onPlayAgain,
}) => {
    const { t } = useTranslation();

    return (
        <GameSummaryCard
            title={t("tenant.games.curriculum.summary.title")}
            metrics={[
                { value: `${scorePercent}%`, label: t("tenant.games.curriculum.summary.accuracy"), cardClassName: "bg-primary-subtle", valueClassName: "text-primary" },
                { value: correctCount, label: t("tenant.games.curriculum.summary.correct"), cardClassName: "bg-success-subtle", valueClassName: "text-success" },
                { value: bestStreak, label: t("tenant.games.curriculum.summary.best_streak"), cardClassName: "bg-info-subtle", valueClassName: "text-info" },
            ]}
            actions={[
                { label: t("tenant.games.curriculum.summary.change_setup"), variant: "light", onClick: onChangeSetup },
                { label: isSavingSummary ? t("tenant.games.curriculum.saving") : t("tenant.games.math.summary.play_again"), variant: "primary", disabled: isSavingSummary, onClick: onPlayAgain },
            ]}
        >
            <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            <th>{t("tenant.games.curriculum.summary.question")}</th>
                            <th>{t("tenant.games.curriculum.summary.correct_answer")}</th>
                            <th>{t("tenant.games.curriculum.summary.your_answer")}</th>
                            <th>{t("tenant.games.curriculum.summary.status")}</th>
                            <th className="text-center">{t("tenant.games.vocabulary.summary.table.streak")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map((attempt, index) => (
                            <tr key={`${attempt.questionId}-${index}`}>
                                <td>{index + 1}</td>
                                <td>{attempt.questionText}</td>
                                <td>{attempt.correctAnswer}</td>
                                <td className={attempt.isTimedOut ? "text-danger" : ""}>
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

export default CurriculumSummaryCard;
