<?php

namespace App\Http\Controllers\Api\V1\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantUom;
use App\Models\Tenant\Tenant;
use App\Services\ActivityLogService;
use App\Support\MasterDataPagination;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MasterUomApiController extends Controller
{
    public function __construct(
        private readonly SubscriptionEntitlements $entitlements,
        private readonly ActivityLogService $activityLogs,
    ) {}

    // GET /master/uom
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantUom::class);

        $resolved = MasterDataPagination::resolve($request);
        $code = trim($request->string('code')->toString());
        $name = trim($request->string('name')->toString());
        $abbreviation = trim($request->string('abbreviation')->toString());
        $codeTerms = MasterDataPagination::searchTerms($code);
        $nameTerms = MasterDataPagination::searchTerms($name);
        $abbreviationTerms = MasterDataPagination::searchTerms($abbreviation);
        $dimensionTypes = MasterDataPagination::stringList($request, 'dimension_type');
        $statusFilters = MasterDataPagination::stringList($request, 'status');
        $baseFactorExpression = trim((string) $request->input('base_factor', ''));
        $baseFactorMin = $request->input('base_factor_min');
        $baseFactorMax = $request->input('base_factor_max');
        $baseFactorRange = $baseFactorExpression !== ''
            ? MasterDataPagination::parseNumberExpression($baseFactorExpression)
            : [
                'min' => is_numeric($baseFactorMin) ? (float) $baseFactorMin : null,
                'max' => is_numeric($baseFactorMax) ? (float) $baseFactorMax : null,
            ];
        $allowedSorts = ['code', 'name', 'abbreviation', 'dimension_type', 'base_factor', 'is_active', 'sort_order'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'sort_order';
        $query = TenantUom::forTenant($tenant->id);

        if ($codeTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'code', $codeTerms);
        }

        if ($nameTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'name', $nameTerms);
        }

        if ($abbreviationTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'abbreviation', $abbreviationTerms);
        }

        if ($dimensionTypes !== []) {
            $query->whereIn('dimension_type', $dimensionTypes);
        }

        if ($statusFilters !== []) {
            $statusValues = collect($statusFilters)
                ->map(static fn (string $item) => match ($item) {
                    'active' => true,
                    'inactive' => false,
                    default => null,
                })
                ->filter(static fn ($item) => $item !== null)
                ->values()
                ->all();

            if ($statusValues !== []) {
                $query->whereIn('is_active', $statusValues);
            }
        }

        if ($baseFactorRange['min'] !== null) {
            $query->where('base_factor', '>=', $baseFactorRange['min']);
        }

        if ($baseFactorRange['max'] !== null) {
            $query->where('base_factor', '<=', $baseFactorRange['max']);
        }

        if ($sortColumn === 'sort_order') {
            $query->orderBy('sort_order', $sortDirection)->orderBy('code', 'asc');
        } else {
            $query->orderBy($sortColumn, $sortDirection)->orderBy('sort_order', 'asc');
        }

        $units = $query->paginate(
            $resolved['per_page'],
            ['id', 'code', 'name', 'abbreviation', 'dimension_type', 'base_unit_code', 'base_factor', 'is_active', 'sort_order', 'row_version'],
            'page',
            $resolved['page']
        );

        return response()->json([
            'ok' => true,
            'data' => [
                'units' => $units->items(),
                'pagination' => MasterDataPagination::meta($units, $resolved),
                'sort' => [
                    'by' => $sortColumn,
                    'direction' => $sortDirection,
                ],
            ],
        ]);
    }

    // POST /master/uom
    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantUom::class);

        $limit = $this->entitlements->limit($tenant, 'master.uom.max');
        if ($limit !== null && $limit !== -1) {
            $current = TenantUom::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('deleted_at')
                ->count();

            if ($current >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'limit_key' => 'master.uom.max',
                    'message' => "Batas {$limit} satuan tercapai. Upgrade plan untuk menambah satuan.",
                ], 422);
            }
        }

        if ($request->has('code')) {
            $request->merge(['code' => strtoupper((string) $request->input('code'))]);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('tenant_uom')->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')),
            ],
            'name' => 'required|string|max:255',
            'abbreviation' => 'required|string|max:10',
            'dimension_type' => 'required|in:berat,volume,jumlah,panjang,luas,waktu,lainnya',
            'base_unit_code' => [
                'nullable',
                'string',
                'max:10',
                Rule::exists('tenant_uom', 'code')->where('tenant_id', $tenant->id),
            ],
            'base_factor' => 'required|numeric|min:0.0001',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        // Prevent self-reference
        if (isset($validated['base_unit_code']) && $validated['base_unit_code'] === $validated['code']) {
            return response()->json([
                'ok' => false,
                'message' => 'Base unit cannot be the same as the unit itself.',
            ], 422);
        }

        // Standardize base_factor: if no base unit, factor must be 1
        $baseFactor = empty($validated['base_unit_code']) ? 1 : $validated['base_factor'];

        $unit = TenantUom::create([
            'tenant_id' => $tenant->id,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'abbreviation' => $validated['abbreviation'],
            'dimension_type' => $validated['dimension_type'],
            'base_unit_code' => $validated['base_unit_code'] ?? null,
            'base_factor' => $baseFactor,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'row_version' => 1,
        ]);

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.uom.created',
            'tenant_uom',
            $unit->id,
            null,
            $this->activityLogs->snapshot($unit)
        );

        return response()->json([
            'ok' => true,
            'data' => $unit,
        ], 201);
    }

    // PATCH /master/uom/{uom}
    public function update(Request $request, Tenant $tenant, TenantUom $uom): JsonResponse
    {
        $this->authorize('update', $uom);
        abort_if((int) $uom->tenant_id !== (int) $tenant->id, 404);

        if ($request->has('code')) {
            $request->merge(['code' => strtoupper((string) $request->input('code'))]);
        }

        $validated = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:10',
                Rule::unique('tenant_uom')->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at'))->ignore($uom->id),
            ],
            'name' => 'sometimes|required|string|max:255',
            'abbreviation' => 'sometimes|required|string|max:10',
            'dimension_type' => 'sometimes|required|in:berat,volume,jumlah,panjang,luas,waktu,lainnya',
            'base_unit_code' => [
                'nullable',
                'string',
                'max:10',
                Rule::exists('tenant_uom', 'code')->where('tenant_id', $tenant->id),
            ],
            'base_factor' => 'sometimes|required|numeric|min:0.0001',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'row_version' => 'sometimes|integer',
        ]);

        // Optimistic locking
        if (isset($validated['row_version']) && (int)$uom->row_version !== (int)$validated['row_version']) {
            return response()->json([
                'ok' => false,
                'message' => 'The unit was modified by another user. Please refresh and try again.',
            ], 409);
        }

        // Prevent self-reference
        if (isset($validated['base_unit_code']) && $validated['base_unit_code'] === ($validated['code'] ?? $uom->code)) {
            return response()->json([
                'ok' => false,
                'message' => 'Base unit cannot be the same as the unit itself.',
            ], 422);
        }

        $before = $this->activityLogs->snapshot($uom);
        $beforeVersion = (int) $uom->row_version;

        $baseUnitCode = array_key_exists('base_unit_code', $validated) ? $validated['base_unit_code'] : $uom->base_unit_code;
        $baseFactor = empty($baseUnitCode) ? 1 : ($validated['base_factor'] ?? $uom->base_factor);

        $uom->update([
            'code' => isset($validated['code']) ? strtoupper($validated['code']) : $uom->code,
            'name' => $validated['name'] ?? $uom->name,
            'abbreviation' => $validated['abbreviation'] ?? $uom->abbreviation,
            'dimension_type' => $validated['dimension_type'] ?? $uom->dimension_type,
            'base_unit_code' => $baseUnitCode,
            'base_factor' => $baseFactor,
            'is_active' => $validated['is_active'] ?? $uom->is_active,
            'sort_order' => $validated['sort_order'] ?? $uom->sort_order,
            'row_version' => $uom->row_version + 1,
        ]);

        $fresh = $uom->fresh();
        $this->activityLogs->log(
            $request,
            $tenant,
            'master.uom.updated',
            'tenant_uom',
            $uom->id,
            $before,
            $this->activityLogs->snapshot($fresh),
            [],
            $beforeVersion,
            (int) $fresh->row_version
        );

        return response()->json([
            'ok' => true,
            'data' => $fresh,
        ]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantUom $uom): JsonResponse
    {
        $this->authorize('delete', $uom);
        abort_if((int) $uom->tenant_id !== (int) $tenant->id, 404);

        $isUsedAsBase = TenantUom::where('tenant_id', $tenant->id)->where('base_unit_code', $uom->code)->exists();
        if ($isUsedAsBase) {
            return response()->json([
                'ok' => false,
                'error_code' => 'UOM_IN_USE',
            ], 422);
        }
        
        $before = $this->activityLogs->snapshot($uom);
        $beforeVersion = (int) $uom->row_version;
        $uom->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.uom.deleted',
            'tenant_uom',
            $uom->id,
            $before,
            null,
            [],
            $beforeVersion,
            null
        );

        return response()->json([
            'ok' => true,
            'message' => 'Unit of measure deleted successfully.',
        ]);
    }

    // DELETE /master/uom (bulk)
    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', TenantUom::class);
        $ids = $request->validate(['ids' => 'required|array|min:1'])['ids'];

        $units = TenantUom::forTenant($tenant->id)
            ->whereIn('id', $ids)
            ->get();

        $results = [];
        $summary = [
            'total'   => count($ids),
            'deleted' => 0,
            'failed'  => 0,
        ];

        foreach ($units as $unit) {
            // Check if used as base unit
            $isUsedAsBase = TenantUom::where('tenant_id', $tenant->id)
                ->where('base_unit_code', $unit->code)
                ->exists();

            if ($isUsedAsBase) {
                $results[] = [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'ok' => false,
                    'code' => 'UOM_IN_USE',
                ];
                $summary['failed']++;
                continue;
            }

            $before = $this->activityLogs->snapshot($unit);
            $beforeVersion = (int) $unit->row_version;
            $name = $unit->name;

            $unit->delete();

            $this->activityLogs->log(
                $request,
                $tenant,
                'master.uom.deleted',
                'tenant_uom',
                $unit->id,
                $before,
                null,
                [],
                $beforeVersion,
                null
            );

            $results[] = [
                'id' => $unit->id,
                'name' => $name,
                'ok' => true,
            ];
            $summary['deleted']++;
        }

        return response()->json([
            'ok'      => $summary['failed'] === 0,
            'results' => $results,
            'summary' => $summary,
        ]);
    }
}
