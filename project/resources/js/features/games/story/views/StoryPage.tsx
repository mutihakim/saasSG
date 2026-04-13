import React from "react";

import GamesShellLayout from "@/layouts/GamesShellLayout";

const StoryPage: React.FC = () => {
    return (
        <GamesShellLayout title="Dongeng Teladan">
            <div className="games-shell__game-area">
                {/* TODO: AI story generation and story slides */}
                <p>Dongeng Teladan — Coming Soon</p>
            </div>
        </GamesShellLayout>
    );
};

(StoryPage as any).layout = null;

export default StoryPage;
