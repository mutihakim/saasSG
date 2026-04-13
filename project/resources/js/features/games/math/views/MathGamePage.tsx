import React, { useMemo } from "react";
import { Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import GameFeedbackPopup from "../../shared/components/GameFeedbackPopup";
import MathGameLayout from "../components/MathGameLayout";
import MathConfigState from "../components/math-game/MathConfigState";
import MathMemoryTestDialog from "../components/math-game/MathMemoryTestDialog";
import MathOperatorSelectScreen from "../components/math-game/MathOperatorSelectScreen";
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

            <div className={`math-game-layout__scroll${game.isSessionActive ? " math-game-layout__scroll--session" : ""}`}>
                <div className={`math-game${game.isSessionActive ? " math-game--session" : ""}`}>
                    <Row className="justify-content-center">
                        <Col xxl={10}>
                            <MathConfigState
                                isLoading={game.isLoading}
                                loadFailed={game.loadFailed}
                                onRetry={() => void game.loadConfig()}
                            />

                            {!game.isLoading && !game.loadFailed && game.setup && !game.hasRunningSession && game.screen === "operator" && (
                                <MathOperatorSelectScreen
                                    config={game.mathConfig}
                                    operatorMeta={game.operatorMeta}
                                    onSelect={game.handleOperatorSelect}
                                />
                            )}

                            {!game.isLoading && !game.loadFailed && game.setup && !game.hasRunningSession && game.screen === "setup" && (
                                <MathSetupScreen
                                    setup={game.setup}
                                    rangeOptions={game.rangeOptions}
                                    operatorMeta={game.operatorMeta}
                                    isStarting={game.isStarting}
                                    setSetup={game.setSetup}
                                    onBack={() => game.setScreen("operator")}
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
                        </Col>
                    </Row>
                </div>
            </div>
        </MathGameLayout>
    );
};

export default MathGamePage;
