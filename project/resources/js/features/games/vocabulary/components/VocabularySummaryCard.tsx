import React, { useMemo } from "react";
import { Alert, Badge, Table } from "react-bootstrap";

import GameSummaryCard from "../../shared/components/GameSummaryCard";
import type { VocabularyAttemptResult } from "../types";

type Props = {
    attempts: VocabularyAttemptResult[];
    scorePercent: number;
    correctCount: number;
    bestStreak: number;
    isSavingSummary: boolean;
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
    onChangeSetup,
    onPlayAgain,
    onStartMemoryTest,
}) => {
    const isAllMastered = useMemo(() => {
        return attempts.length > 0 && attempts.every((a) => a.isCorrect);
    }, [attempts]);

    const actions = [
        { label: "Ubah Setup", variant: "light", onClick: onChangeSetup },
        { label: isSavingSummary ? "Menyimpan..." : "Main Lagi", variant: "primary", disabled: isSavingSummary, onClick: onPlayAgain },
    ];

    if (isAllMastered && onStartMemoryTest) {
        actions.push({
            label: "Coba Tes Ingatan",
            variant: "success",
            disabled: isSavingSummary,
            onClick: onStartMemoryTest,
        });
    }

    return (
        <GameSummaryCard
            title="Rapor Latihan Vocabulary"
            metrics={[
                { value: `${scorePercent}%`, label: "Akurasi", cardClassName: "bg-primary-subtle", valueClassName: "text-primary" },
                { value: correctCount, label: "Benar", cardClassName: "bg-success-subtle", valueClassName: "text-success" },
                { value: bestStreak, label: "Best Streak", cardClassName: "bg-info-subtle", valueClassName: "text-info" },
            ]}
            actions={actions}
        >
            {isAllMastered && (
                <Alert variant="success" className="border-0 shadow-sm mb-0">
                    <div className="d-flex align-items-center gap-3">
                        <div className="display-6">🏆</div>
                        <div>
                            <h5 className="fw-bold mb-1">Level Mastered!</h5>
                            <p className="mb-0 small opacity-75">
                                Semua soal di level ini sudah dikuasai. Ingin mencoba <strong>Tes Ingatan</strong>?
                                <br />
                                Di Tes Ingatan, batas mastery diabaikan sehingga streak bisa terus tumbuh. Salah satu kali saja akan mereset streak ke 0.
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
                            <th>Kata</th>
                            <th>Jawaban Benar</th>
                            <th>Jawabanmu</th>
                            <th>Status</th>
                            <th className="text-center">Streak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map((attempt, index) => (
                            <tr key={`${attempt.wordId}-${index}`}>
                                <td>{index + 1}</td>
                                <td>{attempt.prompt}</td>
                                <td>{attempt.correctAnswer}</td>
                                <td className={attempt.isTimedOut ? "text-danger italic" : ""}>
                                    {attempt.isTimedOut ? "Waktu Habis" : (attempt.selectedAnswer || "-")}
                                </td>
                                <td>
                                    <Badge bg={attempt.isCorrect ? "success" : (attempt.isTimedOut ? "danger" : "warning")}>
                                        {attempt.isCorrect ? "Benar" : (attempt.isTimedOut ? "Timeout" : "Salah")}
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
