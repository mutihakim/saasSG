<?php

namespace App\Services\Games;

use Illuminate\Database\Eloquent\Model;

class GameSessionService
{
    /**
     * @param  class-string<Model>  $sessionModelClass
     */
    public function record(string $sessionModelClass, array $attributes): array
    {
        /** @var Model $session */
        $session = new $sessionModelClass();

        $questionCount = (int) ($attributes['question_count'] ?? 0);
        $correctCount = (int) ($attributes['correct_count'] ?? 0);

        $attributes['score_percent'] = $this->calculateScorePercent($correctCount, $questionCount);
        $attributes['finished_at'] = $attributes['finished_at'] ?? now();

        $session->fill($attributes);
        $session->save();

        return [
            'id' => (string) $session->getKey(),
            'score_percent' => (float) $session->getAttribute('score_percent'),
        ];
    }

    public function calculateScorePercent(int $correctCount, int $questionCount): float
    {
        return round(($correctCount / max(1, $questionCount)) * 100, 2);
    }
}
