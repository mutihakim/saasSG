<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantFinanceController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
    ) {}

    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        $tenantModel = $request->attributes->get('currentTenant');
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $activeAccounts = $tenantModel->bankAccounts()->active()->count();
        $activeBudgets = $tenantModel->budgets()->active()->count();

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
            'members' => $tenantModel->members()
                ->where('profile_status', 'active')
                ->orderBy('full_name')
                ->get(['id', 'full_name', 'role_code']),
            'accounts' => $this->access->accessibleAccountsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderBy('name')
                ->get(),
            'budgets' => $this->access->accessibleBudgetsQuery($tenantModel, $member)
                ->active()
                ->orderByDesc('period_month')
                ->orderBy('name')
                ->get(),
            'pockets' => $this->access->accessiblePocketsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderByDesc('is_system')
                ->orderBy('name')
                ->get(),
            'transferDestinationPockets' => $tenantModel->pockets()
                ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code'])
                ->active()
                ->orderBy('scope')
                ->orderByDesc('is_system')
                ->orderBy('name')
                ->get(),
            'activeMemberId' => $member?->id,
            'permissions' => [
                'create' => $request->user()?->can('finance.create') ?? false,
                'update' => $request->user()?->can('finance.update') ?? false,
                'delete' => $request->user()?->can('finance.delete') ?? false,
                'manageShared' => $this->access->canManageSharedStructures($member),
                'managePrivateStructures' => $this->access->canCreatePrivateStructures($member),
            ],
            'walletSubscribed' => $this->entitlements->can($tenantModel, 'wallet', 'view'),
            'limits' => [
                'accounts' => [
                    'current' => $activeAccounts,
                    'limit' => $this->entitlements->limit($tenantModel, 'finance.accounts.max'),
                ],
                'budgets' => [
                    'current' => $activeBudgets,
                    'limit' => $this->entitlements->limit($tenantModel, 'finance.budgets.active.max'),
                ],
            ],
        ]);
    }
}
