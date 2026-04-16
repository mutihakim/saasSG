<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantTag;
use App\Support\MasterDataPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterTagController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
        $resolved = MasterDataPagination::resolve($request);
        $name = trim($request->string('name')->toString());
        $nameTerms = MasterDataPagination::searchTerms($name);
        $usageExpression = trim((string) $request->input('usage', ''));
        $usageMin = $request->input('usage_min');
        $usageMax = $request->input('usage_max');
        $usageRange = $usageExpression !== ''
            ? MasterDataPagination::parseNumberExpression($usageExpression)
            : [
                'min' => is_numeric($usageMin) ? (int) $usageMin : null,
                'max' => is_numeric($usageMax) ? (int) $usageMax : null,
            ];
        $allowedSorts = ['name', 'usage_count', 'created_at'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'name';

        $query = TenantTag::forTenant($tenantModel->id)->popular();

        if ($nameTerms !== []) {
            MasterDataPagination::applyTokenizedContains($query, 'name', $nameTerms);
        }

        if ($usageRange['min'] !== null) {
            $query->where('usage_count', '>=', $usageRange['min']);
        }

        if ($usageRange['max'] !== null) {
            $query->where('usage_count', '<=', $usageRange['max']);
        }

        $query->orderBy($sortColumn, $sortDirection)->orderBy('id');

        $tags = $query->paginate(
            $resolved['per_page'],
            ['id', 'name', 'color', 'usage_count', 'is_active', 'row_version', 'created_at'],
            'page',
            $resolved['page']
        );

        return Inertia::render('Tenant/MasterData/Tags/Index', [
            'tags' => $tags->items(),
            'pagination' => MasterDataPagination::meta($tags, $resolved),
            'filters' => [
                'name' => $name,
                'usage' => $usageExpression,
            ],
            'sort' => [
                'by' => $sortColumn,
                'direction' => $sortDirection,
            ],
            'permissions' => [
                'create' => $request->user()?->can('master.tags.create') ?? false,
                'update' => $request->user()?->can('master.tags.update') ?? false,
                'delete' => $request->user()?->can('master.tags.delete') ?? false,
            ],
        ]);
    }
}
