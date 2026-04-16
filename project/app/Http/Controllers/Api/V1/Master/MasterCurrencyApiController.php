<?php

namespace App\Http\Controllers\Api\V1\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Services\ActivityLogService;
use App\Support\MasterDataPagination;
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

        $resolved = MasterDataPagination::resolve($request);
        $code = trim($request->string('code')->toString());
        $name = trim($request->string('name')->toString());
        $symbol = trim($request->string('symbol')->toString());
        $codeTerms = MasterDataPagination::searchTerms($code);
        $nameTerms = MasterDataPagination::searchTerms($name);
        $symbolTerms = MasterDataPagination::searchTerms($symbol);
        $positionFilters = MasterDataPagination::stringList($request, 'symbol_position');
        $statusFilters = MasterDataPagination::stringList($request, 'status');
        $allowedSorts = ['code', 'name', 'symbol', 'symbol_position', 'is_active'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'code';
        $query = TenantCurrency::forTenant($tenant->id);

        if ($codeTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'code', $codeTerms);
        }

        if ($nameTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'name', $nameTerms);
        }

        if ($symbolTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'symbol', $symbolTerms);
        }

        if ($positionFilters !== []) {
            $query->whereIn('symbol_position', $positionFilters);
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

        $query->orderBy($sortColumn, $sortDirection)->orderBy('id');

        $currencies = $query->paginate(
            $resolved['per_page'],
            ['id', 'code', 'name', 'symbol', 'symbol_position', 'decimal_places', 'is_active', 'sort_order', 'row_version'],
            'page',
            $resolved['page']
        );

        return response()->json([
            'ok' => true,
            'data' => [
                'currencies' => $currencies->items(),
                'pagination' => MasterDataPagination::meta($currencies, $resolved),
                'sort' => [
                    'by' => $sortColumn,
                    'direction' => $sortDirection,
                ],
            ],
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

        // Check if it is a system currency
        if ($currency->code === $tenant->currency_code) {
            return response()->json([
                'ok' => false,
                'error_code' => 'IS_SYSTEM_CURRENCY',
                'message' => 'Cannot delete system base currency.',
            ], 422);
        }

        // Check if currency is being used
        $isUsed = \App\Models\Finance\FinanceTransaction::where('currency_id', $currency->id)->exists();
        if ($isUsed) {
            return response()->json([
                'ok' => false,
                'error_code' => 'CURRENCY_IN_USE',
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

    // DELETE /master/currencies
    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', TenantCurrency::class);

        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return response()->json(['ok' => false, 'message' => 'No currency IDs provided.'], 400);
        }

        $results = [];
        $summary = [
            'total' => count($ids),
            'deleted' => 0,
            'failed' => 0,
        ];

        $currencies = TenantCurrency::forTenant($tenant->id)->whereIn('id', $ids)->get();

        foreach ($ids as $id) {
            $currency = $currencies->firstWhere('id', $id);

            if (!$currency) {
                $results[] = ['id' => $id, 'ok' => false, 'error_code' => 'NOT_FOUND'];
                $summary['failed']++;
                continue;
            }

            // 1. System Currency Protection
            if ($currency->code === $tenant->currency_code) {
                $results[] = [
                    'id' => $id,
                    'name' => $currency->name,
                    'ok' => false,
                    'error_code' => 'IS_SYSTEM_CURRENCY'
                ];
                $summary['failed']++;
                continue;
            }

            // 2. Transaction Protection
            $isUsed = \App\Models\Finance\FinanceTransaction::where('currency_id', $currency->id)->exists();
            if ($isUsed) {
                $results[] = [
                    'id' => $id,
                    'name' => $currency->name,
                    'ok' => false,
                    'error_code' => 'CURRENCY_IN_USE'
                ];
                $summary['failed']++;
                continue;
            }

            try {
                $before = $this->activityLogs->snapshot($currency);
                $beforeVersion = (int) $currency->row_version;
                $currencyName = $currency->name;
                
                $currency->delete();

                $this->activityLogs->log(
                    $request,
                    $tenant,
                    'master.currency.deleted',
                    'tenant_currencies',
                    $id,
                    $before,
                    null,
                    [],
                    $beforeVersion,
                    null
                );

                $results[] = ['id' => $id, 'name' => $currencyName, 'ok' => true];
                $summary['deleted']++;
            } catch (\Exception $e) {
                $results[] = [
                    'id' => $id,
                    'name' => $currency->name,
                    'ok' => false,
                    'error_code' => 'UNKNOWN_ERROR',
                    'message' => $e->getMessage()
                ];
                $summary['failed']++;
            }
        }

        return response()->json([
            'ok' => true,
            'summary' => $summary,
            'results' => $results,
        ]);
    }
}
