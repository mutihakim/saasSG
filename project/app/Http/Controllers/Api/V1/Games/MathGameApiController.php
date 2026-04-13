<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Games\MathGameService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MathGameApiController extends Controller
{
    use ApiResponder;

    public function __construct(private readonly MathGameService $mathGameService)
    {
    }

    public function config(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        return $this->ok(['config' => $this->mathGameService->config()]);
    }

    public function mastered(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'operator' => ['nullable', 'string', Rule::in(['+', '-', '*', '/'])],
        ]);

        return $this->ok([
            'pairs' => $this->mathGameService->masteredPairs($tenant, $member, $validated['operator'] ?? null),
        ]);
    }

    public function stats(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'pairs' => ['required', 'array', 'min:1', 'max:200'],
            'pairs.*.operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'pairs.*.angka_pilihan' => ['required', 'integer', 'min:1', 'max:999'],
            'pairs.*.angka_random' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        return $this->ok(['stats' => $this->mathGameService->stats($tenant, $member, $data['pairs'])]);
    }

    public function attempt(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'angka_pilihan' => ['required', 'integer', 'min:1', 'max:999'],
            'angka_random' => ['required', 'integer', 'min:0', 'max:999'],
            'is_correct' => ['required', 'boolean'],
            'current_streak' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);

        return $this->ok(['stats' => $this->mathGameService->recordAttempt($tenant, $member, $data)]);
    }

    public function finish(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
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

        return $this->ok(['session' => $this->mathGameService->finishSession($tenant, $member, $data)], 201);
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return $this->ok([
            'sessions' => $this->mathGameService->history($tenant, $member, (int) ($validated['limit'] ?? 20)),
        ]);
    }

    public function settings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'operator' => ['nullable', 'string', Rule::in(['+', '-', '*', '/'])],
        ]);

        return $this->ok([
            'settings' => $this->mathGameService->settings($tenant, $member, $validated['operator'] ?? null),
        ]);
    }

    public function updateSettings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'operator' => ['required', 'string', Rule::in(['+', '-', '*', '/'])],
            'default_mode' => ['required', 'string', Rule::in(['mencariC', 'mencariB'])],
            'default_question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'default_time_limit' => ['required', 'integer', 'min:2', 'max:300'],
            'mastered_threshold' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $this->mathGameService->updateSettings($tenant, $member, $data);

        return $this->ok(['message' => 'Settings saved.']);
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

    private function memberNotFound(): JsonResponse
    {
        return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
    }
}
