import React from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameCountdownOverlay from "../../shared/components/GameCountdownOverlay";
import GameSessionHeader from "../../shared/components/GameSessionHeader";
import GameTimerProgress from "../../shared/components/GameTimerProgress";
import type { CurriculumFeedbackState, CurriculumQuestion, CurriculumUnit } from "../types";

type FeedbackProps = {
    feedbackState: CurriculumFeedbackState;
    onContinue: () => void;
};

const FeedbackModal: React.FC<FeedbackProps> = ({ feedbackState, onContinue }) => {
    const { t } = useTranslation();

    if (!feedbackState.show) {
        return null;
    }

    const status = feedbackState.isTimedOut ? "timeout" : (feedbackState.isCorrect ? "correct" : "incorrect");
    const config = {
        correct: {
            wrapper: "vocab-notif-correct",
            emoji: "🎉",
            title: feedbackState.message,
        },
        incorrect: {
            wrapper: "vocab-notif-incorrect",
            emoji: "💪",
            title: feedbackState.message,
        },
        timeout: {
            wrapper: "vocab-notif-timeout",
            emoji: "⏰",
            title: t("tenant.games.shared.feedback.timeout"),
        },
    }[status];

    return (
        <div className="vocab-notification-backdrop">
            <div className={`vocab-notification-card ${config.wrapper}`}>
                <div className="mb-4 rounded-circle d-flex align-items-center justify-content-center border border-4 border-white icon-wrapper animate-vocab-bounce mx-auto vocab-notification-card__icon-circle">
                    {config.emoji}
                </div>
                <h3 className="fs-3 fw-bold mb-3">{config.title}</h3>
                {!feedbackState.isCorrect && (
                    <>
                        <div className="w-100 p-3 mt-2 mb-4 rounded-4 bg-white bg-opacity-75 border">
                            <p className="small fw-medium opacity-75 mb-1">{t("tenant.games.curriculum.summary.correct_answer")}</p>
                            <p className="fs-4 fw-bold mb-0">{feedbackState.correctAnswer}</p>
                        </div>
                        <button onClick={onContinue} className="btn btn-danger rounded-pill px-4 py-3 fw-bold w-100 shadow-sm vocab-notification-card__action">
                            {t("tenant.games.vocabulary.session.next")}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

type Props = {
    currentQuestionNumber: number;
    totalQuestions: number;
    currentStreak: number;
    timeRemaining: number;
    timeLimit: number;
    countdownState: "yellow" | "green" | null;
    currentQuestion: CurriculumQuestion;
    selectedOption: number | null;
    isAnswerLocked: boolean;
    feedbackState: CurriculumFeedbackState;
    sessionUnit: CurriculumUnit;
    onLeave: () => void;
    onSelect: (index: number) => void;
    onContinue: () => void;
};

const CurriculumPracticeScreen: React.FC<Props> = ({
    currentQuestionNumber,
    totalQuestions,
    currentStreak,
    timeRemaining,
    timeLimit,
    countdownState,
    currentQuestion,
    selectedOption,
    isAnswerLocked,
    feedbackState,
    sessionUnit,
    onLeave,
    onSelect,
    onContinue,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="border-0 shadow-sm h-100 d-flex flex-column vocab-practice-card position-relative">
            <GameCountdownOverlay countdownState={countdownState} />

            <Card.Header className="bg-transparent border-0 pb-0">
                <GameSessionHeader
                    currentQuestion={currentQuestionNumber}
                    totalQuestions={totalQuestions}
                    streak={currentStreak}
                    timeRemaining={timeRemaining}
                    modeLabel={[sessionUnit.subject, sessionUnit.grade ? `${t("tenant.games.curriculum.setup.grade")} ${sessionUnit.grade}` : null, sessionUnit.chapter].filter(Boolean).join(" • ")}
                    onLeave={onLeave}
                />
            </Card.Header>

            <Card.Body className="vocab-practice-body">
                <GameTimerProgress timeRemaining={timeRemaining} timeLimit={timeLimit} className="mb-3" />

                <div className="vocab-practice-prompt">
                    <div className="vocab-practice-prompt-card group">
                        <div className="vocab-prompt-gradient-top"></div>
                        <p className="vocab-prompt-label">{t("tenant.games.curriculum.question_label")}</p>
                        <h2 className="vocab-prompt-text">{currentQuestion.question_text}</h2>
                    </div>
                </div>

                <div className="vocab-options-container">
                    <p className="vocab-option-title">{t("tenant.games.vocabulary.session.quiz_question")}</p>
                    <div className="d-flex flex-column">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === index;

                            return (
                                <button
                                    key={`${currentQuestion.id}-${option}-${index}`}
                                    type="button"
                                    onClick={() => onSelect(index)}
                                    disabled={feedbackState.show || isAnswerLocked || countdownState !== null}
                                    className={`vocab-option-btn-v2 ${isSelected ? "selected" : ""} d-flex align-items-center justify-content-between game-touch-manipulation`}
                                    dir="ltr"
                                >
                                    <div className="d-flex align-items-center flex-grow-1 text-start gap-3">
                                        <span className="fw-bold">{option}</span>
                                    </div>
                                    <div className="ms-2">
                                        {isSelected ? (
                                            <i className="ri-checkbox-circle-fill fs-4" />
                                        ) : (
                                            <i className="ri-checkbox-blank-circle-line fs-4 vocab-option-icon-blank" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <FeedbackModal feedbackState={feedbackState} onContinue={onContinue} />
            </Card.Body>
        </Card>
    );
};

export default CurriculumPracticeScreen;
