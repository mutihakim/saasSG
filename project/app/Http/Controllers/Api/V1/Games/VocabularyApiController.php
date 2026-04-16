<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Games\VocabularyGameService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VocabularyApiController extends Controller
{
    use ApiResponder;

    private const LANGUAGES = ['english', 'arabic', 'mandarin'];
    private const MODES = ['learn', 'practice'];
    private const SESSION_MODES = ['practice', 'memory_test'];
    private const DIRECTIONS = ['id_to_target', 'target_to_id'];

    public function __construct(private readonly VocabularyGameService $vocabularyGameService)
    {
    }

    public function config(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        return $this->ok($this->vocabularyGameService->config($tenant, $member));
    }

    public function words(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'language' => ['required', 'string', Rule::in(self::LANGUAGES)],
            'category' => ['required', 'string', 'max:120'],
            'day' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        return $this->ok($this->vocabularyGameService->words(
            $tenant,
            $member,
            (string) $validated['language'],
            (string) $validated['category'],
            (int) $validated['day']
        ));
    }

    public function pool(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'language' => ['required', 'string', Rule::in(self::LANGUAGES)],
            'category' => ['required', 'string', 'max:120'],
        ]);

        return $this->ok($this->vocabularyGameService->pool(
            $tenant,
            (string) $validated['category']
        ));
    }

    public function attempt(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'word_id' => ['required', 'integer', 'min:1'],
            'language' => ['required', 'string', Rule::in(self::LANGUAGES)],
            'is_correct' => ['required', 'boolean'],
            'current_streak' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);

        if (! $this->vocabularyGameService->findWordForTenant($tenant, (int) $data['word_id'])) {
            return $this->error('NOT_FOUND', 'Word not found.', [], 404);
        }

        return $this->ok([
            'stats' => $this->vocabularyGameService->recordAttempt($tenant, $member, $data),
        ]);
    }

    public function finish(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'language' => ['required', 'string', Rule::in(self::LANGUAGES)],
            'mode' => ['required', 'string', Rule::in(self::SESSION_MODES)],
            'category' => ['required', 'string', 'max:120'],
            'day' => ['required', 'integer', 'min:1', 'max:365'],
            'question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'correct_count' => ['required', 'integer', 'min:0', 'max:200'],
            'wrong_count' => ['required', 'integer', 'min:0', 'max:200'],
            'best_streak' => ['required', 'integer', 'min:0', 'max:200'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:7200'],
            'started_at' => ['nullable', 'date'],
            'finished_at' => ['nullable', 'date'],
            'summary' => ['nullable', 'array'],
        ]);

        return $this->ok([
            'session' => $this->vocabularyGameService->finishSession($tenant, $member, $data),
        ], 201);
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
            'language' => ['nullable', 'string', Rule::in(self::LANGUAGES)],
        ]);

        return $this->ok([
            'sessions' => $this->vocabularyGameService->history(
                $tenant,
                $member,
                (int) ($validated['limit'] ?? 20),
                $validated['language'] ?? null
            ),
        ]);
    }

    public function mastered(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'language' => ['nullable', 'string', Rule::in(self::LANGUAGES)],
        ]);

        return $this->ok([
            'words' => $this->vocabularyGameService->mastered(
                $tenant,
                $member,
                $validated['language'] ?? null,
                (int) ($validated['limit'] ?? 500),
            ),
        ]);
    }

    public function settings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'language' => ['nullable', 'string', Rule::in(self::LANGUAGES)],
        ]);

        return $this->ok([
            'settings' => $this->vocabularyGameService->settings($tenant, $member, $validated['language'] ?? null),
        ]);
    }

    public function updateSettings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'language' => ['required', 'string', Rule::in(self::LANGUAGES)],
            'default_mode' => ['required', 'string', Rule::in(self::MODES)],
            'default_question_count' => ['required', 'integer', 'min:1', 'max:50'],
            'mastered_threshold' => ['required', 'integer', 'min:1', 'max:50'],
            'default_time_limit' => ['required', 'integer', 'min:2', 'max:60'],
            'auto_tts' => ['required', 'boolean'],
            'translation_direction' => ['required', 'string', Rule::in(self::DIRECTIONS)],
        ]);

        $this->vocabularyGameService->updateSettings($tenant, $member, $data);

        return $this->ok(['message' => 'Settings saved.']);
    }

    private function resolveMember(Request $request, Tenant $tenant): ?TenantMember
    {
        $member = $request->attributes->get('currentTenantMember');

        if (! $member instanceof TenantMember) {
            return null;
        }

        if ((int) $member->tenant_id !== (int) $tenant->id) {
            return null;
        }

        return $member;
    }

    private function memberNotFound(): JsonResponse
    {
        return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
    }
}
