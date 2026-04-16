<?php

namespace App\Services\Games;

use App\Models\Games\TenantGameSession;
use App\Models\Games\TenantGameVocabularySetting;
use App\Models\Games\TenantGameVocabularyStat;
use App\Models\Games\TenantGameVocabularyWord;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VocabularyGameService
{
    public const DEFAULT_QUESTION_COUNT = 6;
    public const DEFAULT_MASTERED_THRESHOLD = 8;
    public const DEFAULT_TIME_LIMIT = 8;
    public const DEFAULT_TRANSLATION_DIRECTION = 'id_to_target';

    public function __construct(private readonly GameSessionService $gameSessionService)
    {
    }

    public function config(Tenant $tenant, TenantMember $member): array
    {
        $effectiveWords = $this->effectiveWordsForTenant((int) $tenant->id);
        $effectiveWordIdsByCategoryDay = [];
        foreach ($effectiveWords as $word) {
            $category = (string) $word->kategori;
            $day = (int) $word->hari;
            $effectiveWordIdsByCategoryDay[$category][$day][] = (int) $word->id;
        }

        $categories = collect($effectiveWordIdsByCategoryDay)->map(function (array $days, string $category) {
            $dayList = array_keys($days);
            sort($dayList);

            return [
                'category' => $category,
                'total_days' => count($dayList),
                'days' => array_values(array_map('intval', $dayList)),
            ];
        })->sortBy('category')->values()->all();

        $settings = TenantGameVocabularySetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->get(['language', 'default_mode', 'default_question_count', 'mastered_threshold', 'default_time_limit', 'auto_tts', 'translation_direction'])
            ->mapWithKeys(static fn (TenantGameVocabularySetting $setting) => [
                (string) $setting->language => [
                    'language' => (string) $setting->language,
                    'default_mode' => (string) $setting->default_mode,
                    'default_question_count' => (int) ($setting->default_question_count ?? self::DEFAULT_QUESTION_COUNT),
                    'mastered_threshold' => (int) $setting->mastered_threshold,
                    'default_time_limit' => (int) $setting->default_time_limit,
                    'auto_tts' => (bool) $setting->auto_tts,
                    'translation_direction' => (string) $setting->translation_direction,
                ],
            ])
            ->all();

        $thresholds = collect($settings)
            ->map(fn (array $setting) => (int) $setting['mastered_threshold'])
            ->all();

        $stats = TenantGameVocabularyStat::query()
            ->where('tenant_game_vocabulary_progress.tenant_id', $tenant->id)
            ->where('tenant_game_vocabulary_progress.member_id', $member->id)
            ->whereIn('tenant_game_vocabulary_progress.word_id', $effectiveWords->pluck('id')->all())
            ->get(['language', 'word_id', 'correct_streak']);

        $masteredDays = [];
        $masteredCountByLanguageCategoryDay = [];
        foreach ($stats as $stat) {
            $lang = (string) $stat->language;
            $threshold = $thresholds[$lang] ?? self::DEFAULT_MASTERED_THRESHOLD;

            if ((int) $stat->correct_streak < $threshold) {
                continue;
            }

            $word = $effectiveWords->firstWhere('id', (int) $stat->word_id);
            if (! $word) {
                continue;
            }

            $category = (string) $word->kategori;
            $day = (int) $word->hari;

            if (! isset($masteredCountByLanguageCategoryDay[$lang][$category][$day])) {
                $masteredCountByLanguageCategoryDay[$lang][$category][$day] = 0;
            }

            $masteredCountByLanguageCategoryDay[$lang][$category][$day]++;
        }

        $languages = $stats->pluck('language')
            ->map(fn ($language) => (string) $language)
            ->merge(array_keys($thresholds))
            ->unique()
            ->values()
            ->all();

        foreach ($effectiveWordIdsByCategoryDay as $category => $days) {
            foreach ($days as $day => $wordIds) {
                $total = count($wordIds);
                if ($total === 0) {
                    continue;
                }

                foreach ($languages as $language) {
                    $mastered = (int) ($masteredCountByLanguageCategoryDay[$language][$category][$day] ?? 0);
                    if ($mastered >= $total) {
                        $masteredDays[$language][$category][] = (int) $day;
                    }
                }
            }
        }

        foreach ($masteredDays as $language => $categoriesForLanguage) {
            foreach ($categoriesForLanguage as $category => $days) {
                $uniqueDays = array_values(array_unique(array_map('intval', $days)));
                sort($uniqueDays);
                $masteredDays[$language][$category] = $uniqueDays;
            }
        }

        return [
            'config' => [
                'languages' => [
                    ['value' => 'english', 'label' => 'Inggris'],
                    ['value' => 'arabic', 'label' => 'Arab'],
                    ['value' => 'mandarin', 'label' => 'Mandarin'],
                ],
                'modes' => [
                    ['value' => 'learn', 'label' => 'Learn'],
                    ['value' => 'practice', 'label' => 'Practice'],
                ],
                'directions' => [
                    ['value' => 'id_to_target', 'label' => 'Indonesia -> Bahasa Pilihan'],
                    ['value' => 'target_to_id', 'label' => 'Bahasa Pilihan -> Indonesia'],
                ],
                'categories' => $categories,
                'default_question_count' => self::DEFAULT_QUESTION_COUNT,
                'default_mastered_threshold' => self::DEFAULT_MASTERED_THRESHOLD,
                'default_time_limit' => self::DEFAULT_TIME_LIMIT,
                'mastered_days' => $masteredDays,
            ],
            'settings' => $settings,
        ];
    }

    public function words(Tenant $tenant, TenantMember $member, string $language, string $category, int $day): array
    {
        $words = $this->fetchEffectiveWords((int) $tenant->id, $category, $day);
        $threshold = $this->thresholdFor($tenant, $member, $language);

        $progress = TenantGameVocabularyStat::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('language', $language)
            ->whereIn('word_id', $words->pluck('id')->all())
            ->get(['word_id', 'jumlah_benar', 'jumlah_salah', 'correct_streak', 'max_streak'])
            ->mapWithKeys(static fn (TenantGameVocabularyStat $stat) => [
                (string) $stat->word_id => [
                    'word_id' => (int) $stat->word_id,
                    'jumlah_benar' => (int) $stat->jumlah_benar,
                    'jumlah_salah' => (int) $stat->jumlah_salah,
                    'correct_streak' => (int) $stat->correct_streak,
                    'max_streak' => (int) $stat->max_streak,
                    'is_mastered' => (int) $stat->correct_streak >= $threshold,
                ],
            ])
            ->all();

        return [
            'words' => $words->map(fn (TenantGameVocabularyWord $word) => $this->mapWord($word))->values(),
            'progress' => $progress,
        ];
    }

    public function pool(Tenant $tenant, string $category): array
    {
        return [
            'words' => $this->fetchEffectiveWords((int) $tenant->id, $category, null)
                ->map(fn (TenantGameVocabularyWord $word) => $this->mapWord($word))
                ->values(),
        ];
    }

    public function recordAttempt(Tenant $tenant, TenantMember $member, array $data): array
    {
        $word = TenantGameVocabularyWord::query()
            ->whereKey($data['word_id'])
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenant->id);
            })
            ->first();

        if (! $word) {
            return [];
        }

        $threshold = $this->thresholdFor($tenant, $member, $data['language']);

        return DB::transaction(function () use ($tenant, $member, $data, $word, $threshold) {
            $stat = TenantGameVocabularyStat::query()
                ->where('tenant_id', $tenant->id)
                ->where('member_id', $member->id)
                ->where('word_id', $word->id)
                ->where('language', $data['language'])
                ->lockForUpdate()
                ->first();

            $isCorrect = (bool) $data['is_correct'];

            if (! $stat) {
                $stat = new TenantGameVocabularyStat([
                    'tenant_id' => $tenant->id,
                    'member_id' => $member->id,
                    'word_id' => $word->id,
                    'language' => $data['language'],
                    'jumlah_benar' => 0,
                    'jumlah_salah' => 0,
                    'correct_streak' => 0,
                    'max_streak' => 0,
                    'is_mastered' => false,
                ]);
            }

            $stat->jumlah_benar += $isCorrect ? 1 : 0;
            $stat->jumlah_salah += $isCorrect ? 0 : 1;
            $stat->correct_streak = $isCorrect ? ($stat->correct_streak + 1) : 0;
            $stat->max_streak = max($stat->max_streak, $stat->correct_streak);
            $stat->is_mastered = $stat->correct_streak >= $threshold;
            $stat->last_practiced_at = now();
            $stat->save();

            return [
                'word_id' => (int) $word->id,
                'language' => (string) $data['language'],
                'jumlah_benar' => (int) $stat->jumlah_benar,
                'jumlah_salah' => (int) $stat->jumlah_salah,
                'correct_streak' => (int) $stat->correct_streak,
                'max_streak' => (int) $stat->max_streak,
                'is_mastered' => (bool) $stat->is_mastered,
            ];
        });
    }

    public function findWordForTenant(Tenant $tenant, int $wordId): ?TenantGameVocabularyWord
    {
        return TenantGameVocabularyWord::query()
            ->whereKey($wordId)
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenant->id);
            })
            ->first();
    }

    public function finishSession(Tenant $tenant, TenantMember $member, array $data): array
    {
        return $this->gameSessionService->record(TenantGameSession::class, [
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'game_slug' => 'vocabulary',
            'metadata' => [
                'language' => $data['language'],
                'mode' => $data['mode'],
                'category' => $data['category'],
                'day' => $data['day'],
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

    public function history(Tenant $tenant, TenantMember $member, int $limit, ?string $language = null): array
    {
        $query = TenantGameSession::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('game_slug', 'vocabulary');

        if ($language !== null && $language !== '') {
            $query->where('metadata->language', $language);
        }

        return $query
            ->orderByDesc('finished_at')
            ->limit($limit)
            ->get([
                'id',
                'metadata',
                'summary',
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
                'language' => (string) ($session->metadata['language'] ?? ''),
                'mode' => (string) ($session->metadata['mode'] ?? ''),
                'category' => (string) ($session->metadata['category'] ?? ''),
                'day' => (int) ($session->metadata['day'] ?? 0),
                'question_count' => (int) $session->question_count,
                'correct_count' => (int) $session->correct_count,
                'wrong_count' => (int) $session->wrong_count,
                'best_streak' => (int) $session->best_streak,
                'score_percent' => (float) $session->score_percent,
                'duration_seconds' => (int) $session->duration_seconds,
                'started_at' => $session->started_at,
                'finished_at' => $session->finished_at,
                'summary' => is_array($session->summary) ? $session->summary : ($session->summary ? json_decode($session->summary, true) : null),
            ])
            ->values()
            ->all();
    }

    public function mastered(Tenant $tenant, TenantMember $member, ?string $language = null, int $limit = 500): array
    {
        $thresholds = TenantGameVocabularySetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->pluck('mastered_threshold', 'language')
            ->map(fn ($t) => (int) $t)
            ->toArray();

        $query = TenantGameVocabularyStat::query()
            ->with('word')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id);

        if ($language !== null && $language !== '') {
            $query->where('language', $language);
        }

        return $query
            ->orderByDesc('max_streak')
            ->limit($limit)
            ->get()
            ->filter(function (TenantGameVocabularyStat $stat) use ($thresholds) {
                $threshold = $thresholds[$stat->language] ?? self::DEFAULT_MASTERED_THRESHOLD;
                return $stat->word !== null && $stat->correct_streak >= $threshold;
            })
            ->map(static fn (TenantGameVocabularyStat $stat) => [
                'word_id' => (int) $stat->word_id,
                'language' => (string) $stat->language,
                'jumlah_benar' => (int) $stat->jumlah_benar,
                'jumlah_salah' => (int) $stat->jumlah_salah,
                'correct_streak' => (int) $stat->correct_streak,
                'max_streak' => (int) $stat->max_streak,
                'is_mastered' => true,
                'last_practiced_at' => $stat->last_practiced_at,
                'word' => [
                    'id' => (int) $stat->word->id,
                    'bahasa_indonesia' => (string) $stat->word->bahasa_indonesia,
                    'bahasa_inggris' => $stat->word->bahasa_inggris !== null ? (string) $stat->word->bahasa_inggris : null,
                    'fonetik' => $stat->word->fonetik !== null ? (string) $stat->word->fonetik : null,
                    'bahasa_arab' => $stat->word->bahasa_arab !== null ? (string) $stat->word->bahasa_arab : null,
                    'fonetik_arab' => $stat->word->fonetik_arab !== null ? (string) $stat->word->fonetik_arab : null,
                    'bahasa_mandarin' => $stat->word->bahasa_mandarin !== null ? (string) $stat->word->bahasa_mandarin : null,
                    'fonetik_mandarin' => $stat->word->fonetik_mandarin !== null ? (string) $stat->word->fonetik_mandarin : null,
                    'kategori' => (string) $stat->word->kategori,
                    'hari' => (int) $stat->word->hari,
                ],
            ])
            ->values()
            ->all();
    }

    public function settings(Tenant $tenant, TenantMember $member, ?string $language = null): array
    {
        $query = TenantGameVocabularySetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id);

        if ($language !== null && $language !== '') {
            $query->where('language', $language);
        }

        return $query
            ->get(['language', 'default_mode', 'default_question_count', 'mastered_threshold', 'default_time_limit', 'auto_tts', 'translation_direction'])
            ->map(static fn (TenantGameVocabularySetting $setting) => [
                'language' => (string) $setting->language,
                'default_mode' => (string) $setting->default_mode,
                'default_question_count' => (int) ($setting->default_question_count ?? self::DEFAULT_QUESTION_COUNT),
                'mastered_threshold' => (int) $setting->mastered_threshold,
                'default_time_limit' => (int) $setting->default_time_limit,
                'auto_tts' => (bool) $setting->auto_tts,
                'translation_direction' => (string) $setting->translation_direction,
            ])
            ->values()
            ->all();
    }

    public function updateSettings(Tenant $tenant, TenantMember $member, array $data): void
    {
        TenantGameVocabularySetting::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'member_id' => $member->id,
                'language' => $data['language'],
            ],
            [
                'default_mode' => $data['default_mode'],
                'default_question_count' => $data['default_question_count'],
                'mastered_threshold' => $data['mastered_threshold'],
                'default_time_limit' => $data['default_time_limit'],
                'auto_tts' => $data['auto_tts'],
                'translation_direction' => $data['translation_direction'],
            ]
        );
    }

    private function thresholdFor(Tenant $tenant, TenantMember $member, string $language): int
    {
        return (int) (TenantGameVocabularySetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->where('language', $language)
            ->value('mastered_threshold') ?? self::DEFAULT_MASTERED_THRESHOLD);
    }

    private function fetchEffectiveWords(int $tenantId, string $category, ?int $day): Collection
    {
        $query = $this->effectiveWordsBaseQuery($tenantId)
            ->where('kategori', $category);

        if ($day !== null) {
            $query->where('hari', $day);
        }

        return $this->collapseEffectiveWords($query->get($this->effectiveWordColumns()));
    }

    private function effectiveWordsForTenant(int $tenantId): Collection
    {
        return $this->collapseEffectiveWords(
            $this->effectiveWordsBaseQuery($tenantId)->get($this->effectiveWordColumns())
        );
    }

    private function effectiveWordsBaseQuery(int $tenantId)
    {
        return TenantGameVocabularyWord::query()
            ->where(function ($inner) use ($tenantId) {
                $inner->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenantId);
            })
            ->orderBy('kategori')
            ->orderBy('hari')
            ->orderByRaw('(tenant_id IS NULL) ASC')
            ->orderBy('id');
    }

    private function effectiveWordColumns(): array
    {
        return [
            'id',
            'tenant_id',
            'bahasa_indonesia',
            'bahasa_inggris',
            'fonetik',
            'bahasa_arab',
            'fonetik_arab',
            'bahasa_mandarin',
            'fonetik_mandarin',
            'kategori',
            'hari',
        ];
    }

    private function collapseEffectiveWords(Collection $rows): Collection
    {
        $effective = [];
        foreach ($rows as $row) {
            $key = mb_strtolower(trim((string) $row->bahasa_indonesia)).'|'.$row->kategori.'|'.$row->hari;
            if (! isset($effective[$key])) {
                $effective[$key] = $row;
            }
        }

        return collect(array_values($effective));
    }

    private function mapWord(TenantGameVocabularyWord $word): array
    {
        return [
            'id' => (int) $word->id,
            'bahasa_indonesia' => (string) $word->bahasa_indonesia,
            'bahasa_inggris' => $word->bahasa_inggris !== null ? (string) $word->bahasa_inggris : null,
            'fonetik' => $word->fonetik !== null ? (string) $word->fonetik : null,
            'bahasa_arab' => $word->bahasa_arab !== null ? (string) $word->bahasa_arab : null,
            'fonetik_arab' => $word->fonetik_arab !== null ? (string) $word->fonetik_arab : null,
            'bahasa_mandarin' => $word->bahasa_mandarin !== null ? (string) $word->bahasa_mandarin : null,
            'fonetik_mandarin' => $word->fonetik_mandarin !== null ? (string) $word->fonetik_mandarin : null,
            'kategori' => (string) $word->kategori,
            'hari' => (int) $word->hari,
        ];
    }
}
