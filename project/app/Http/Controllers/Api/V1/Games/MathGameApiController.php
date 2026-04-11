<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MathGameApiController extends Controller
{
    use ApiResponder;

    private const MASTERED_STREAK_THRESHOLD = 8;

    public function config(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        return $this->ok([
            'config' => [
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
                'time_limit_options' => [10, 15, 20, 30, 45, 60],
                'mastered_streak_threshold' => self::MASTERED_STREAK_THRESHOLD,
            ],
        ]);
    }

    public function mastered(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        $validated = $request->validate([
            'operator' => ['nullable', 'string', Rule::in(['+', '-', '*', '/'])],
        ]);

        $query = DB::table('tenant_game_math_stats')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('max_streak_benar', '>=', self::MASTERED_STREAK_THRESHOLD)
            ->orderBy('operator')
            ->orderBy('angka_pilihan')
            ->orderBy('angka_random');

        if (!empty($validated['operator'])) {
            $query->where('operator', $validated['operator']);
        }

        $pairs = $query->get([
            'operator',
            'angka_pilihan',
            'angka_random',
            'max_streak_benar',
        ])->map(static fn ($row) => [
            'operator' => (string) $row->operator,
            'angka_pilihan' => (int) $row->angka_pilihan,
            'angka_random' => (int) $row->angka_random,
            'max_streak_benar' => (int) $row->max_streak_benar,
        ])->values();

        return $this->ok(['pairs' => $pairs]);
    }

    public function stats(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        $data = $request->validate([
            'pairs' => ['required', 'array', 'min:1', 'max:200'],
            'pairs.*.operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'pairs.*.angka_pilihan' => ['required', 'integer', 'min:1', 'max:999'],
            'pairs.*.angka_random' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        $rows = DB::table('tenant_game_math_stats')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where(function ($query) use ($data) {
                foreach ($data['pairs'] as $pair) {
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
            $stats[$key] = [
                'operator' => (string) $row->operator,
                'angka_pilihan' => (int) $row->angka_pilihan,
                'angka_random' => (int) $row->angka_random,
                'jumlah_benar' => (int) $row->jumlah_benar,
                'jumlah_salah' => (int) $row->jumlah_salah,
                'current_streak_benar' => (int) $row->current_streak_benar,
                'max_streak_benar' => (int) $row->max_streak_benar,
                'mastered' => (int) $row->max_streak_benar >= self::MASTERED_STREAK_THRESHOLD,
            ];
        }

        return $this->ok(['stats' => $stats]);
    }

    public function attempt(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        $data = $request->validate([
            'operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'angka_pilihan' => ['required', 'integer', 'min:1', 'max:999'],
            'angka_random' => ['required', 'integer', 'min:0', 'max:999'],
            'is_correct' => ['required', 'boolean'],
            'current_streak' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);

        $now = now();

        $stats = DB::transaction(function () use ($tenant, $member, $data, $now) {
            $existing = DB::table('tenant_game_math_stats')
                ->where('tenant_id', $tenant->id)
                ->where('member_id', $member->id)
                ->where('operator', $data['operator'])
                ->where('angka_pilihan', $data['angka_pilihan'])
                ->where('angka_random', $data['angka_random'])
                ->lockForUpdate()
                ->first();

            $isCorrect = (bool) $data['is_correct'];
            $inputStreak = (int) $data['current_streak'];

            if ($existing) {
                $jumlahBenar = (int) $existing->jumlah_benar + ($isCorrect ? 1 : 0);
                $jumlahSalah = (int) $existing->jumlah_salah + ($isCorrect ? 0 : 1);
                $currentStreak = $isCorrect ? $inputStreak : 0;
                $maxStreak = max((int) $existing->max_streak_benar, $currentStreak);

                DB::table('tenant_game_math_stats')
                    ->where('id', $existing->id)
                    ->update([
                        'jumlah_benar' => $jumlahBenar,
                        'jumlah_salah' => $jumlahSalah,
                        'current_streak_benar' => $currentStreak,
                        'max_streak_benar' => $maxStreak,
                        'last_played_at' => $now,
                        'updated_at' => $now,
                    ]);
            } else {
                $jumlahBenar = $isCorrect ? 1 : 0;
                $jumlahSalah = $isCorrect ? 0 : 1;
                $currentStreak = $isCorrect ? $inputStreak : 0;
                $maxStreak = $currentStreak;

                DB::table('tenant_game_math_stats')->insert([
                    'tenant_id' => $tenant->id,
                    'member_id' => $member->id,
                    'operator' => $data['operator'],
                    'angka_pilihan' => $data['angka_pilihan'],
                    'angka_random' => $data['angka_random'],
                    'jumlah_benar' => $jumlahBenar,
                    'jumlah_salah' => $jumlahSalah,
                    'current_streak_benar' => $currentStreak,
                    'max_streak_benar' => $maxStreak,
                    'last_played_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            return [
                'jumlah_benar' => $jumlahBenar,
                'jumlah_salah' => $jumlahSalah,
                'current_streak_benar' => $currentStreak,
                'max_streak_benar' => $maxStreak,
            ];
        });

        return $this->ok([
            'stats' => [
                ...$stats,
                'mastered' => $stats['max_streak_benar'] >= self::MASTERED_STREAK_THRESHOLD,
            ],
        ]);
    }

    public function finish(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        $data = $request->validate([
            'operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'game_mode' => ['required', 'string', Rule::in(['mencariC', 'mencariB'])],
            'number_range' => ['required', 'integer', 'min:1', 'max:999'],
            'random_range' => ['nullable', 'integer', 'min:1', 'max:999'],
            'question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'time_limit' => ['required', 'integer', 'min:1', 'max:300'],
            'correct_count' => ['required', 'integer', 'min:0', 'max:200'],
            'wrong_count' => ['required', 'integer', 'min:0', 'max:200'],
            'best_streak' => ['required', 'integer', 'min:0', 'max:200'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:7200'],
            'started_at' => ['nullable', 'date'],
            'finished_at' => ['nullable', 'date'],
            'summary' => ['nullable', 'array'],
        ]);

        $sessionId = (string) Str::ulid();
        $scorePercent = round(((int) $data['correct_count'] / max(1, (int) $data['question_count'])) * 100, 2);

        DB::table('tenant_game_sessions')->insert([
            'id' => $sessionId,
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'game_slug' => 'math',
            'operator' => $data['operator'],
            'game_mode' => $data['game_mode'],
            'number_range' => $data['number_range'],
            'random_range' => $data['random_range'] ?? null,
            'question_count' => $data['question_count'],
            'time_limit_seconds' => $data['time_limit'],
            'correct_count' => $data['correct_count'],
            'wrong_count' => $data['wrong_count'],
            'best_streak' => $data['best_streak'],
            'score_percent' => $scorePercent,
            'duration_seconds' => $data['duration_seconds'],
            'summary' => isset($data['summary']) ? json_encode($data['summary']) : null,
            'started_at' => $data['started_at'] ?? null,
            'finished_at' => $data['finished_at'] ?? now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->ok([
            'session' => [
                'id' => $sessionId,
                'score_percent' => $scorePercent,
            ],
        ], 201);
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $limit = (int) ($validated['limit'] ?? 20);

        $sessions = DB::table('tenant_game_sessions')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('game_slug', 'math')
            ->orderByDesc('finished_at')
            ->limit($limit)
            ->get([
                'id',
                'operator',
                'game_mode',
                'number_range',
                'random_range',
                'question_count',
                'time_limit_seconds',
                'correct_count',
                'wrong_count',
                'best_streak',
                'score_percent',
                'duration_seconds',
                'started_at',
                'finished_at',
            ])->map(static fn ($row) => [
                'id' => (string) $row->id,
                'operator' => (string) $row->operator,
                'game_mode' => (string) $row->game_mode,
                'number_range' => (int) $row->number_range,
                'random_range' => $row->random_range !== null ? (int) $row->random_range : null,
                'question_count' => (int) $row->question_count,
                'time_limit_seconds' => (int) $row->time_limit_seconds,
                'correct_count' => (int) $row->correct_count,
                'wrong_count' => (int) $row->wrong_count,
                'best_streak' => (int) $row->best_streak,
                'score_percent' => (float) $row->score_percent,
                'duration_seconds' => (int) $row->duration_seconds,
                'started_at' => $row->started_at,
                'finished_at' => $row->finished_at,
            ])->values();

        return $this->ok(['sessions' => $sessions]);
    }

    private function resolveMember(Request $request, Tenant $tenant): ?TenantMember
    {
        $member = $request->attributes->get('currentTenantMember');

        if (!$member instanceof TenantMember) {
            return null;
        }

        if ((int) $member->tenant_id !== (int) $tenant->id) {
            return null;
        }

        return $member;
    }
}
