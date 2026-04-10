import React from "react";

import GamesShellLayout from "@/layouts/GamesShellLayout";

const MathGamePage: React.FC = () => {
    return (
        <GamesShellLayout title="Game Matematika" preventExit>
            <div className="games-shell__game-area">
                {/* TODO: Math game content — Numpad, QuestionDisplay, ScoreModal */}
                <p>Math Game — Coming Soon</p>
            </div>
        </GamesShellLayout>
    );
};

(MathGamePage as any).layout = null;

export default MathGamePage;
