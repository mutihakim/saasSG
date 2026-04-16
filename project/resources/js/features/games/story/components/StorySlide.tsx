import React from "react";

import type { StorySlide } from "@/features/games/shared/types";

type Props = {
    slide: StorySlide;
    totalSlides: number;
    currentIndex: number;
};

const StorySlideView: React.FC<Props> = ({
    slide,
    totalSlides,
    currentIndex,
}) => {
    return (
        <div className="story-slide text-center py-4">
            <div className="mb-3">
                <span className="badge bg-secondary">
                    {currentIndex + 1} / {totalSlides}
                </span>
            </div>
            {slide.imageUrl && (
                <img
                    src={slide.imageUrl}
                    alt={slide.imageDescription}
                    className="img-fluid rounded mb-3 game-story-slide__image"
                />
            )}
            <p className="fs-5 px-3">{slide.text}</p>
            <p className="text-muted small fst-italic">
                🎨 {slide.imageDescription}
            </p>
        </div>
    );
};

export default StorySlideView;
