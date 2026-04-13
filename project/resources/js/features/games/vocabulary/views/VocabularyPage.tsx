import React from "react";

import GameFeedbackPopup from "../../shared/components/GameFeedbackPopup";
import VocabularyLayout from "../components/VocabularyLayout";
import VocabularyLearnScreen from "../components/VocabularyLearnScreen";
import VocabularyMemoryTestDialog from "../components/VocabularyMemoryTestDialog";
import VocabularyPracticeScreen from "../components/VocabularyPracticeScreen";
import VocabularySetupScreen from "../components/VocabularySetupScreen";
import VocabularySummaryCard from "../components/VocabularySummaryCard";
import useVocabularyGameController from "../hooks/useVocabularyGameController";
import type { VocabularyPageMember } from "../types";
import { answerDirectionFor, promptDirectionFor, promptTextFor } from "../utils/vocabularyGame";

type PageProps = {
    member?: VocabularyPageMember;
};

const VocabularyPage: React.FC<PageProps> = ({ member }) => {
    const game = useVocabularyGameController();

    return (
        <VocabularyLayout
            title="Belajar Kosakata"
            menuKey="main"
            memberName={member?.full_name ?? member?.name ?? undefined}
            isSessionActive={game.isSessionActive}
            allowPageScroll={false}
        >
            <div className={`math-game-layout__scroll${game.isSessionActive ? " math-game-layout__scroll--session" : ""}`}>
                <div className={`math-game${game.isSessionActive ? " math-game--session" : ""}`}>
                    <GameFeedbackPopup
                        show={game.feedbackState.show}
                        isCorrect={game.feedbackState.isCorrect}
                        isTimedOut={game.feedbackState.isTimedOut}
                        message={game.feedbackState.message}
                        correctAnswer={game.feedbackState.correctAnswer}
                        correctAnswerLabel="Jawaban benar: "
                        onDone={game.handleFeedbackDone}
                        duration={1200}
                    />

                    <VocabularyMemoryTestDialog
                        show={game.showMemoryTestDialog}
                        onClose={() => game.setShowMemoryTestDialog(false)}
                        onStart={() => {
                            game.setShowMemoryTestDialog(false);
                            void game.startPracticeMode(true);
                        }}
                    />

                    {game.isLoadingConfig && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body d-flex align-items-center gap-2 py-4">
                                <div className="spinner-border spinner-border-sm" role="status" />
                                <span>Memuat konfigurasi vocabulary...</span>
                            </div>
                        </div>
                    )}

                    {!game.isLoadingConfig && game.phase === "setup" && (
                        <VocabularySetupScreen
                            language={game.language}
                            mode={game.mode}
                            selectedCategory={game.selectedCategory}
                            selectedDay={game.selectedDay}
                            autoTts={game.autoTts}
                            timeLimit={game.timeLimit}
                            translationDirection={game.translationDirection}
                            daysForCategory={game.daysForCategory}
                            hasCategories={game.hasCategories}
                            hasDaysInSelectedCategory={game.hasDaysInSelectedCategory}
                            categoryOptions={game.categoryOptions}
                            isStartingSession={game.isStartingSession}
                            onLanguageChange={game.setLanguage}
                            onModeChange={game.setMode}
                            onCategorySelect={game.setSelectedCategory}
                            onDayChange={game.setSelectedDay}
                            onAutoTtsChange={game.setAutoTts}
                            onTimeLimitChange={game.setTimeLimit}
                            onTranslationDirectionChange={game.setTranslationDirection}
                            onStart={() => void (game.mode === "learn" ? game.startLearnMode() : game.startPracticeMode())}
                        />
                    )}

                    {!game.isLoadingConfig && game.phase === "learn" && game.currentLearnWord && (
                        <VocabularyLearnScreen
                            currentWord={game.currentLearnWord}
                            learnIndex={game.learnIndex}
                            totalWords={game.dayWords.length}
                            selectedCategoryLabel={game.selectedCategoryLabel}
                            selectedDay={game.selectedDay}
                            language={game.language}
                            translationDirection={game.translationDirection}
                            isFlipped={game.isFlipped}
                            isMastered={game.progressMap[String(game.currentLearnWord.id)]?.is_mastered ?? false}
                            onFlip={() => game.setIsFlipped((prev) => !prev)}
                            onPronounce={game.pronounce}
                            onLeave={game.leaveToSetup}
                            onPrevious={() => {
                                game.setLearnIndex((prev) => Math.max(0, prev - 1));
                                game.setIsFlipped(false);
                            }}
                            onNext={() => {
                                game.setLearnIndex((prev) => Math.min(game.dayWords.length - 1, prev + 1));
                                game.setIsFlipped(false);
                            }}
                        />
                    )}

                    {!game.isLoadingConfig && game.phase === "practice" && game.currentPracticeWord && (
                        <VocabularyPracticeScreen
                            practiceIndex={game.practiceIndex}
                            practiceQueueLength={game.practiceQueue.length}
                            selectedCategoryLabel={game.selectedCategoryLabel}
                            selectedDay={game.selectedDay}
                            currentStreak={game.currentStreak}
                            timeRemaining={game.timeRemaining}
                            timeLimit={game.timeLimit}
                            countdownState={game.countdownState}
                            promptText={promptTextFor(game.currentPracticeWord, game.language, game.translationDirection)}
                            promptDirection={promptDirectionFor(game.language, game.translationDirection)}
                            answerDirection={answerDirectionFor(game.language, game.translationDirection)}
                            practiceOptions={game.practiceOptions}
                            selectedOption={game.selectedOption}
                            correctOption={game.correctOption}
                            isAnswerLocked={game.isAnswerLocked}
                            onLeave={game.leaveToSetup}
                            onSelect={(index) => {
                                void game.submitPracticeAnswer(index);
                            }}
                        />
                    )}

                    {!game.isLoadingConfig && game.phase === "summary" && (
                        <VocabularySummaryCard
                            attempts={game.attempts}
                            scorePercent={game.scorePercent}
                            correctCount={game.correctCount}
                            bestStreak={game.bestStreak}
                            isSavingSummary={game.isSavingSummary}
                            onChangeSetup={game.leaveToSetup}
                            onPlayAgain={() => {
                                void game.startPracticeMode();
                            }}
                        />
                    )}
                </div>
            </div>
        </VocabularyLayout>
    );
};

(VocabularyPage as any).layout = null;

export default VocabularyPage;
