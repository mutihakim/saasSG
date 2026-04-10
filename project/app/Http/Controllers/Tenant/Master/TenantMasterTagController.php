<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantTag;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterTagController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Tags/Index', [
            'tags'        => TenantTag::forTenant($tenantModel->id)
                ->popular()
                ->get(['id', 'name', 'color', 'usage_count', 'is_active', 'row_version', 'created_at']),
            'permissions' => [
                'create' => $request->user()?->can('master.tags.create') ?? false,
                'update' => $request->user()?->can('master.tags.update') ?? false,
                'delete' => $request->user()?->can('master.tags.delete') ?? false,
            ],
        ]);
    }
}
