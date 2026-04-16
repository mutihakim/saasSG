import React from "react";

import type { GameDefinition } from "../types";

type Props = {
    game: GameDefinition;
    onPress: (slug: string) => void;
};

const GameCard: React.FC<Props> = ({ game, onPress }) => {
    return (
        <div
            className="card border-0 shadow-sm h-100 game-card"
            role="button"
            tabIndex={0}
            onClick={() => onPress(game.slug)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPress(game.slug);
                }
            }}
        >
            <div className="card-body text-center p-3">
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 game-card__icon"
                >
                    <i className={`${game.icon} fs-4`}></i>
                </div>
                <h6 className="card-title fw-semibold mb-1">{game.name}</h6>
                <p className="card-text text-muted small mb-0">
                    {game.description}
                </p>
            </div>
        </div>
    );
};

export default GameCard;
