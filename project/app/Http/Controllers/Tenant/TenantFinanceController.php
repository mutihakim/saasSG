<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\Wallet\WalletCashflowService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantFinanceController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly WalletCashflowService $cashflow,
    ) {}

    public function index(Request $request, string $tenant): RedirectResponse
    {
        return redirect()->route('tenant.finance.home', ['tenant' => $tenant]);
    }

    public function transactions(Request $request, string $tenant): Response|HttpResponse
    {
        return $this->renderPage($request, initialTab: 'transactions', section: 'transactions', title: 'Transactions');
    }

    public function reports(Request $request, string $tenant): Response|HttpResponse
    {
        $requestedView = (string) $request->query('view', 'report');
        $initialTab = $requestedView === 'stats' ? 'stats' : 'report';

        return $this->renderPage($request, initialTab: $initialTab, section: 'reports', title: 'Reports');
    }

    public function budgets(Request $request, string $tenant): Response|HttpResponse
    {
        $query = ['view' => 'budgets'];
        $periodMonth = (string) $request->query('period_month', '');
        if ($periodMonth !== '') {
            $query['period_month'] = $periodMonth;
        }

        return redirect()->route('tenant.finance.planning', ['tenant' => $tenant] + $query);
    }

    private function renderPage(
        Request $request,
        string $initialTab,
        string $section,
        string $title,
    ): Response|HttpResponse
    {
        $tenantModel = $request->attributes->get('currentTenant');
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $activeAccounts = $tenantModel->bankAccounts()->active()->count();
        $activeBudgets = $tenantModel->budgets()->active()->count();
        $shouldPreloadAccounts = in_array($section, ['transactions', 'reports'], true);
        $shouldPreloadBudgets = in_array($section, ['transactions', 'reports'], true);
        $shouldPreloadPockets = $section === 'transactions';
        $accounts = $shouldPreloadAccounts
            ? $this->access->accessibleAccountsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderBy('name')
                ->get()
            : collect();
        $pockets = $shouldPreloadPockets
            ? $this->access->accessiblePocketsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderByDesc('is_system')
                ->orderBy('name')
                ->get()
            : collect();

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
            'accounts' => $shouldPreloadAccounts
                ? $this->cashflow->enrichAccounts(
                    $tenantModel,
                    $member,
                    $accounts,
                    detailLevel: WalletCashflowService::DETAIL_SUMMARY,
                )
                : [],
            'budgets' => $shouldPreloadBudgets
                ? $this->access->accessibleBudgetsQuery($tenantModel, $member)
                    ->active()
                    ->orderByDesc('period_month')
                    ->orderBy('name')
                    ->get()
                : [],
            'pockets' => $shouldPreloadPockets
                ? $this->cashflow->enrichPockets(
                    $tenantModel,
                    $member,
                    $pockets,
                    detailLevel: WalletCashflowService::DETAIL_SUMMARY,
                )
                : [],
            'transferDestinationPockets' => $section === 'transactions'
                ? $tenantModel->pockets()
                    ->with(['ownerMember:id,full_name', 'memberAccess:id,full_name', 'realAccount:id,name,type,currency_code'])
                    ->active()
                    ->orderBy('scope')
                    ->orderByDesc('is_system')
                    ->orderBy('name')
                    ->get()
                : [],
            'activeMemberId' => $member?->id,
            'permissions' => [
                'create' => $request->user()?->can('finance.create') ?? false,
                'update' => $request->user()?->can('finance.update') ?? false,
                'delete' => $request->user()?->can('finance.delete') ?? false,
                'manageShared' => $this->access->canManageSharedStructures($member),
                'managePrivateStructures' => $this->access->canCreatePrivateStructures($member),
            ],
            'walletSubscribed' => $this->entitlements->can($tenantModel, 'finance', 'view'),
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
            'financeRoute' => [
                'section' => $section,
                'initial_tab' => $initialTab,
                'title' => $title,
                'back_href' => '/hub',
                'preloaded' => [
                    'accounts' => $shouldPreloadAccounts,
                    'budgets' => $shouldPreloadBudgets,
                    'pockets' => $shouldPreloadPockets,
                ],
            ],
        ]);
    }
}
