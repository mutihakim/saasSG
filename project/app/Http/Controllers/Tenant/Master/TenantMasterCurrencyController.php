<?php

namespace App\Http\Controllers\Tenant\Master;

use App\Http\Controllers\Controller;
use App\Models\TenantCurrency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantMasterCurrencyController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/MasterData/Currencies/Index', [
            'currencies'  => TenantCurrency::forTenant($tenantModel->id)->ordered()->get(['id', 'code', 'name', 'symbol', 'symbol_position', 'decimal_places', 'is_active', 'sort_order']),
            'permissions' => [
                'create' => $request->user()?->can('master.currencies.create') ?? false,
                'update' => $request->user()?->can('master.currencies.update') ?? false,
                'delete' => $request->user()?->can('master.currencies.delete') ?? false,
            ],
        ]);
    }
}
