<?php

namespace App\Http\Controllers\Api\V1\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCategory;
use App\Models\Tenant\Tenant;
use App\Services\ActivityLogService;
use App\Support\MasterDataPagination;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterCategoryApiController extends Controller
{
    public function __construct(
        private readonly SubscriptionEntitlements $entitlements,
        private readonly ActivityLogService $activityLogs,
    ) {}

    // GET /master/categories
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantCategory::class);

        $resolved = MasterDataPagination::resolve($request);
        $moduleFilters = MasterDataPagination::stringList($request, 'module');
        $typeFilters = MasterDataPagination::stringList($request, 'sub_type');
        $statusFilters = MasterDataPagination::stringList($request, 'status');
        $name = trim($request->string('name')->toString());
        $description = trim($request->string('description')->toString());
        $nameTerms = MasterDataPagination::searchTerms($name);
        $descriptionTerms = MasterDataPagination::searchTerms($description);
        $rootsOnly = $request->boolean('roots_only', false);
        $includeChildren = ! $request->boolean('exclude_children', false);
        $allowedSorts = ['name', 'description', 'module', 'sub_type', 'is_active'];
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString()) === 'desc' ? 'desc' : 'asc';
        $sortColumn = in_array($sortBy, $allowedSorts, true) ? $sortBy : 'name';

        $query = TenantCategory::forTenant($tenant->id)
            ->withCount('children')
            ->roots();

        $applySort = static function ($builder) use ($sortColumn, $sortDirection) {
            $builder->withCount('children')
                ->orderBy($sortColumn, $sortDirection)
                ->orderBy('sort_order')
                ->orderBy('id');
        };

        $applySort($query);

        if ($includeChildren) {
            $query->with(['children' => function ($childQuery) use ($applySort) {
                $applySort($childQuery);
            }]);
        }

        if ($rootsOnly) {
            $query->roots();
        }

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
            $query->where(function ($searchQuery) use ($includeChildren, $nameTerms) {
                $searchQuery->where(function ($directQuery) use ($nameTerms) {
                    MasterDataPagination::applyTokenizedContains($directQuery, 'name', $nameTerms);
                });

                if ($includeChildren) {
                    $searchQuery->orWhereHas('children', function ($childQuery) use ($nameTerms) {
                        MasterDataPagination::applyTokenizedContains($childQuery, 'name', $nameTerms);
                    });
                }
            });
        }

        if ($descriptionTerms !== []) {
            $query->where(function ($searchQuery) use ($descriptionTerms, $includeChildren) {
                $searchQuery->where(function ($directQuery) use ($descriptionTerms) {
                    MasterDataPagination::applyTokenizedContains($directQuery, 'description', $descriptionTerms);
                });

                if ($includeChildren) {
                    $searchQuery->orWhereHas('children', function ($childQuery) use ($descriptionTerms) {
                        MasterDataPagination::applyTokenizedContains($childQuery, 'description', $descriptionTerms);
                    });
                }
            });
        }

        $categories = $query->paginate(
            $resolved['per_page'],
            ['id', 'name', 'description', 'sub_type', 'icon', 'color', 'is_default', 'is_active', 'module', 'parent_id', 'row_version'],
            'page',
            $resolved['page']
        );

        $statsQuery = TenantCategory::forTenant($tenant->id);
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'finance' => (clone $statsQuery)->where('module', 'finance')->count(),
            'grocery' => (clone $statsQuery)->where('module', 'grocery')->count(),
            'task' => (clone $statsQuery)->where('module', 'task')->count(),
        ];

        return response()->json([
            'ok'   => true,
            'data' => [
                'categories' => $categories->items(),
                'pagination' => MasterDataPagination::meta($categories, $resolved),
                'stats' => $stats,
                'sort' => [
                    'by' => $sortColumn,
                    'direction' => $sortDirection,
                ],
            ],
        ]);
    }

    // POST /master/categories
    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantCategory::class);

        $limit = $this->entitlements->limit($tenant, 'master.categories.max');
        if ($limit !== null && $limit !== -1) {
            $current = TenantCategory::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_default', false)
                ->whereNull('deleted_at')
                ->count();

            if ($current >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'limit_key' => 'master.categories.max',
                    'message' => "Batas {$limit} kategori master tercapai. Upgrade plan untuk menambah kategori.",
                ], 422);
            }
        }

        $data = $request->validate([
            'name'       => [
                'required',
                'string',
                'max:100',
                Rule::unique('tenant_categories')->where(function ($query) use ($tenant, $request) {
                    return $query
                        ->where('tenant_id', $tenant->id)
                        ->where('module', $request->get('module'))
                        ->where('sub_type', $request->get('sub_type'))
                        ->whereNull('deleted_at');
                }),
            ],
            'module'     => ['required', 'string', 'max:50'],
            'parent_id'  => ['nullable', 'integer'],
            'sub_type'   => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'icon'       => ['nullable', 'string', 'max:60'],
            'color'      => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = TenantCategory::create([
            'tenant_id'  => $tenant->id,
            'module'     => $data['module'],
            'sub_type'   => $data['sub_type'] ?? null,
            'parent_id'  => $data['parent_id'] ?? null,
            'name'       => $data['name'],
            'description' => $data['description'] ?? null,
            'icon'       => $data['icon'] ?? 'ri-price-tag-3-line',
            'color'      => $data['color'] ?? '#95A5A6',
            'is_default' => false,
            'is_active'  => true,
            'sort_order' => $data['sort_order'] ?? 50,
        ]);

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.category.created',
            'tenant_categories',
            $category->id,
            null,
            $this->activityLogs->snapshot($category),
            ['module' => $category->module]
        );

        return response()->json(['ok' => true, 'data' => ['category' => $category]], 201);
    }

    // PATCH /master/categories/{category}
    public function update(Request $request, Tenant $tenant, TenantCategory $category): JsonResponse
    {
        $this->authorize('update', $category);
        abort_if((int) $category->tenant_id !== (int) $tenant->id, 404);

        if ($category->is_default) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'FORBIDDEN',
                'message'    => 'Kategori default tidak dapat diubah.',
            ], 403);
        }

        $data = $request->validate([
            'name'       => [
                'required',
                'string',
                'max:100',
                Rule::unique('tenant_categories')
                    ->ignore($category->id)
                    ->where(fn ($q) => $q
                        ->where('tenant_id', $tenant->id)
                        ->where('module', $category->module)
                        ->where('sub_type', $request->get('sub_type'))
                        ->whereNull('deleted_at')),
            ],
            'parent_id'  => ['nullable', 'integer'],
            'sub_type'   => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'icon'       => ['nullable', 'string', 'max:60'],
            'color'      => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active'  => ['nullable', 'boolean'],
            'row_version' => ['required', 'integer'],
        ]);

        $before = $this->activityLogs->snapshot($category);
        $beforeVersion = (int) $category->row_version;

        $category->update([
            'name'       => $data['name'],
            'sub_type'   => $data['sub_type'] ?? $category->sub_type,
            'parent_id'  => array_key_exists('parent_id', $data) ? $data['parent_id'] : $category->parent_id,
            'description' => array_key_exists('description', $data) ? $data['description'] : $category->description,
            'icon'       => $data['icon'] ?? $category->icon,
            'color'      => $data['color'] ?? $category->color,
            'sort_order' => $data['sort_order'] ?? $category->sort_order,
            'is_active'  => $data['is_active'] ?? $category->is_active,
        ]);

        $fresh = $category->fresh();
        $this->activityLogs->log(
            $request,
            $tenant,
            'master.category.updated',
            'tenant_categories',
            $category->id,
            $before,
            $this->activityLogs->snapshot($fresh),
            ['module' => $category->module],
            $beforeVersion,
            (int) $fresh->row_version
        );

        return response()->json(['ok' => true, 'data' => ['category' => $fresh]]);
    }

    // DELETE /master/categories/{category}
    public function destroy(Request $request, Tenant $tenant, TenantCategory $category): JsonResponse
    {
        $request->validate(['row_version' => 'required|integer']);
        $this->authorize('delete', $category);
        abort_if((int) $category->tenant_id !== (int) $tenant->id, 404);

        if ($category->is_default) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'FORBIDDEN',
                'message'    => 'Kategori default tidak dapat dihapus.',
            ], 403);
        }

        $childCount = $category->children()->count();
        if ($childCount > 0) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'CATEGORY_HAS_CHILDREN',
                'message'    => "Kategori tidak dapat dihapus karena masih memiliki {$childCount} sub-kategori.",
            ], 422);
        }

        $txCount = $category->financeTransactions()->count();
        if ($txCount > 0) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'CATEGORY_IN_USE',
                'message'    => "Kategori tidak dapat dihapus karena masih digunakan oleh {$txCount} transaksi.",
            ], 422);
        }

        $before = $this->activityLogs->snapshot($category);
        $beforeVersion = (int) $category->row_version;
        $category->delete();

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.category.deleted',
            'tenant_categories',
            $category->id,
            $before,
            null,
            ['module' => $category->module],
            $beforeVersion,
            null
        );

        return response()->json(['ok' => true]);
    }

    // DELETE /master/categories (bulk)
    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', TenantCategory::class);
        $ids = $request->validate(['ids' => 'required|array|min:1'])['ids'];

        $categories = TenantCategory::forTenant($tenant->id)
            ->whereIn('id', $ids)
            ->withCount(['financeTransactions', 'children'])
            ->get();

        $results = [];
        $idsToDestroy = [];
        $categoriesToDestroy = [];

        foreach ($categories as $category) {
            if ($category->is_default) {
                $results[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'ok' => false,
                    'error_code' => 'IS_SYSTEM'
                ];
                continue;
            }

            if ($category->children_count > 0) {
                $results[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'ok' => false,
                    'error_code' => 'HAS_CHILDREN'
                ];
                continue;
            }

            if ($category->finance_transactions_count > 0) {
                $results[] = [
                    'id' => $category->id,
                    'name' => $category->name,
                    'ok' => false,
                    'error_code' => 'IN_USE'
                ];
                continue;
            }

            $idsToDestroy[] = $category->id;
            $categoriesToDestroy[] = $category;
            $results[] = [
                'id' => $category->id,
                'name' => $category->name,
                'ok' => true
            ];
        }

        $count = 0;
        if (!empty($idsToDestroy)) {
            $count = TenantCategory::forTenant($tenant->id)
                ->whereIn('id', $idsToDestroy)
                ->delete();

            foreach ($categoriesToDestroy as $category) {
                $this->activityLogs->log(
                    $request,
                    $tenant,
                    'master.category.deleted',
                    'tenant_categories',
                    $category->id,
                    $this->activityLogs->snapshot($category),
                    null,
                    ['module' => $category->module, 'bulk' => true],
                    (int) $category->row_version,
                    null
                );
            }

            $this->activityLogs->log(
                $request,
                $tenant,
                'master.category.bulk_deleted',
                'tenants',
                $tenant->id,
                null,
                null,
                [
                    'ids' => $idsToDestroy,
                    'deleted_count' => $count,
                ]
            );
        }

        return response()->json([
            'ok' => true,
            'summary' => [
                'total' => count($ids),
                'deleted' => $count,
                'failed' => count($results) - $count
            ],
            'results' => $results
        ]);
    }

    // PATCH /master/categories/bulk-parent
    public function bulkSetParent(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('update', TenantCategory::class);
        $data = $request->validate([
            'ids'       => 'required|array|min:1',
            'parent_id' => 'nullable|integer',
        ]);

        $categories = TenantCategory::forTenant($tenant->id)
            ->whereIn('id', $data['ids'])
            ->where('is_default', false)
            ->get();

        $count = TenantCategory::forTenant($tenant->id)
            ->whereIn('id', $categories->pluck('id'))
            ->update(['parent_id' => $data['parent_id']]);

        foreach ($categories as $category) {
            $after = $this->activityLogs->snapshot(array_merge(
                $category->attributesToArray(),
                ['parent_id' => $data['parent_id']]
            ));

            $this->activityLogs->log(
                $request,
                $tenant,
                'master.category.updated',
                'tenant_categories',
                $category->id,
                $this->activityLogs->snapshot($category),
                $after,
                ['module' => $category->module, 'bulk' => true],
                (int) $category->row_version,
                (int) $category->row_version
            );
        }

        $this->activityLogs->log(
            $request,
            $tenant,
            'master.category.bulk_parent_updated',
            'tenants',
            $tenant->id,
            null,
            null,
            [
                'ids' => $categories->pluck('id')->values()->all(),
                'updated_count' => $count,
                'parent_id' => $data['parent_id'],
            ]
        );

        return response()->json(['ok' => true, 'updated' => $count]);
    }
}
