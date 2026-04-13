import React from "react";

import type { GamesPageProps } from "../../shared/types";

const GamesIndex: React.FC<GamesPageProps> = ({
    games,
    recentSessions,
    activeMemberId: _activeMemberId,
    financeRoute: _financeRoute,
    demo: _demo,
}) => {
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="mb-0">Games Hub</h4>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <p className="text-muted">
                        Game modules available: {games.length} | Recent sessions:{" "}
                        {recentSessions.length}
                    </p>
                    {/* TODO: Render game cards and session history */}
                </div>
            </div>
        </div>
    );
};

(GamesIndex as any).layout = null;

export default GamesIndex;
