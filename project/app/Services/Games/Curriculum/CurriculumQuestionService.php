<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\GameCurriculumQuestion;
use App\Models\Games\GameCurriculumUnit;
use App\Models\Tenant\Tenant;
use Illuminate\Support\Facades\DB;

class CurriculumQuestionService
{
    public function listQuestions(Tenant $tenant, GameCurriculumUnit $unit): array
    {
        return $this->queryVisibleQuestions($tenant, $unit)
            ->orderBy('difficulty_order')
            ->orderBy('id')
            ->get()
            ->map(fn (GameCurriculumQuestion $question) => $this->serializeQuestion($question))
            ->all();
    }

    public function fetchQuestions(Tenant $tenant, GameCurriculumUnit $unit, int $limit): array
    {
        return $this->queryVisibleQuestions($tenant, $unit)
            ->inRandomOrder()
            ->limit($limit)
            ->get()
            ->map(fn (GameCurriculumQuestion $question) => $this->serializeQuestion($question))
            ->all();
    }

    public function findVisibleQuestion(Tenant $tenant, int $questionId): ?GameCurriculumQuestion
    {
        return GameCurriculumQuestion::query()
            ->where('id', $questionId)
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })
            ->first();
    }

    public function scoreAnswer(GameCurriculumQuestion $question, string $selectedAnswer): array
    {
        $normalizedAnswer = trim($selectedAnswer);
        $isCorrect = strcasecmp($normalizedAnswer, trim((string) $question->correct_answer)) === 0;

        return [
            'question_id' => (int) $question->id,
            'is_correct' => $isCorrect,
            'selected_answer' => $normalizedAnswer,
            'correct_answer' => (string) $question->correct_answer,
            'points' => $isCorrect ? (int) $question->points : 0,
        ];
    }

    public function createQuestion(Tenant $tenant, GameCurriculumUnit $unit, array $data): GameCurriculumQuestion
    {
        $options = array_values($data['options']);
        $this->assertValidOptions($options, (string) $data['correct_answer']);

        return GameCurriculumQuestion::create([
            'tenant_id' => $tenant->id,
            'curriculum_unit_id' => $unit->id,
            'question_key' => $data['question_key'] ?? null,
            'question_text' => $data['question_text'],
            'options' => $options,
            'correct_answer' => $data['correct_answer'],
            'question_type' => $data['question_type'] ?? 'multiple_choice',
            'points' => $data['points'] ?? 10,
            'difficulty_order' => $data['difficulty_order'] ?? 0,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function updateQuestion(GameCurriculumQuestion $question, array $data): ?GameCurriculumQuestion
    {
        $options = array_values($data['options']);
        $this->assertValidOptions($options, (string) $data['correct_answer']);

        $updated = GameCurriculumQuestion::query()
            ->where('id', $question->id)
            ->where('row_version', $data['row_version'])
            ->update([
                'question_key' => $data['question_key'] ?? null,
                'question_text' => $data['question_text'],
                'options' => $options,
                'correct_answer' => $data['correct_answer'],
                'question_type' => $data['question_type'] ?? 'multiple_choice',
                'points' => $data['points'] ?? 10,
                'difficulty_order' => $data['difficulty_order'] ?? 0,
                'metadata' => $data['metadata'] ?? null,
                'row_version' => DB::raw('row_version + 1'),
                'updated_at' => now(),
            ]);

        return $updated ? $question->fresh() : null;
    }

    public function serializeQuestion(GameCurriculumQuestion $question): array
    {
        return [
            'id' => (int) $question->id,
            'curriculum_unit_id' => (int) $question->curriculum_unit_id,
            'tenant_id' => $question->tenant_id !== null ? (int) $question->tenant_id : null,
            'question_key' => $question->question_key,
            'question_text' => (string) $question->question_text,
            'options' => array_values($question->options ?? []),
            'correct_answer' => (string) $question->correct_answer,
            'question_type' => (string) $question->question_type,
            'points' => (int) $question->points,
            'difficulty_order' => (int) $question->difficulty_order,
            'metadata' => $question->metadata,
            'row_version' => (int) $question->row_version,
        ];
    }

    private function queryVisibleQuestions(Tenant $tenant, GameCurriculumUnit $unit)
    {
        return GameCurriculumQuestion::query()
            ->where('curriculum_unit_id', $unit->id)
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            });
    }

    public function assertValidOptions(array $options, string $correctAnswer): void
    {
        $normalized = collect($options)
            ->map(fn ($option) => trim((string) $option))
            ->filter(fn (string $option) => $option !== '')
            ->values();

        if ($normalized->count() < 4) {
            throw new \InvalidArgumentException('Each question must have at least 4 non-empty options.');
        }

        if ($normalized->unique(fn (string $option) => mb_strtolower($option))->count() !== $normalized->count()) {
            throw new \InvalidArgumentException('Question options must be unique.');
        }

        if (! $normalized->contains(fn (string $option) => strcasecmp($option, trim($correctAnswer)) === 0)) {
            throw new \InvalidArgumentException('Correct answer must be present in options.');
        }
    }
}
