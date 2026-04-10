<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterCategoryController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Categories/Index', [
            'categories' => TenantCategory::forTenant($tenantModel->id)
                ->with('children')
                ->roots()
                ->ordered()
                ->get(['id', 'parent_id', 'module', 'sub_type', 'name', 'description', 'icon', 'color', 'is_default', 'is_active', 'row_version', 'created_at']),
            'modules'     => ['finance', 'grocery', 'inventory', 'task', 'medical', 'wishlist'],
            'permissions' => [
                'create' => $request->user()?->can('master.categories.create') ?? false,
                'update' => $request->user()?->can('master.categories.update') ?? false,
                'delete' => $request->user()?->can('master.categories.delete') ?? false,
            ],
        ]);
    }
}
