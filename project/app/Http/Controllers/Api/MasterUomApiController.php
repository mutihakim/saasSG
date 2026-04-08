<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantUom;
use App\Models\Tenant;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MasterUomApiController extends Controller
{
    public function __construct(
        private readonly SubscriptionEntitlements $entitlements,
    ) {}

    // GET /master/uom
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantUom::class);

        $query = TenantUom::forTenant($tenant->id)
            ->active()
            ->ordered();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhere('name', 'like', "%{$request->search}%")
                    ->orWhere('abbreviation', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('dimension_type')) {
            $query->where('dimension_type', $request->dimension_type);
        }

        $units = $query->get();

        return response()->json([
            'ok' => true,
            'data' => $units,
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

        $unit = TenantUom::create([
            'tenant_id' => $tenant->id,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'abbreviation' => $validated['abbreviation'],
            'dimension_type' => $validated['dimension_type'],
            'base_unit_code' => $validated['base_unit_code'] ?? null,
            'base_factor' => $validated['base_factor'],
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'row_version' => 1,
        ]);

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

        $uom->update([
            'code' => isset($validated['code']) ? strtoupper($validated['code']) : $uom->code,
            'name' => $validated['name'] ?? $uom->name,
            'abbreviation' => $validated['abbreviation'] ?? $uom->abbreviation,
            'dimension_type' => $validated['dimension_type'] ?? $uom->dimension_type,
            'base_unit_code' => array_key_exists('base_unit_code', $validated) ? $validated['base_unit_code'] : $uom->base_unit_code,
            'base_factor' => $validated['base_factor'] ?? $uom->base_factor,
            'is_active' => $validated['is_active'] ?? $uom->is_active,
            'sort_order' => $validated['sort_order'] ?? $uom->sort_order,
            'row_version' => $uom->row_version + 1,
        ]);

        return response()->json([
            'ok' => true,
            'data' => $uom->fresh(),
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
                'message' => 'Satuan ukur tidak dapat dihapus karena digunakan sebagai pengali dasar (base unit) oleh satuan lain.',
            ], 422);
        }
        
        $uom->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Unit of measure deleted successfully.',
        ]);
    }
}
