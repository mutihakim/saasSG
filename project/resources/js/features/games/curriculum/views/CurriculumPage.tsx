import React from "react";
import { useTranslation } from "react-i18next";

import CurriculumLayout from "../components/CurriculumLayout";
import CurriculumPracticeScreen from "../components/CurriculumPracticeScreen";
import CurriculumSetupScreen from "../components/CurriculumSetupScreen";
import CurriculumSummaryCard from "../components/CurriculumSummaryCard";
import useCurriculumGameController from "../hooks/useCurriculumGameController";
import type { CurriculumPageMember } from "../types";

type Props = {
    member?: CurriculumPageMember;
};

const CurriculumPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const game = useCurriculumGameController();

    const isUILayoutActive = game.phase === "practice" || game.phase === "summary";

    return (
        <CurriculumLayout
            title={t("tenant.games.curriculum.title")}
            menuKey="main"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll={false}
            isSessionActive={game.isSessionActive}
        >
            <div className={`math-game-layout__scroll${isUILayoutActive ? " math-game-layout__scroll--session" : ""}`}>
                <div className={`math-game${isUILayoutActive ? " math-game--session" : ""}`}>
                    {game.phase === "setup" && (
                        <CurriculumSetupScreen
                            units={game.units}
                            selectedUnitId={game.selectedUnitId}
                            questionCount={game.questionCount}
                            timeLimit={game.timeLimit}
                            isLoading={game.isLoadingConfig}
                            isStartingSession={game.isStartingSession}
                            onUnitChange={game.setSelectedUnitId}
                            onStart={() => void game.startSession()}
                        />
                    )}

                    {game.phase === "practice" && game.currentQuestion && game.sessionUnit && (
                        <CurriculumPracticeScreen
                            currentQuestionNumber={game.currentQuestionNumber}
                            totalQuestions={game.totalQuestions}
                            currentStreak={game.currentStreak}
                            timeRemaining={game.timeRemaining}
                            timeLimit={game.timeLimit}
                            countdownState={game.countdownState}
                            currentQuestion={game.currentQuestion}
                            selectedOption={game.selectedOption}
                            isAnswerLocked={game.isAnswerLocked}
                            feedbackState={game.feedbackState}
                            sessionUnit={game.sessionUnit}
                            onLeave={game.leaveToSetup}
                            onSelect={(index) => {
                                void game.submitPracticeAnswer(index);
                            }}
                            onContinue={game.continuePractice}
                        />
                    )}

                    {game.phase === "summary" && (
                        <div className="vocab-summary-scroll">
                            <CurriculumSummaryCard
                                attempts={game.attempts}
                                scorePercent={game.scorePercent}
                                correctCount={game.correctCount}
                                bestStreak={game.bestStreak}
                                isSavingSummary={game.isSavingSummary}
                                onChangeSetup={game.leaveToSetup}
                                onPlayAgain={() => {
                                    void game.restartPractice();
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </CurriculumLayout>
    );
};

export default CurriculumPage;
