<?php

namespace App\Http\Controllers\Api\V1\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Services\ActivityLogService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterCurrencyApiController extends Controller
{
    public function __construct(
        private readonly SubscriptionEntitlements $entitlements,
        private readonly ActivityLogService $activityLogs,
    ) {}

    // GET /master/currencies
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantCurrency::class);

        $query = TenantCurrency::forTenant($tenant->id)
            ->ordered();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        $currencies = $query->get();

        return response()->json([
            'ok' => true,
            'data' => $currencies,
        ]);
    }

    // POST /master/currencies
    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantCurrency::class);

        $limit = $this->entitlements->limit($tenant, 'master.currencies.max');
        if ($limit !== null && $limit !== -1) {
            $current = TenantCurrency::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('deleted_at')
                ->count();

            if ($current >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'limit_key' => 'master.currencies.max',
                    'message' => "Batas {$limit} mata uang tercapai. Upgrade plan untuk menambah mata uang.",
                ], 422);
            }
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:3',
                Rule::unique('tenant_currencies')->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')),
            ],
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'symbol_position' => 'required|in:before,after',
            'decimal_places' => 'required|integer|min:0|max:4',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        try {
            $currency = TenantCurrency::create([
                'tenant_id' => $tenant->id,
                'code' => strtoupper($validated['code']),
                'name' => $validated['name'],
                'symbol' => $validated['symbol'],
                'symbol_position' => $validated['symbol_position'],
                'decimal_places' => $validated['decimal_places'],
                'exchange_rate' => 1.0, // Default for new currency
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            $this->activityLogs->log(
                $request,
                $tenant,
                'master.currency.created',
                'tenant_currencies',
                $currency->id,
                null,
                $this->activityLogs->snapshot($currency)
            );

            return response()->json([
                'ok' => true,
                'data' => $currency,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Failed to create currency: ' . $e->getMessage(),
            ], 500);
        }
    }

    // PATCH /master/currencies/{currency}
    public function update(Request $request, Tenant $tenant, TenantCurrency $currency): JsonResponse
    {
        $this->authorize('update', $currency);
        abort_if((int) $currency->tenant_id !== (int) $tenant->id, 404);

        $validated = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:3',
                Rule::unique('tenant_currencies')->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at'))->ignore($currency->id),
            ],
            'name' => 'sometimes|required|string|max:255',
            'symbol' => 'sometimes|required|string|max:10',
            'symbol_position' => 'sometimes|required|in:before,after',
            'decimal_places' => 'sometimes|required|integer|min:0|max:4',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'row_version' => 'sometimes|integer',
        ]);

        // Optimistic locking
        if (isset($validated['row_version']) && (int)$currency->row_version !== (int)$validated['row_version']) {
            return response()->json([
                'ok' => false,
                'message' => 'The currency was modified by another user. Please refresh and try again.',
            ], 409);
        }

        try {
            $before = $this->activityLogs->snapshot($currency);
            $beforeVersion = (int) $currency->row_version;

            $currency->update([
                'code' => isset($validated['code']) ? strtoupper($validated['code']) : $currency->code,
                'name' => $validated['name'] ?? $currency->name,
                'symbol' => $validated['symbol'] ?? $currency->symbol,
                'symbol_position' => $validated['symbol_position'] ?? $currency->symbol_position,
                'decimal_places' => $validated['decimal_places'] ?? $currency->decimal_places,
                'is_active' => $validated['is_active'] ?? $currency->is_active,
                'sort_order' => $validated['sort_order'] ?? $currency->sort_order,
                'row_version' => $currency->row_version + 1,
            ]);

            $fresh = $currency->fresh();
            $this->activityLogs->log(
                $request,
                $tenant,
                'master.currency.updated',
                'tenant_currencies',
                $currency->id,
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
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Failed to update currency: ' . $e->getMessage(),
            ], 500);
        }
    }

    // DELETE /master/currencies/{currency}
    public function destroy(Request $request, Tenant $tenant, TenantCurrency $currency): JsonResponse
    {
        $this->authorize('delete', $currency);
        abort_if((int) $currency->tenant_id !== (int) $tenant->id, 404);

        // Check if currency is being used
        $isUsed = \App\Models\Finance\FinanceTransaction::where('currency_id', $currency->id)->exists();
        if ($isUsed) {
            return response()->json([
                'ok' => false,
                'message' => 'Cannot delete currency that is already in use.',
            ], 422);
        }

        $before = $this->activityLogs->snapshot($currency);
        $beforeVersion = (int) $currency->row_version;
        $currency->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.currency.deleted',
            'tenant_currencies',
            $currency->id,
            $before,
            null,
            [],
            $beforeVersion,
            null
        );

        return response()->json([
            'ok' => true,
            'message' => 'Currency deleted successfully.',
        ]);
    }
}
