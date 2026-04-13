import React from "react";
import { Badge, Button } from "react-bootstrap";

type GameSessionHeaderProps = {
    currentQuestion: number;
    totalQuestions: number;
    streak: number;
    timeRemaining: number;
    modeLabel?: string;
    onLeave?: () => void;
    leaveButtonLabel?: string;
};

const GameSessionHeader: React.FC<GameSessionHeaderProps> = ({
    currentQuestion,
    totalQuestions,
    streak,
    timeRemaining,
    modeLabel,
    onLeave,
    leaveButtonLabel = "Keluar Sesi",
}) => {
    return (
        <div className="game-session-header d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div className="d-flex align-items-center gap-2">
                <Badge bg="soft-primary" text="primary">
                    Soal {currentQuestion}/{totalQuestions}
                </Badge>
                
                {modeLabel && (
                    <Badge bg="soft-info" text="info">
                        {modeLabel}
                    </Badge>
                )}

                <Badge bg="soft-success" text="success">
                    <i className="ri-fire-line me-1" />
                    Streak: {streak}
                </Badge>

                <Badge bg={timeRemaining <= 3 ? "danger" : "warning"}>
                    {timeRemaining}s
                </Badge>
            </div>

            {onLeave && (
                <Button variant="outline-secondary" size="sm" onClick={onLeave}>
                    {leaveButtonLabel}
                </Button>
            )}
        </div>
    );
};

export default GameSessionHeader;
