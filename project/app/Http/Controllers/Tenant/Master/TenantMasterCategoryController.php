<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\TenantCategory;
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
                ->get(['id', 'parent_id', 'type', 'name', 'icon', 'color', 'is_active', 'created_at']),
            'modules'     => ['finance', 'grocery', 'inventory', 'task', 'medical', 'wishlist'],
            'permissions' => [
                'create' => $request->user()?->can('master.categories.create') ?? false,
                'update' => $request->user()?->can('master.categories.update') ?? false,
                'delete' => $request->user()?->can('master.categories.delete') ?? false,
            ],
        ]);
    }
}
