<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterCurrency;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterCurrencyApiController extends Controller
{
    // GET /master/currencies
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', MasterCurrency::class);

        $query = MasterCurrency::query()
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
        $this->authorize('create', MasterCurrency::class);

        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:master_currencies,code',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'symbol_position' => 'required|in:before,after',
            'decimal_places' => 'required|integer|min:0|max:4',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        try {
            $currency = MasterCurrency::create([
                'code' => strtoupper($validated['code']),
                'name' => $validated['name'],
                'symbol' => $validated['symbol'],
                'symbol_position' => $validated['symbol_position'],
                'decimal_places' => $validated['decimal_places'],
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

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

    // PATCH /master/currencies/{code}
    public function update(Request $request, Tenant $tenant, string $code): JsonResponse
    {
        $this->authorize('update', MasterCurrency::class);

        $currency = MasterCurrency::where('code', strtoupper($code))->firstOrFail();

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:3|unique:master_currencies,code,' . $currency->code . ',code',
            'name' => 'sometimes|required|string|max:255',
            'symbol' => 'sometimes|required|string|max:10',
            'symbol_position' => 'sometimes|required|in:before,after',
            'decimal_places' => 'sometimes|required|integer|min:0|max:4',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'row_version' => 'sometimes|integer',
        ]);

        // Optimistic locking
        if (isset($validated['row_version']) && $currency->row_version !== $validated['row_version']) {
            return response()->json([
                'ok' => false,
                'message' => 'The currency was modified by another user. Please refresh and try again.',
            ], 409);
        }

        try {
            $currency->update([
                'code' => strtoupper($validated['code'] ?? $currency->code),
                'name' => $validated['name'] ?? $currency->name,
                'symbol' => $validated['symbol'] ?? $currency->symbol,
                'symbol_position' => $validated['symbol_position'] ?? $currency->symbol_position,
                'decimal_places' => $validated['decimal_places'] ?? $currency->decimal_places,
                'is_active' => $validated['is_active'] ?? $currency->is_active,
                'sort_order' => $validated['sort_order'] ?? $currency->sort_order,
            ]);

            return response()->json([
                'ok' => true,
                'data' => $currency->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Failed to update currency: ' . $e->getMessage(),
            ], 500);
        }
    }

    // DELETE /master/currencies/{code}
    public function destroy(Request $request, Tenant $tenant, string $code): JsonResponse
    {
        $this->authorize('delete', MasterCurrency::class);

        $currency = MasterCurrency::where('code', strtoupper($code))->firstOrFail();

        // Check if currency is being used
        $isUsed = $currency->transactions()->exists();
        if ($isUsed) {
            return response()->json([
                'ok' => false,
                'message' => 'Cannot delete currency that is already in use.',
            ], 422);
        }

        $currency->delete();

        return response()->json([
            'ok' => true,
            'message' => 'Currency deleted successfully.',
        ]);
    }
}
