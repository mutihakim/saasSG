import React from "react";

import GamesShellLayout from "@/layouts/GamesShellLayout";

const TahfizPage: React.FC = () => {
    return (
        <GamesShellLayout title="Alat Bantu Tahfiz" preventExit>
            <div className="games-shell__game-area">
                {/* TODO: Surah selection, audio player, ayat highlighting */}
                <p>Tahfiz Helper — Coming Soon</p>
            </div>
        </GamesShellLayout>
    );
};

(TahfizPage as any).layout = null;

export default TahfizPage;
