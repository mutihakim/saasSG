<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantFinanceController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        $tenantModel = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/Finance/Page', [
            'categories'      => TenantCategory::forTenant($tenantModel->id)
                ->forModule('finance')
                ->active()
                ->ordered()
                ->get(['id', 'name', 'sub_type', 'icon', 'color', 'is_default']),
            'currencies'      => TenantCurrency::forTenant($tenantModel->id)
                ->active()
                ->ordered()
                ->get(['id', 'code', 'name', 'symbol', 'symbol_position', 'decimal_places']),
            'defaultCurrency' => $tenantModel->currency_code ?? 'IDR',
            'paymentMethods'  => collect(\App\Enums\PaymentMethod::cases())
                ->map(fn ($m) => ['value' => $m->value, 'label' => $m->label(), 'icon' => $m->icon()])
                ->values(),
            'permissions' => [
                'create' => $request->user()?->can('finance.create') ?? false,
                'update' => $request->user()?->can('finance.update') ?? false,
                'delete' => $request->user()?->can('finance.delete') ?? false,
            ],
        ]);
    }
}
