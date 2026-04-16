<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\GameCurriculumUnit;
use App\Models\Games\TenantGameSession;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Games\GameSessionService;

class CurriculumSessionService
{
    public function __construct(private readonly GameSessionService $gameSessionService)
    {
    }

    public function finishSession(Tenant $tenant, TenantMember $member, GameCurriculumUnit $unit, array $data): array
    {
        return $this->gameSessionService->record(TenantGameSession::class, [
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'game_slug' => 'curriculum',
            'metadata' => [
                'unit_id' => $unit->id,
                'subject' => $unit->subject,
                'educational_phase' => $unit->educational_phase,
                'grade' => $unit->grade,
                'semester' => $unit->semester,
                'chapter' => $unit->chapter,
                'time_limit_seconds' => $data['time_limit'],
            ],
            'question_count' => $data['question_count'],
            'correct_count' => $data['correct_count'],
            'wrong_count' => $data['wrong_count'],
            'best_streak' => $data['best_streak'],
            'duration_seconds' => $data['duration_seconds'],
            'summary' => $data['summary'] ?? null,
            'started_at' => $data['started_at'] ?? null,
            'finished_at' => $data['finished_at'] ?? null,
        ]);
    }

    public function history(Tenant $tenant, TenantMember $member, int $limit): array
    {
        return TenantGameSession::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('game_slug', 'curriculum')
            ->orderByDesc('finished_at')
            ->limit($limit)
            ->get()
            ->map(static fn (TenantGameSession $session) => [
                'id' => (string) $session->id,
                'unit_id' => (int) ($session->metadata['unit_id'] ?? 0),
                'subject' => (string) ($session->metadata['subject'] ?? ''),
                'educational_phase' => $session->metadata['educational_phase'] ?? null,
                'grade' => isset($session->metadata['grade']) ? (int) $session->metadata['grade'] : null,
                'semester' => isset($session->metadata['semester']) ? (int) $session->metadata['semester'] : null,
                'chapter' => $session->metadata['chapter'] ?? null,
                'time_limit_seconds' => isset($session->metadata['time_limit_seconds']) ? (int) $session->metadata['time_limit_seconds'] : null,
                'question_count' => (int) $session->question_count,
                'correct_count' => (int) $session->correct_count,
                'wrong_count' => (int) $session->wrong_count,
                'best_streak' => (int) $session->best_streak,
                'score_percent' => (float) $session->score_percent,
                'duration_seconds' => (int) $session->duration_seconds,
                'started_at' => $session->started_at,
                'finished_at' => $session->finished_at,
                'summary' => $session->summary,
            ])
            ->values()
            ->all();
    }
}
