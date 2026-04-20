import React from "react";
import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameCountdownOverlay from "../../../shared/components/GameCountdownOverlay";
import GameSessionHeader from "../../../shared/components/GameSessionHeader";
import GameTimerProgress from "../../../shared/components/GameTimerProgress";
import type { MathCountdownState, MathGameSetupState, MathQuestion } from "../../types";
import { answerVariant, modeLabelKey, playNumpadNote } from "../../utils/mathGame";

type Props = {
    currentQuestion: MathQuestion;
    currentQuestionNumber: number;
    setup: MathGameSetupState;
    userAnswer: string;
    isCorrect: boolean | null;
    timeRemaining: number;
    isLocked: boolean;
    isCountdownActive: boolean;
    countdownState: MathCountdownState;
    getCurrentStreak: () => number;
    onDigit: (digit: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
    onLeave?: () => void;
};

const MathSessionCard: React.FC<Props> = ({
    currentQuestion,
    currentQuestionNumber,
    setup,
    userAnswer,
    isCorrect,
    timeRemaining,
    isLocked,
    isCountdownActive,
    countdownState,
    getCurrentStreak,
    onDigit,
    onDelete,
    onSubmit,
    onLeave,
}) => {
    const { t } = useTranslation();
    const disabled = isLocked || isCountdownActive;

    return (
        <Card className="border-0 shadow-sm math-game__session-card position-relative">
            <GameCountdownOverlay countdownState={countdownState} />

            <Card.Header className="math-game__session-header bg-transparent border-0 pb-0">
                <GameSessionHeader
                    currentQuestion={currentQuestionNumber}
                    totalQuestions={setup.questionCount}
                    streak={getCurrentStreak()}
                    timeRemaining={timeRemaining}
                    modeLabel={t(modeLabelKey(setup.mode))}
                    onLeave={onLeave}
                />

                <GameTimerProgress
                    timeRemaining={timeRemaining}
                    timeLimit={setup.timeLimit}
                    className="mb-0 game-timer-progress--compact"
                />
            </Card.Header>

            <Card.Body className="math-game__session-body">
                <div className="math-game__session-question rounded-3 border bg-light-subtle p-4 text-center mb-3">
                    <div className="text-muted small mb-2">{t("tenant.games.math.session.question_label")}</div>
                    <div className="display-6 fw-bold mb-0">{currentQuestion.display}</div>
                </div>

                <div className="math-game__session-answer rounded-3 border p-3 text-center mb-3">
                    <div className="text-muted small mb-2">{t("tenant.games.math.session.answer_label")}</div>
                    <div className={`math-game__answer-box display-6 fw-bold text-${answerVariant(isCorrect)} d-inline-block px-3 pb-1`}>
                        {userAnswer || t("tenant.games.math.session.answer_placeholder")}
                    </div>
                </div>

                <div className="math-game__session-numpad math-game__numpad d-grid gap-2 mx-auto" key={currentQuestionNumber}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                        <Button
                            key={digit}
                            variant="outline-primary"
                            size="lg"
                            className="math-game__numpad-button game-touch-manipulation"
                            onClick={(event) => {
                                event.currentTarget.blur();
                                playNumpadNote(digit);
                                onDigit(digit);
                            }}
                            disabled={disabled}
                        >
                            {digit}
                        </Button>
                    ))}

                    <Button
                        variant="outline-warning"
                        size="lg"
                        className="math-game__numpad-button game-touch-manipulation"
                        onClick={(event) => {
                            event.currentTarget.blur();
                            onDelete();
                        }}
                        disabled={disabled}
                    >
                        <i className="ri-delete-back-line" />
                    </Button>

                    <Button
                        variant="outline-primary"
                        size="lg"
                        className="math-game__numpad-button game-touch-manipulation"
                        onClick={(event) => {
                            event.currentTarget.blur();
                            playNumpadNote("0");
                            onDigit("0");
                        }}
                        disabled={disabled}
                    >
                        0
                    </Button>

                    <Button
                        variant="success"
                        size="lg"
                        className="math-game__numpad-button game-touch-manipulation"
                        onClick={(event) => {
                            event.currentTarget.blur();
                            onSubmit();
                        }}
                        disabled={disabled}
                    >
                        {t("tenant.games.math.session.numpad.submit")}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default MathSessionCard;
