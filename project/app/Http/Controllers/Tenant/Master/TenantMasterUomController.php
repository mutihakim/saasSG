<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\Master\TenantUom;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterUomController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Uom/Index', [
            'units'          => TenantUom::forTenant($tenantModel->id)
                ->active()
                ->ordered()
                ->get(['id', 'code', 'name', 'abbreviation', 'dimension_type', 'base_unit_code', 'base_factor', 'is_active', 'sort_order']),
            'dimensionTypes'  => ['berat', 'volume', 'jumlah', 'panjang', 'luas', 'waktu', 'lainnya'],
            'permissions'     => [
                'create' => $request->user()?->can('master.uom.create') ?? false,
                'update' => $request->user()?->can('master.uom.update') ?? false,
                'delete' => $request->user()?->can('master.uom.delete') ?? false,
            ],
        ]);
    }
}
