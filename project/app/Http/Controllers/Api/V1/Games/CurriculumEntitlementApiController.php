<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Games\TenantCurriculumEntitlement;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\ActivityLogService;
use App\Services\Games\Curriculum\CurriculumEntitlementService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumEntitlementApiController extends Controller
{
    use ApiResponder;

    public function __construct(
        private readonly CurriculumEntitlementService $entitlementService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        return $this->ok([
            'entitlements' => $this->entitlementService->listEntitlements($tenant),
        ]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'educational_phase' => ['nullable', 'string', 'max:20'],
            'grade' => ['nullable', 'integer', 'min:1', 'max:12'],
            'subject' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'valid_until' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ]);

        $entitlement = $this->entitlementService->grantEntitlement($tenant, $data);

        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.entitlement.granted',
            TenantCurriculumEntitlement::class,
            (string) $entitlement->id,
            null,
            $this->entitlementService->serializeEntitlement($entitlement),
            ['surface' => 'curriculum-entitlement-api'],
            null,
            null,
            $member,
        );

        return $this->ok([
            'entitlement' => $this->entitlementService->serializeEntitlement($entitlement),
        ], 201);
    }

    public function destroy(Request $request, Tenant $tenant, TenantCurriculumEntitlement $entitlement): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (! $member) {
            return $this->memberNotFound();
        }

        if ((int) $entitlement->tenant_id !== (int) $tenant->id) {
            return $this->error('NOT_FOUND', 'Curriculum entitlement not found.', [], 404);
        }

        $before = $this->entitlementService->serializeEntitlement($entitlement);
        $entitlement->delete();

        $this->activityLogService->log(
            $request,
            $tenant,
            'games.curriculum.entitlement.revoked',
            TenantCurriculumEntitlement::class,
            (string) $entitlement->id,
            $before,
            null,
            ['surface' => 'curriculum-entitlement-api'],
            null,
            null,
            $member,
        );

        return $this->ok(['message' => 'Entitlement revoked.']);
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
