<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCategory;
use App\Support\MasterDataPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterCategoryController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
        $resolved = MasterDataPagination::resolve($request);
        $moduleFilters = MasterDataPagination::stringList($request, 'module');
        $typeFilters = MasterDataPagination::stringList($request, 'sub_type');
        $statusFilters = MasterDataPagination::stringList($request, 'status');
        $name = trim($request->string('name')->toString());
        $description = trim($request->string('description')->toString());
        $nameTerms = MasterDataPagination::searchTerms($name);
        $descriptionTerms = MasterDataPagination::searchTerms($description);
        $allowedSorts = ['name', 'description', 'module', 'sub_type', 'is_active'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'name';

        $query = TenantCategory::forTenant($tenantModel->id)
            ->withCount('children')
            ->roots();

        $applySort = static function ($builder) use ($sortColumn, $sortDirection) {
            $builder->withCount('children')
                ->orderBy($sortColumn, $sortDirection)
                ->orderBy('sort_order')
                ->orderBy('id');
        };

        $applySort($query);
        $query->with(['children' => function ($childQuery) use ($applySort) {
            $applySort($childQuery);
        }]);

        if ($moduleFilters !== []) {
            $query->whereIn('module', $moduleFilters);
        }

        if ($typeFilters !== []) {
            $query->whereIn('sub_type', $typeFilters);
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

        if ($nameTerms !== []) {
            $query->where(function ($searchQuery) use ($nameTerms) {
                $searchQuery->where(function ($directQuery) use ($nameTerms) {
                    MasterDataPagination::applyTokenizedContains($directQuery, 'name', $nameTerms);
                })->orWhereHas('children', function ($childQuery) use ($nameTerms) {
                    MasterDataPagination::applyTokenizedContains($childQuery, 'name', $nameTerms);
                });
            });
        }

        if ($descriptionTerms !== []) {
            $query->where(function ($searchQuery) use ($descriptionTerms) {
                $searchQuery->where(function ($directQuery) use ($descriptionTerms) {
                    MasterDataPagination::applyTokenizedContains($directQuery, 'description', $descriptionTerms);
                })->orWhereHas('children', function ($childQuery) use ($descriptionTerms) {
                    MasterDataPagination::applyTokenizedContains($childQuery, 'description', $descriptionTerms);
                });
            });
        }

        $categories = $query->paginate(
            $resolved['per_page'],
            ['id', 'parent_id', 'module', 'sub_type', 'name', 'description', 'icon', 'color', 'is_default', 'is_active', 'row_version', 'created_at'],
            'page',
            $resolved['page']
        );

        $statsQuery = TenantCategory::forTenant($tenantModel->id);

        return Inertia::render('Tenant/MasterData/Categories/Index', [
            'categories' => $categories->items(),
            'pagination' => MasterDataPagination::meta($categories, $resolved),
            'filters' => [
                'name' => $name,
                'description' => $description,
                'module' => $moduleFilters,
                'sub_type' => $typeFilters,
                'status' => $statusFilters,
            ],
            'sort' => [
                'by' => $sortColumn,
                'direction' => $sortDirection,
            ],
            'stats' => [
                'total' => (clone $statsQuery)->count(),
                'finance' => (clone $statsQuery)->where('module', 'finance')->count(),
                'grocery' => (clone $statsQuery)->where('module', 'grocery')->count(),
                'task' => (clone $statsQuery)->where('module', 'task')->count(),
            ],
            'modules'     => ['finance', 'grocery', 'inventory', 'task', 'medical', 'wishlist'],
            'permissions' => [
                'create' => $request->user()?->can('master.categories.create') ?? false,
                'update' => $request->user()?->can('master.categories.update') ?? false,
                'delete' => $request->user()?->can('master.categories.delete') ?? false,
            ],
        ]);
    }
}
