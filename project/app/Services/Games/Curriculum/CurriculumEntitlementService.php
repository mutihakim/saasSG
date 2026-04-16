<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\GameCurriculumUnit;
use App\Models\Games\TenantCurriculumEntitlement;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

class CurriculumEntitlementService
{
    public function hasCurriculumAccess(Tenant $tenant, TenantMember $member, GameCurriculumUnit $unit): bool
    {
        return $this->matchingEntitlements($tenant, $member, $unit)->isNotEmpty();
    }

    public function accessibleUnits(Tenant $tenant, TenantMember $member, Collection $units): Collection
    {
        return $units->filter(fn (GameCurriculumUnit $unit) => $this->hasCurriculumAccess($tenant, $member, $unit))->values();
    }

    public function grantEntitlement(Tenant $tenant, array $data): TenantCurriculumEntitlement
    {
        return TenantCurriculumEntitlement::create([
            'tenant_id' => $tenant->id,
            'user_id' => $data['user_id'] ?? null,
            'educational_phase' => $data['educational_phase'] ?? null,
            'grade' => $data['grade'] ?? null,
            'subject' => $data['subject'],
            'is_active' => $data['is_active'] ?? true,
            'valid_until' => $data['valid_until'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function listEntitlements(Tenant $tenant): array
    {
        return TenantCurriculumEntitlement::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('subject')
            ->orderBy('educational_phase')
            ->orderBy('grade')
            ->orderByDesc('id')
            ->get()
            ->map(fn (TenantCurriculumEntitlement $entitlement) => $this->serializeEntitlement($entitlement))
            ->values()
            ->all();
    }

    public function serializeEntitlement(TenantCurriculumEntitlement $entitlement): array
    {
        return [
            'id' => (int) $entitlement->id,
            'tenant_id' => (int) $entitlement->tenant_id,
            'user_id' => $entitlement->user_id !== null ? (int) $entitlement->user_id : null,
            'educational_phase' => $entitlement->educational_phase,
            'grade' => $entitlement->grade !== null ? (int) $entitlement->grade : null,
            'subject' => (string) $entitlement->subject,
            'is_active' => (bool) $entitlement->is_active,
            'valid_until' => $entitlement->valid_until?->toISOString(),
            'metadata' => $entitlement->metadata,
        ];
    }

    private function matchingEntitlements(Tenant $tenant, TenantMember $member, GameCurriculumUnit $unit): Collection
    {
        return TenantCurriculumEntitlement::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->where('subject', $unit->subject)
            ->where(function ($phase) use ($unit) {
                $phase->whereNull('educational_phase');
                if ($unit->educational_phase !== null) {
                    $phase->orWhere('educational_phase', $unit->educational_phase);
                }
            })
            ->where(function ($grade) use ($unit) {
                $grade->whereNull('grade');
                if ($unit->grade !== null) {
                    $grade->orWhere('grade', $unit->grade);
                }
            })
            ->where(function ($query) use ($member) {
                $query->where('user_id', $member->user_id)
                    ->orWhereNull('user_id');
            })
            ->get()
            ->filter(function (TenantCurriculumEntitlement $entitlement) {
                $validUntil = $entitlement->valid_until;
                return ! $validUntil instanceof CarbonInterface || $validUntil->isFuture();
            })
            ->values();
    }
}
