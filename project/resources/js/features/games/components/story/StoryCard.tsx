import React from "react";

import type { GeneratedStory } from "../../types";

type Props = {
    story: GeneratedStory;
    onSelect: (id: string) => void;
};

const StoryCard: React.FC<Props> = ({ story, onSelect }) => {
    return (
        <div
            className="card border-0 shadow-sm h-100"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(story.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(story.id);
            }}
        >
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title fw-semibold mb-0">{story.title}</h6>
                    {story.isFavorite && (
                        <i className="ri-heart-fill text-danger fs-5"></i>
                    )}
                </div>
                <p className="card-text text-muted small mb-2">{story.summary}</p>
                <div className="d-flex gap-2">
                    <span className="badge bg-primary-subtle text-primary">
                        {story.source}
                    </span>
                    <span className="badge bg-secondary-subtle text-secondary">
                        {story.theme}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StoryCard;
