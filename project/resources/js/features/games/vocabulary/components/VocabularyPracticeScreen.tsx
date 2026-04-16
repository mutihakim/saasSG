import React from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameCountdownOverlay from "../../shared/components/GameCountdownOverlay";
import GameSessionHeader from "../../shared/components/GameSessionHeader";
import GameTimerProgress from "../../shared/components/GameTimerProgress";
import type { VocabularyFeedbackState, VocabularyOption } from "../types";

type NotificationModalProps = {
    feedbackState: VocabularyFeedbackState;
    onNext: () => void;
};

const NotificationModal: React.FC<NotificationModalProps> = ({ feedbackState, onNext }) => {
    const { t } = useTranslation();

    if (!feedbackState.show) return null;

    const { isCorrect, isTimedOut, correctAnswer, correctAnswerPhonetic, message } = feedbackState;
    const status = isTimedOut ? "timeout" : (isCorrect ? "correct" : "incorrect");

    const config = {
        correct: {
            wrapper: "vocab-notif-correct",
            emoji: "🎉",
            title: message || t("tenant.games.feedback.praise.0"),
            btnBg: "btn btn-success rounded-pill px-4 py-3 fw-bold border-0 shadow-sm transition",
        },
        incorrect: {
            wrapper: "vocab-notif-incorrect",
            emoji: "💪",
            title: message || t("tenant.games.feedback.encouragement.0"),
            btnBg: "btn btn-danger rounded-pill px-4 py-3 fw-bold w-100 shadow-sm",
        },
        timeout: {
            wrapper: "vocab-notif-timeout",
            emoji: "⏰",
            title: t("tenant.games.shared.feedback.timeout"),
            btnBg: "btn btn-danger rounded-pill px-4 py-3 fw-bold w-100 shadow-sm"
        }
    };

    const current = config[status];

    return (
        <div className="vocab-notification-backdrop">
            <div className={`vocab-notification-card ${current.wrapper}`}>
                <div className="mb-4 rounded-circle d-flex align-items-center justify-content-center border border-4 border-white icon-wrapper animate-vocab-bounce mx-auto vocab-notification-card__icon-circle">
                    {current.emoji}
                </div>

                <h3 className="fs-3 fw-bold mb-3">{current.title}</h3>

                {status !== "correct" ? (
                    <div className="w-100 p-3 mt-2 mb-4 rounded-4 bg-white bg-opacity-75 border">
                        <p className="small fw-medium opacity-75 mb-1">{t("tenant.games.vocabulary.session.correct_answer_label")}</p>
                        <p className="fs-4 fw-bold mb-0">{correctAnswer}</p>
                        {correctAnswerPhonetic && (
                            <p className="small text-muted mt-1 mb-0" dir="ltr">{correctAnswerPhonetic}</p>
                        )}
                    </div>
                ) : (
                    <p className="fs-5 fw-medium mb-4 mt-2 opacity-75">
                        {t("tenant.games.math.summary.status.correct")}
                    </p>
                )}

                {status !== "correct" && (
                    <button onClick={onNext} className={`${current.btnBg} vocab-notification-card__action`}>
                        {t("tenant.games.vocabulary.session.next")}
                    </button>
                )}
            </div>
        </div>
    );
};

type Props = {
    currentQuestionNumber: number;
    totalQuestions: number;
    selectedCategoryLabel: string;
    selectedDay: number;
    currentStreak: number;
    timeRemaining: number;
    timeLimit: number;
    countdownState: "yellow" | "green" | null;
    promptText: string;
    promptPhonetic: string | null;
    promptDirection: "ltr" | "rtl";
    answerDirection: "ltr" | "rtl";
    practiceOptions: VocabularyOption[];
    selectedOption: number | null;
    isAnswerLocked: boolean;
    feedbackState: VocabularyFeedbackState;
    onLeave: () => void;
    onSelect: (index: number) => void;
    onContinue: () => void;
};

const VocabularyPracticeScreen: React.FC<Props> = ({
    currentQuestionNumber,
    totalQuestions,
    selectedCategoryLabel,
    selectedDay,
    currentStreak,
    timeRemaining,
    timeLimit,
    countdownState,
    promptText,
    promptPhonetic,
    promptDirection,
    answerDirection,
    practiceOptions,
    selectedOption,
    isAnswerLocked,
    feedbackState,
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
                    modeLabel={`${selectedCategoryLabel} • ${t("tenant.games.vocabulary.setup.day_value", { day: selectedDay })}`}
                    onLeave={onLeave}
                />
            </Card.Header>

            <Card.Body className="vocab-practice-body">
                <GameTimerProgress
                    timeRemaining={timeRemaining}
                    timeLimit={timeLimit}
                    className="mb-3"
                />

                <div className="vocab-practice-prompt">
                    <div className="vocab-practice-prompt-card group">
                        <div className="vocab-prompt-gradient-top"></div>
                        <p className="vocab-prompt-label">{t("tenant.games.vocabulary.session.translate_prompt")}</p>
                        <h2 className={`vocab-prompt-text ${promptDirection === "rtl" ? "vocab-prompt-text--rtl" : ""}`} dir={promptDirection}>
                            {promptText}
                        </h2>
                        {promptPhonetic && (
                            <h4 className="text-muted fw-normal mt-2 vocab-practice-phonetic">
                                {promptPhonetic}
                            </h4>
                        )}
                    </div>
                </div>

                <div className="vocab-options-container">
                    <p className="vocab-option-title">Choose the correct answer</p>
                    <div className="d-flex flex-column">
                        {practiceOptions.map((opt, index) => {
                            const isSelected = selectedOption === index;

                            // To properly lose focus and avoid mobile sticky issue
                            const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                                e.currentTarget.blur();
                                onSelect(index);
                            };

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={handleClick}
                                    disabled={feedbackState.show || isAnswerLocked || countdownState !== null}
                                    className={`vocab-option-btn-v2 ${isSelected ? "selected" : ""} d-flex align-items-center justify-content-between game-touch-manipulation`}
                                    dir="ltr"
                                >
                                    <div className={`d-flex align-items-center flex-grow-1 ${answerDirection === "rtl" ? "flex-row-reverse text-end" : "text-start"} gap-3`}>
                                        <span className="fw-bold">{opt.text}</span>
                                        {opt.phonetic && (
                                            <span className="text-muted opacity-75 fw-normal small vocab-option-phonetic">{opt.phonetic}</span>
                                        )}
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

                <NotificationModal
                    feedbackState={feedbackState}
                    onNext={onContinue}
                />
            </Card.Body>
        </Card>
    );
};

export default VocabularyPracticeScreen;
