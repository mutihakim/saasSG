import React from "react";
import { useTranslation } from "react-i18next";


import VocabularyLayout from "../components/VocabularyLayout";
import VocabularyLearnScreen from "../components/VocabularyLearnScreen";
import VocabularyMemoryTestDialog from "../components/VocabularyMemoryTestDialog";
import VocabularyPracticeScreen from "../components/VocabularyPracticeScreen";
import VocabularySetupScreen from "../components/VocabularySetupScreen";
import VocabularySummaryCard from "../components/VocabularySummaryCard";
import useVocabularyGameController from "../hooks/useVocabularyGameController";
import type { VocabularyPageMember } from "../types";
import { answerDirectionFor, promptDirectionFor, promptPhoneticFor, promptTextFor } from "../utils/vocabularyGame";

type PageProps = {
    member?: VocabularyPageMember;
};

const VocabularyPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const game = useVocabularyGameController();

    return (
        <VocabularyLayout
            title={t("tenant.games.vocabulary.title")}
            menuKey="main"
            memberName={member?.full_name ?? member?.name ?? undefined}
            isSessionActive={game.isSessionActive}
            allowPageScroll={false}
        >
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
                        <span>{t("tenant.games.vocabulary.loading")}</span>
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
                    masteredDaysForCategory={game.masteredDaysForCategory}
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
                    currentQuestionNumber={game.attempts.length + 1}
                    totalQuestions={game.sessionQuestionTarget}
                    selectedCategoryLabel={game.selectedCategoryLabel}
                    selectedDay={game.selectedDay}
                    currentStreak={game.currentStreak}
                    timeRemaining={game.timeRemaining}
                    timeLimit={game.timeLimit}
                    countdownState={game.countdownState}
                    promptText={promptTextFor(game.currentPracticeWord, game.language, game.translationDirection)}
                    promptPhonetic={promptPhoneticFor(game.currentPracticeWord, game.language, game.translationDirection)}
                    promptDirection={promptDirectionFor(game.language, game.translationDirection)}
                    answerDirection={answerDirectionFor(game.language, game.translationDirection)}
                    practiceOptions={game.practiceOptions}
                    selectedOption={game.selectedOption}
                    isAnswerLocked={game.isAnswerLocked}
                    feedbackState={game.feedbackState}
                    onLeave={game.leaveToSetup}
                    onSelect={(index) => {
                        void game.submitPracticeAnswer(index);
                    }}
                    onContinue={game.continuePractice}
                />
            )}

            {!game.isLoadingConfig && game.phase === "summary" && (
                <div className="vocab-summary-scroll">
                    <VocabularySummaryCard
                        attempts={game.attempts}
                        scorePercent={game.scorePercent}
                        correctCount={game.correctCount}
                        bestStreak={game.bestStreak}
                        isSavingSummary={game.isSavingSummary}
                        isLevelMastered={game.isLevelMastered}
                        onChangeSetup={game.leaveToSetup}
                        onPlayAgain={() => {
                            void game.startPracticeMode();
                        }}
                        onStartMemoryTest={() => {
                            void game.startPracticeMode(true);
                        }}
                    />
                </div>
            )}
        </VocabularyLayout>
    );
};

(VocabularyPage as any).layout = null;

export default VocabularyPage;
