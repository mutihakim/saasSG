<?php

namespace App\Services\Games;

use App\Models\Games\TenantGameMathSetting;
use App\Models\Games\TenantGameMathStat;
use App\Models\Games\TenantGameSession;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Facades\DB;

class MathGameService
{
    public const MASTERED_STREAK_THRESHOLD = 8;

    public function __construct(private readonly GameSessionService $gameSessionService)
    {
    }

    public function config(): array
    {
        return [
            'operators' => [
                ['value' => '+', 'label' => 'Penjumlahan'],
                ['value' => '-', 'label' => 'Pengurangan'],
                ['value' => '*', 'label' => 'Perkalian'],
                ['value' => '/', 'label' => 'Pembagian'],
            ],
            'modes' => [
                ['value' => 'mencariC', 'label' => 'A op B = ?'],
                ['value' => 'mencariB', 'label' => 'A op ? = C'],
            ],
            'number_options' => range(1, 91, 10),
            'question_count_options' => [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
            'time_limit_options' => [2, 3, 5, 10, 15, 20, 30, 45, 60],
            'mastered_streak_threshold' => self::MASTERED_STREAK_THRESHOLD,
        ];
    }

    public function masteredPairs(Tenant $tenant, TenantMember $member, ?string $operator = null): array
    {
        $thresholds = $this->thresholds($tenant, $member);

        $query = TenantGameMathStat::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id);

        if ($operator !== null && $operator !== '') {
            $threshold = $thresholds[$operator] ?? self::MASTERED_STREAK_THRESHOLD;
            $query->where('operator', $operator)->where('current_streak_benar', '>=', $threshold);
        } else {
            $query->where('current_streak_benar', '>=', min(array_merge(array_values($thresholds), [self::MASTERED_STREAK_THRESHOLD])));
        }

        return $query
            ->orderBy('operator')
            ->orderBy('angka_pilihan')
            ->orderBy('angka_random')
            ->get([
                'operator',
                'angka_pilihan',
                'angka_random',
                'current_streak_benar',
                'max_streak_benar',
            ])
            ->filter(function (TenantGameMathStat $stat) use ($thresholds) {
                $threshold = $thresholds[$stat->operator] ?? self::MASTERED_STREAK_THRESHOLD;

                return $stat->current_streak_benar >= $threshold;
            })
            ->map(static fn (TenantGameMathStat $stat) => [
                'operator' => (string) $stat->operator,
                'angka_pilihan' => (int) $stat->angka_pilihan,
                'angka_random' => (int) $stat->angka_random,
                'max_streak_benar' => (int) $stat->max_streak_benar,
            ])
            ->values()
            ->all();
    }

    public function stats(Tenant $tenant, TenantMember $member, array $pairs): array
    {
        $thresholds = $this->thresholds($tenant, $member);

        $rows = TenantGameMathStat::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where(function ($query) use ($pairs) {
                foreach ($pairs as $pair) {
                    $query->orWhere(function ($inner) use ($pair) {
                        $inner
                            ->where('operator', $pair['operator'])
                            ->where('angka_pilihan', $pair['angka_pilihan'])
                            ->where('angka_random', $pair['angka_random']);
                    });
                }
            })
            ->get([
                'operator',
                'angka_pilihan',
                'angka_random',
                'jumlah_benar',
                'jumlah_salah',
                'current_streak_benar',
                'max_streak_benar',
            ]);

        $stats = [];
        foreach ($rows as $row) {
            $key = "{$row->operator}|{$row->angka_pilihan}|{$row->angka_random}";
            $threshold = $thresholds[$row->operator] ?? self::MASTERED_STREAK_THRESHOLD;
            $stats[$key] = [
                'operator' => (string) $row->operator,
                'angka_pilihan' => (int) $row->angka_pilihan,
                'angka_random' => (int) $row->angka_random,
                'jumlah_benar' => (int) $row->jumlah_benar,
                'jumlah_salah' => (int) $row->jumlah_salah,
                'current_streak_benar' => (int) $row->current_streak_benar,
                'max_streak_benar' => (int) $row->max_streak_benar,
                'mastered' => (int) $row->current_streak_benar >= $threshold,
            ];
        }

        return $stats;
    }

    public function recordAttempt(Tenant $tenant, TenantMember $member, array $data): array
    {
        $threshold = $this->thresholdFor($tenant, $member, $data['operator']);

        $stats = DB::transaction(function () use ($tenant, $member, $data) {
            $stat = TenantGameMathStat::query()
                ->where('tenant_id', $tenant->id)
                ->where('member_id', $member->id)
                ->where('operator', $data['operator'])
                ->where('angka_pilihan', $data['angka_pilihan'])
                ->where('angka_random', $data['angka_random'])
                ->lockForUpdate()
                ->first();

            $isCorrect = (bool) $data['is_correct'];

            if (! $stat) {
                $stat = new TenantGameMathStat([
                    'tenant_id' => $tenant->id,
                    'member_id' => $member->id,
                    'operator' => $data['operator'],
                    'angka_pilihan' => $data['angka_pilihan'],
                    'angka_random' => $data['angka_random'],
                    'jumlah_benar' => 0,
                    'jumlah_salah' => 0,
                    'current_streak_benar' => 0,
                    'max_streak_benar' => 0,
                ]);
            }

            $stat->jumlah_benar += $isCorrect ? 1 : 0;
            $stat->jumlah_salah += $isCorrect ? 0 : 1;
            $stat->current_streak_benar = $isCorrect ? ($stat->current_streak_benar + 1) : 0;
            $stat->max_streak_benar = max($stat->max_streak_benar, $stat->current_streak_benar);
            $stat->last_played_at = now();
            $stat->save();

            return [
                'jumlah_benar' => (int) $stat->jumlah_benar,
                'jumlah_salah' => (int) $stat->jumlah_salah,
                'current_streak_benar' => (int) $stat->current_streak_benar,
                'max_streak_benar' => (int) $stat->max_streak_benar,
            ];
        });

        return [
            ...$stats,
            'mastered' => $stats['current_streak_benar'] >= $threshold,
        ];
    }

    public function finishSession(Tenant $tenant, TenantMember $member, array $data): array
    {
        return $this->gameSessionService->record(TenantGameSession::class, [
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'game_slug' => 'math',
            'metadata' => [
                'operator' => $data['operator'],
                'game_mode' => $data['game_mode'],
                'number_range' => $data['number_range'],
                'random_range' => $data['random_range'] ?? null,
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
            ->where('game_slug', 'math')
            ->orderByDesc('finished_at')
            ->limit($limit)
            ->get([
                'id',
                'metadata',
                'question_count',
                'correct_count',
                'wrong_count',
                'best_streak',
                'score_percent',
                'duration_seconds',
                'started_at',
                'finished_at',
            ])
            ->map(static fn (TenantGameSession $session) => [
                'id' => (string) $session->id,
                'operator' => (string) ($session->metadata['operator'] ?? ''),
                'game_mode' => (string) ($session->metadata['game_mode'] ?? ''),
                'number_range' => (int) ($session->metadata['number_range'] ?? 0),
                'random_range' => isset($session->metadata['random_range']) ? (int) $session->metadata['random_range'] : null,
                'time_limit_seconds' => (int) ($session->metadata['time_limit_seconds'] ?? 0),
                'question_count' => (int) $session->question_count,
                'correct_count' => (int) $session->correct_count,
                'wrong_count' => (int) $session->wrong_count,
                'best_streak' => (int) $session->best_streak,
                'score_percent' => (float) $session->score_percent,
                'duration_seconds' => (int) $session->duration_seconds,
                'started_at' => $session->started_at,
                'finished_at' => $session->finished_at,
            ])
            ->values()
            ->all();
    }

    public function settings(Tenant $tenant, TenantMember $member, ?string $operator = null): array
    {
        $query = TenantGameMathSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id);

        if ($operator !== null && $operator !== '') {
            $query->where('operator', $operator);
        }

        return $query
            ->get(['operator', 'default_mode', 'default_question_count', 'default_time_limit', 'mastered_threshold'])
            ->map(static fn (TenantGameMathSetting $setting) => [
                'operator' => (string) $setting->operator,
                'default_mode' => (string) $setting->default_mode,
                'default_question_count' => (int) $setting->default_question_count,
                'default_time_limit' => (int) $setting->default_time_limit,
                'mastered_threshold' => (int) $setting->mastered_threshold,
            ])
            ->values()
            ->all();
    }

    public function updateSettings(Tenant $tenant, TenantMember $member, array $data): void
    {
        TenantGameMathSetting::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'member_id' => $member->id,
                'operator' => $data['operator'],
            ],
            [
                'default_mode' => $data['default_mode'],
                'default_question_count' => $data['default_question_count'],
                'default_time_limit' => $data['default_time_limit'],
                'mastered_threshold' => $data['mastered_threshold'],
            ]
        );
    }

    private function thresholds(Tenant $tenant, TenantMember $member): array
    {
        return TenantGameMathSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->pluck('mastered_threshold', 'operator')
            ->map(fn ($threshold) => (int) $threshold)
            ->toArray();
    }

    private function thresholdFor(Tenant $tenant, TenantMember $member, string $operator): int
    {
        return (int) (TenantGameMathSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('operator', $operator)
            ->value('mastered_threshold') ?? self::MASTERED_STREAK_THRESHOLD);
    }
}
