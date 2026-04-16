<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Games\GameCurriculumUnit;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Games\Curriculum\CurriculumCatalogService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumUnitApiController extends Controller
{
    use ApiResponder;

    public function __construct(
        private readonly CurriculumCatalogService $catalogService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $units = GameCurriculumUnit::query()
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })
            ->orderBy('subject')
            ->orderBy('grade')
            ->orderBy('semester')
            ->orderBy('chapter')
            ->get()
            ->map(fn (GameCurriculumUnit $unit) => $this->catalogService->serializeUnit($unit))
            ->all();

        return $this->ok(['units' => $units]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'educational_phase' => ['nullable', 'string', 'max:20'],
            'grade' => ['nullable', 'integer', 'min:1', 'max:12'],
            'subject' => ['required', 'string', 'max:100'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:3'],
            'chapter' => ['nullable', 'string', 'max:150'],
            'curriculum_type' => ['nullable', 'string', 'max:30'],
            'difficulty_level' => ['nullable', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ]);

        $unit = $this->catalogService->createUnit($tenant, $data);
        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.unit.created',
            GameCurriculumUnit::class,
            (string) $unit->id,
            null,
            $this->catalogService->serializeUnit($unit),
            ['surface' => 'curriculum-unit-api'],
            null,
            (int) $unit->row_version,
            $member,
        );

        return $this->ok(['unit' => $this->catalogService->serializeUnit($unit)], 201);
    }

    public function update(Request $request, Tenant $tenant, GameCurriculumUnit $unit): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        if ((int) $unit->tenant_id !== (int) $tenant->id) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        $data = $request->validate([
            'educational_phase' => ['nullable', 'string', 'max:20'],
            'grade' => ['nullable', 'integer', 'min:1', 'max:12'],
            'subject' => ['required', 'string', 'max:100'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:3'],
            'chapter' => ['nullable', 'string', 'max:150'],
            'curriculum_type' => ['nullable', 'string', 'max:30'],
            'difficulty_level' => ['nullable', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
            'row_version' => ['required', 'integer', 'min:1'],
        ]);

        $before = $this->catalogService->serializeUnit($unit);
        $updated = $this->catalogService->updateUnit($unit, $data);
        if (! $updated) {
            return $this->error('VERSION_CONFLICT', 'Record has been updated by another user.', [
                'current_row_version' => (int) $unit->fresh()->row_version,
                'unit' => $this->catalogService->serializeUnit($unit->fresh()),
            ], 409);
        }

        $after = $this->catalogService->serializeUnit($updated);
        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.unit.updated',
            GameCurriculumUnit::class,
            (string) $updated->id,
            $before,
            $after,
            ['surface' => 'curriculum-unit-api'],
            (int) $data['row_version'],
            (int) $updated->row_version,
            $member,
        );

        return $this->ok(['unit' => $after]);
    }

    public function destroy(Request $request, Tenant $tenant, GameCurriculumUnit $unit): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        if ((int) $unit->tenant_id !== (int) $tenant->id) {
            return $this->error('NOT_FOUND', 'Curriculum unit not found.', [], 404);
        }

        $before = $this->catalogService->serializeUnit($unit);
        $unit->delete();

        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.unit.deleted',
            GameCurriculumUnit::class,
            (string) $unit->id,
            $before,
            null,
            ['surface' => 'curriculum-unit-api'],
            (int) $unit->row_version,
            (int) $unit->row_version,
            $member,
        );

        return $this->ok(['message' => 'Unit deleted.']);
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
