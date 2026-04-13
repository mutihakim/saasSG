import React from "react";
import { Badge, Button, Card } from "react-bootstrap";

import type { VocabularyWordDto } from "../data/api/vocabularyApi";
import { toFlashcardWord } from "../utils/vocabularyGame";

import FlashCard from "./FlashCard";

type Props = {
    currentWord: VocabularyWordDto;
    learnIndex: number;
    totalWords: number;
    selectedCategoryLabel: string;
    selectedDay: number;
    language: "english" | "arabic";
    translationDirection: "id_to_target" | "target_to_id";
    isFlipped: boolean;
    isMastered: boolean;
    onFlip: () => void;
    onPronounce: (text: string, lang: string) => void;
    onPrevious: () => void;
    onNext: () => void;
    onLeave: () => void;
};

const VocabularyLearnScreen: React.FC<Props> = ({
    currentWord,
    learnIndex,
    totalWords,
    selectedCategoryLabel,
    selectedDay,
    language,
    translationDirection,
    isFlipped,
    isMastered,
    onFlip,
    onPronounce,
    onPrevious,
    onNext,
    onLeave,
}) => (
    <Card className="border-0 shadow-sm h-100 d-flex flex-column">
        <Card.Header className="bg-transparent border-0 pb-0 d-flex justify-content-between align-items-center">
            <div className="fw-semibold">
                {selectedCategoryLabel} • Hari {selectedDay}
            </div>
            <Badge bg="soft-primary" text="primary">
                {learnIndex + 1}/{totalWords}
            </Badge>
        </Card.Header>
        <Card.Body className="d-flex flex-column">
            <FlashCard
                word={toFlashcardWord(currentWord)}
                language={language}
                translationDirection={translationDirection}
                isMastered={isMastered}
                isFlipped={isFlipped}
                onFlip={onFlip}
                onPronounce={onPronounce}
            />

            <div className="d-flex justify-content-between mt-3">
                <Button variant="light" disabled={learnIndex <= 0} onClick={onPrevious}>
                    Sebelumnya
                </Button>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={onLeave}>Ubah Setup</Button>
                    <Button variant="primary" onClick={onNext} disabled={learnIndex >= totalWords - 1}>
                        Selanjutnya
                    </Button>
                </div>
            </div>
        </Card.Body>
    </Card>
);

export default VocabularyLearnScreen;
