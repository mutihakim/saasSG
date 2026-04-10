import React from "react";

import GamesShellLayout from "@/layouts/GamesShellLayout";

const VocabularyPage: React.FC = () => {
    return (
        <GamesShellLayout title="Belajar Kosakata" preventExit>
            <div className="games-shell__game-area">
                {/* TODO: Vocabulary flashcards and quiz */}
                <p>Vocabulary — Coming Soon</p>
            </div>
        </GamesShellLayout>
    );
};

(VocabularyPage as any).layout = null;

export default VocabularyPage;
