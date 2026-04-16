<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Games\GameCurriculumQuestion;
use App\Models\Games\GameCurriculumUnit;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Games\Curriculum\CurriculumCatalogService;
use App\Services\Games\Curriculum\CurriculumImportService;
use App\Services\Games\Curriculum\CurriculumQuestionService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumQuestionApiController extends Controller
{
    use ApiResponder;

    public function __construct(
        private readonly CurriculumCatalogService $catalogService,
        private readonly CurriculumQuestionService $questionService,
        private readonly CurriculumImportService $importService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request, Tenant $tenant, int $unitId): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $unit = GameCurriculumUnit::query()
            ->where('id', $unitId)
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })
            ->first();

        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        return $this->ok([
            'questions' => $this->questionService->listQuestions($tenant, $unit),
        ]);
    }

    public function store(Request $request, Tenant $tenant, int $unitId): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $unit = GameCurriculumUnit::query()->where('id', $unitId)->where('tenant_id', $tenant->id)->first();
        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        $data = $request->validate([
            'question_key' => ['nullable', 'string', 'max:120'],
            'question_text' => ['required', 'string'],
            'options' => ['required', 'array', 'min:4'],
            'options.*' => ['required', 'string'],
            'correct_answer' => ['required', 'string'],
            'question_type' => ['nullable', 'string', 'max:30'],
            'points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'difficulty_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'metadata' => ['nullable', 'array'],
        ]);

        try {
            $question = $this->questionService->createQuestion($tenant, $unit, $data);
        } catch (\InvalidArgumentException $exception) {
            return $this->error('VALIDATION_FAILED', $exception->getMessage(), [], 422);
        }

        $after = $this->questionService->serializeQuestion($question);
        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.question.created',
            GameCurriculumQuestion::class,
            (string) $question->id,
            null,
            $after,
            ['surface' => 'curriculum-question-api'],
            null,
            (int) $question->row_version,
            $member,
        );

        return $this->ok(['question' => $after], 201);
    }

    public function bulkImport(Request $request, Tenant $tenant, int $unitId): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $unit = GameCurriculumUnit::query()->where('id', $unitId)->where('tenant_id', $tenant->id)->first();
        if (! $unit) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $result = $this->importService->importFromCsv($tenant, $unit, $data['file']);

        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.question.imported',
            GameCurriculumUnit::class,
            (string) $unit->id,
            null,
            ['created' => $result['created'], 'errors' => count($result['errors'])],
            ['surface' => 'curriculum-question-api'],
            null,
            null,
            $member,
        );

        return $this->ok($result, 201);
    }

    public function update(Request $request, Tenant $tenant, GameCurriculumQuestion $question): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        if ((int) $question->tenant_id !== (int) $tenant->id) {
            return $this->error('NOT_FOUND', 'Curriculum question not found.', [], 404);
        }

        $data = $request->validate([
            'question_key' => ['nullable', 'string', 'max:120'],
            'question_text' => ['required', 'string'],
            'options' => ['required', 'array', 'min:4'],
            'options.*' => ['required', 'string'],
            'correct_answer' => ['required', 'string'],
            'question_type' => ['nullable', 'string', 'max:30'],
            'points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'difficulty_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'metadata' => ['nullable', 'array'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        $before = $this->questionService->serializeQuestion($question);

        try {
            $updated = $this->questionService->updateQuestion($question, $data);
        } catch (\InvalidArgumentException $exception) {
            return $this->error('VALIDATION_FAILED', $exception->getMessage(), [], 422);
        }

        if (! $updated) {
            return $this->error('VERSION_CONFLICT', 'Record has been updated by another user.', [
                'current_row_version' => (int) $question->fresh()->row_version,
                'question' => $this->questionService->serializeQuestion($question->fresh()),
            ], 409);
        }

        $after = $this->questionService->serializeQuestion($updated);
        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.question.updated',
            GameCurriculumQuestion::class,
            (string) $updated->id,
            $before,
            $after,
            ['surface' => 'curriculum-question-api'],
            (int) $data['row_version'],
            (int) $updated->row_version,
            $member,
        );

        return $this->ok(['question' => $after]);
    }

    public function destroy(Request $request, Tenant $tenant, GameCurriculumQuestion $question): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        if ((int) $question->tenant_id !== (int) $tenant->id) {
            return $this->error('NOT_FOUND', 'Curriculum question not found.', [], 404);
        }

        $before = $this->questionService->serializeQuestion($question);
        $question->delete();

        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.question.deleted',
            GameCurriculumQuestion::class,
            (string) $question->id,
            $before,
            null,
            ['surface' => 'curriculum-question-api'],
            (int) $question->row_version,
            (int) $question->row_version,
            $member,
        );

        return $this->ok(['message' => 'Question deleted.']);
    }

    private function resolveMember(Request $request, Tenant $tenant): ?TenantMember
    {
        $member = $request->attributes->get('currentTenantMember');

        return $member instanceof TenantMember && (int) $member->tenant_id === (int) $tenant->id ? $member : null;
    }

    private function memberNotFound(): JsonResponse
    {
        return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
    }
}
