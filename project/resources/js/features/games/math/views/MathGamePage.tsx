import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import GameFeedbackPopup from "../../shared/components/GameFeedbackPopup";
import MathGameLayout from "../components/MathGameLayout";
import MathConfigState from "../components/math-game/MathConfigState";
import MathMemoryTestDialog from "../components/math-game/MathMemoryTestDialog";
import MathSessionCard from "../components/math-game/MathSessionCard";
import MathSetupScreen from "../components/math-game/MathSetupScreen";
import MathSummaryCard from "../components/math-game/MathSummaryCard";
import { useMathGameController } from "../hooks/useMathGameController";
import type { MathGameMember } from "../types";

type MathGamePageProps = {
    member?: MathGameMember | null;
};

const MathGamePage: React.FC<MathGamePageProps> = ({ member }) => {
    const { t } = useTranslation();
    const game = useMathGameController();

    const currentQuestionNumber = Math.min(game.currentIndex + 1, game.questions.length || 1);

    const memberName = useMemo(() => member?.full_name ?? member?.name ?? undefined, [member]);

    const startMemoryTest = () => {
        game.setShowMemoryTestDialog(false);
        if (game.setup) {
            void game.runStartGame(game.setup, true);
        }
    };

    return (
        <MathGameLayout
            title={t("tenant.games.math.title")}
            menuKey="main"
            memberName={memberName}
            isSessionActive={game.isSessionActive}
            onLeavingSession={game.persistPartialSessionOnLeave}
        >
            <GameFeedbackPopup
                show={game.feedbackState.show}
                isCorrect={game.feedbackState.isCorrect}
                message={game.feedbackState.message}
                correctAnswer={game.feedbackState.correctAnswer}
                onDone={game.handleFeedbackDone}
                duration={1200}
            />

            <MathMemoryTestDialog
                show={game.showMemoryTestDialog}
                onClose={() => game.setShowMemoryTestDialog(false)}
                onStart={startMemoryTest}
            />

            <div className={game.isSessionActive ? "h-100" : "game-setup-card h-100"}>
                <div className={game.isSessionActive ? "h-100" : "game-setup-content"}>
                    <MathConfigState
                        isLoading={game.isLoading}
                        loadFailed={game.loadFailed}
                        onRetry={() => void game.loadConfig()}
                    />

                    {!game.isLoading && !game.loadFailed && game.setup && !game.hasRunningSession && game.screen === "setup" && (
                        <MathSetupScreen
                            setup={game.setup}
                            rangeOptions={game.rangeOptions}
                            operatorMeta={game.operatorMeta}
                            isStarting={game.isStarting}
                            setSetup={game.setSetup}
                            onStart={(setup) => void game.runStartGame(setup)}
                        />
                    )}

                    {game.isSessionActive && game.currentQuestion && game.setup && (
                        <MathSessionCard
                            currentQuestion={game.currentQuestion}
                            currentQuestionNumber={currentQuestionNumber}
                            setup={game.setup}
                            userAnswer={game.userAnswer}
                            isCorrect={game.isCorrect}
                            timeRemaining={game.timeRemaining}
                            isLocked={game.isLocked}
                            isCountdownActive={game.isCountdownActive}
                            countdownState={game.countdownState}
                            getCurrentStreak={game.getCurrentStreak}
                            onDigit={game.inputDigit}
                            onDelete={game.deleteDigit}
                            onSubmit={() => game.submitAnswer()}
                            onLeave={game.persistPartialSessionOnLeave}
                        />
                    )}

                    {game.isFinished && game.hasRunningSession && (
                        <MathSummaryCard
                            attempts={game.attempts}
                            result={game.result}
                            summaryStats={game.summaryStats}
                            onChangeSetup={() => {
                                game.reset();
                                game.setScreen("setup");
                            }}
                            onPlayAgain={() => {
                                if (game.setup) {
                                    void game.runStartGame(game.setup);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </MathGameLayout>
    );
};

(MathGamePage as any).layout = null;

export default MathGamePage;
