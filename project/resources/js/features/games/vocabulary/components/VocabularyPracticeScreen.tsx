import React from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameCountdownOverlay from "../../shared/components/GameCountdownOverlay";
import GameSessionHeader from "../../shared/components/GameSessionHeader";
import GameTimerProgress from "../../shared/components/GameTimerProgress";

import QuizModal from "./QuizModal";

type Props = {
    practiceIndex: number;
    practiceQueueLength: number;
    selectedCategoryLabel: string;
    selectedDay: number;
    currentStreak: number;
    timeRemaining: number;
    timeLimit: number;
    countdownState: "yellow" | "green" | null;
    promptText: string;
    promptDirection: "ltr" | "rtl";
    answerDirection: "ltr" | "rtl";
    practiceOptions: string[];
    selectedOption: number | null;
    correctOption: number | null;
    isAnswerLocked: boolean;
    onLeave: () => void;
    onSelect: (index: number) => void;
};

const VocabularyPracticeScreen: React.FC<Props> = ({
    practiceIndex,
    practiceQueueLength,
    selectedCategoryLabel,
    selectedDay,
    currentStreak,
    timeRemaining,
    timeLimit,
    countdownState,
    promptText,
    promptDirection,
    answerDirection,
    practiceOptions,
    selectedOption,
    correctOption,
    isAnswerLocked,
    onLeave,
    onSelect,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="border-0 shadow-sm h-100 d-flex flex-column vocab-practice-card position-relative">
            <GameCountdownOverlay countdownState={countdownState} />
            
            <Card.Header className="bg-transparent border-0 pb-0">
                <GameSessionHeader
                    currentQuestion={practiceIndex + 1}
                    totalQuestions={practiceQueueLength}
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
                    <div className="rounded-3 border p-4 text-center mb-3">
                        <div className="text-muted small mb-2">{t("tenant.games.vocabulary.session.translate_prompt")}</div>
                        <div className="display-6 fw-bold" dir={promptDirection} style={{ textAlign: promptDirection === "rtl" ? "right" : "center" }}>
                            {promptText}
                        </div>
                    </div>
                </div>

                <QuizModal
                    question={t("tenant.games.vocabulary.session.quiz_question")}
                    options={practiceOptions}
                    selectedIndex={selectedOption}
                    correctIndex={correctOption}
                    disabled={isAnswerLocked || countdownState !== null}
                    onSelect={onSelect}
                    direction={answerDirection}
                    className="vocab-practice-options"
                />
            </Card.Body>
        </Card>
    );
};

export default VocabularyPracticeScreen;
