<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Games\Curriculum\CurriculumCatalogService;
use App\Services\Games\Curriculum\CurriculumQuestionService;
use App\Services\Games\Curriculum\CurriculumSessionService;
use App\Services\Games\Curriculum\CurriculumSettingService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumGameApiController extends Controller
{
    use ApiResponder;

    public function __construct(
        private readonly CurriculumCatalogService $catalogService,
        private readonly CurriculumQuestionService $questionService,
        private readonly CurriculumSessionService $sessionService,
        private readonly CurriculumSettingService $settingService,
    ) {
    }

    public function settings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        return $this->ok([
            'settings' => $this->settingService->settings($tenant, $member),
        ]);
    }

    public function updateSettings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'grade' => ['required', 'integer', 'min:1', 'max:12'],
            'default_mode' => ['required', 'string', 'in:practice,learn'],
            'default_question_count' => ['required', 'integer', 'min:1', 'max:50'],
            'default_time_limit' => ['required', 'integer', 'min:2', 'max:300'],
            'mastered_threshold' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $this->settingService->updateSettings($tenant, $member, $data);

        return $this->ok([
            'message' => 'Settings updated',
        ]);
    }

    public function config(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        return $this->ok([
            'config' => [
                'question_count_options' => [5, 10, 15, 20],
                'time_limit_options' => [10, 15, 20, 30, 45, 60],
                'default_time_limit' => 20,
                'units' => $this->catalogService->fetchVisibleUnits($tenant, $member),
            ],
        ]);
    }

    public function questions(Request $request, Tenant $tenant, int $unitId): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $unit = $this->catalogService->findVisibleUnit($tenant, $member, $unitId);
        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        return $this->ok([
            'unit' => $this->catalogService->serializeUnit($unit),
            'questions' => $this->questionService->fetchQuestions($tenant, $unit, (int) ($data['limit'] ?? 10)),
        ]);
    }

    public function attempt(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'question_id' => ['required', 'integer', 'min:1'],
            'selected_answer' => ['required', 'string'],
        ]);

        $question = $this->questionService->findVisibleQuestion($tenant, (int) $data['question_id']);
        if (! $question) {
            return $this->error('NOT_FOUND', 'Curriculum question not found.', [], 404);
        }

        $unit = $this->catalogService->findVisibleUnit($tenant, $member, (int) $question->curriculum_unit_id);
        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        return $this->ok([
            'result' => $this->questionService->scoreAnswer($question, (string) $data['selected_answer']),
        ]);
    }

    public function finish(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'unit_id' => ['required', 'integer', 'min:1'],
            'question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'correct_count' => ['required', 'integer', 'min:0', 'max:200'],
            'wrong_count' => ['required', 'integer', 'min:0', 'max:200'],
            'best_streak' => ['required', 'integer', 'min:0', 'max:200'],
            'time_limit' => ['required', 'integer', 'min:2', 'max:300'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:7200'],
            'started_at' => ['nullable', 'date'],
            'finished_at' => ['nullable', 'date'],
            'summary' => ['nullable', 'array'],
        ]);

        $unit = $this->catalogService->findVisibleUnit($tenant, $member, (int) $data['unit_id']);
        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        return $this->ok([
            'session' => $this->sessionService->finishSession($tenant, $member, $unit, $data),
        ], 201);
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return $this->ok([
            'sessions' => $this->sessionService->history($tenant, $member, (int) ($validated['limit'] ?? 20)),
        ]);
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
