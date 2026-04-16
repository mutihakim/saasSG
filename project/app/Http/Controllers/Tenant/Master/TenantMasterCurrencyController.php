<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCurrency;
use App\Support\MasterDataPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterCurrencyController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
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

        $query = TenantCurrency::forTenant($tenantModel->id);
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

        return Inertia::render('Tenant/MasterData/Currencies/Index', [
            'currencies' => $currencies->items(),
            'pagination' => MasterDataPagination::meta($currencies, $resolved),
            'filters' => [
                'code' => $code,
                'name' => $name,
                'symbol' => $symbol,
                'symbol_position' => $positionFilters,
                'status' => $statusFilters,
            ],
            'sort' => [
                'by' => $sortColumn,
                'direction' => $sortDirection,
            ],
            'permissions' => [
                'create' => $request->user()?->can('master.currencies.create') ?? false,
                'update' => $request->user()?->can('master.currencies.update') ?? false,
                'delete' => $request->user()?->can('master.currencies.delete') ?? false,
            ],
        ]);
    }
}
