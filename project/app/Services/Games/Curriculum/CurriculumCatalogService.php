<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\GameCurriculumUnit;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Facades\DB;

class CurriculumCatalogService
{
    public function __construct(private readonly CurriculumEntitlementService $entitlementService)
    {
    }

    public function fetchVisibleUnits(Tenant $tenant, TenantMember $member): array
    {
        $units = GameCurriculumUnit::query()
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })
            ->orderBy('subject')
            ->orderBy('grade')
            ->orderBy('semester')
            ->orderBy('chapter')
            ->get();

        return $this->entitlementService
            ->accessibleUnits($tenant, $member, $units)
            ->map(fn (GameCurriculumUnit $unit) => $this->serializeUnit($unit))
            ->all();
    }

    public function findVisibleUnit(Tenant $tenant, TenantMember $member, int $unitId): ?GameCurriculumUnit
    {
        $unit = GameCurriculumUnit::query()
            ->where('id', $unitId)
            ->where(function ($query) use ($tenant) {
                $query->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })
            ->first();

        if (! $unit instanceof GameCurriculumUnit) {
            return null;
        }

        return $this->entitlementService->hasCurriculumAccess($tenant, $member, $unit) ? $unit : null;
    }

    public function createUnit(Tenant $tenant, array $data): GameCurriculumUnit
    {
        return GameCurriculumUnit::create([
            'tenant_id' => $tenant->id,
            'educational_phase' => $data['educational_phase'] ?? null,
            'grade' => $data['grade'] ?? null,
            'subject' => $data['subject'],
            'semester' => $data['semester'] ?? null,
            'chapter' => $data['chapter'] ?? null,
            'curriculum_type' => $data['curriculum_type'] ?? 'kurikulum_merdeka',
            'difficulty_level' => $data['difficulty_level'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function updateUnit(GameCurriculumUnit $unit, array $data): ?GameCurriculumUnit
    {
        $updated = GameCurriculumUnit::query()
            ->where('id', $unit->id)
            ->where('row_version', $data['row_version'])
            ->update([
                'educational_phase' => $data['educational_phase'] ?? null,
                'grade' => $data['grade'] ?? null,
                'subject' => $data['subject'],
                'semester' => $data['semester'] ?? null,
                'chapter' => $data['chapter'] ?? null,
                'curriculum_type' => $data['curriculum_type'] ?? 'kurikulum_merdeka',
                'difficulty_level' => $data['difficulty_level'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'row_version' => DB::raw('row_version + 1'),
                'updated_at' => now(),
            ]);

        return $updated ? $unit->fresh() : null;
    }

    public function serializeUnit(GameCurriculumUnit $unit): array
    {
        return [
            'id' => (int) $unit->id,
            'tenant_id' => $unit->tenant_id !== null ? (int) $unit->tenant_id : null,
            'educational_phase' => $unit->educational_phase,
            'grade' => $unit->grade !== null ? (int) $unit->grade : null,
            'subject' => (string) $unit->subject,
            'semester' => $unit->semester !== null ? (int) $unit->semester : null,
            'chapter' => $unit->chapter,
            'curriculum_type' => (string) $unit->curriculum_type,
            'difficulty_level' => $unit->difficulty_level,
            'metadata' => $unit->metadata,
            'row_version' => (int) $unit->row_version,
        ];
    }
}
