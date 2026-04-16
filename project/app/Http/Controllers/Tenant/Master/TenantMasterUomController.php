<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantUom;
use App\Support\MasterDataPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterUomController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
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
        $allowedSorts = ['code', 'name', 'abbreviation', 'dimension_type', 'base_factor', 'is_active'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'code';

        $query = TenantUom::forTenant($tenantModel->id);
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

        $query->orderBy($sortColumn, $sortDirection)->orderBy('id');

        $units = $query->paginate(
            $resolved['per_page'],
            ['id', 'code', 'name', 'abbreviation', 'dimension_type', 'base_unit_code', 'base_factor', 'is_active', 'sort_order', 'row_version'],
            'page',
            $resolved['page']
        );

        return Inertia::render('Tenant/MasterData/Uom/Index', [
            'units' => $units->items(),
            'pagination' => MasterDataPagination::meta($units, $resolved),
            'filters' => [
                'code' => $code,
                'name' => $name,
                'abbreviation' => $abbreviation,
                'dimension_type' => $dimensionTypes,
                'status' => $statusFilters,
                'base_factor' => $baseFactorExpression,
            ],
            'sort' => [
                'by' => $sortColumn,
                'direction' => $sortDirection,
            ],
            'dimensionTypes'  => ['berat', 'volume', 'jumlah', 'panjang', 'luas', 'waktu', 'lainnya'],
            'permissions'     => [
                'create' => $request->user()?->can('master.uom.create') ?? false,
                'update' => $request->user()?->can('master.uom.update') ?? false,
                'delete' => $request->user()?->can('master.uom.delete') ?? false,
            ],
        ]);
    }
}
