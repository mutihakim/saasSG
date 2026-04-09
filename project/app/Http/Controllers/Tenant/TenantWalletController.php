<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FinanceSavingsGoal;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\WalletWish;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\Wallet\WalletCashflowService;
use App\Services\Finance\Wallet\WalletSummaryService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantWalletController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly WalletSummaryService $summary,
        private readonly WalletCashflowService $cashflow,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function home(Request $request, string $tenant): Response
    {
        return $this->renderPage($request, initialTab: 'dashboard', section: 'home', title: 'Finance', entityLabel: 'Home');
    }

    public function accounts(Request $request, string $tenant): Response
    {
        return $this->renderPage($request, initialTab: 'accounts', section: 'accounts', title: 'Finance', entityLabel: 'Wallets');
    }

    public function planning(Request $request, string $tenant): Response
    {
        $view = $request->string('view')->toString();
        $initialTab = match ($view) {
            'budgets' => 'budgets',
            'wishes' => 'wishes',
            default => 'goals',
        };
        $periodMonth = $request->string('period_month')->toString();
        if ($periodMonth === '') {
            $periodMonth = now()->format('Y-m');
        }

        return $this->renderPage($request, initialTab: $initialTab, section: 'planning', title: 'Finance', entityLabel: 'Planning', periodMonth: $periodMonth);
    }

    public function review(Request $request, string $tenant): Response
    {
        return $this->renderPage($request, initialTab: 'dashboard', section: 'review', title: 'Finance', entityLabel: 'Monthly Review', openMonthlyReview: true);
    }

    private function renderPage(
        Request $request,
        string $initialTab,
        string $section,
        string $title,
        string $entityLabel,
        bool $openMonthlyReview = false,
        ?string $periodMonth = null,
    ): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $selectedPeriodMonth = $periodMonth ?: now()->format('Y-m');
        $loadAccounts = false;
        $loadPockets = in_array($section, ['home', 'planning'], true);
        $loadBudgets = $section === 'planning' && $initialTab === 'budgets';
        $loadGoals = $section === 'home' || ($section === 'planning' && $initialTab === 'goals');
        $loadWishes = $section === 'home' || ($section === 'planning' && $initialTab === 'wishes');
        $loadSummary = in_array($section, ['home', 'review'], true);
        $loadMonthlyReview = in_array($section, ['home', 'review'], true);

        $accounts = collect();
        if ($loadAccounts) {
            $accounts = $this->access->accessibleAccountsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderBy('name')
                ->get();
        }

        $pockets = collect();
        $accessiblePocketIds = collect();
        if ($loadPockets || $loadGoals) {
            $pockets = $this->access->accessiblePocketsQuery($tenantModel, $member)
                ->active()
                ->orderBy('scope')
                ->orderByDesc('is_system')
                ->orderBy('name')
                ->get();
            $accessiblePocketIds = $pockets->pluck('id');
        }

        return Inertia::render('Tenant/Wallet/Page', [
            'accounts' => $loadAccounts
                ? $this->cashflow->enrichAccounts(
                    $tenantModel,
                    $member,
                    $accounts,
                    detailLevel: $section === 'accounts'
                        ? WalletCashflowService::DETAIL_SUMMARY
                        : WalletCashflowService::DETAIL_FULL,
                )
                : collect(),
            'pockets' => $loadPockets
                ? $this->cashflow->enrichPockets(
                    $tenantModel,
                    $member,
                    $pockets,
                    detailLevel: $section === 'accounts'
                        ? WalletCashflowService::DETAIL_SUMMARY
                        : WalletCashflowService::DETAIL_FULL,
                )
                : collect(),
            'budgets' => $loadBudgets
                ? $this->access->accessibleBudgetsQuery($tenantModel, $member)
                    ->active()
                    ->forPeriod($selectedPeriodMonth)
                    ->orderBy('name')
                    ->get()
                : [],
            'goals' => ($loadGoals ? FinanceSavingsGoal::query()
                ->forTenant($tenantModel->id)
                ->with([
                    'pocket:id,name,real_account_id,current_balance,currency_code,scope,icon_key',
                    'pocket.realAccount:id,name,currency_code,type',
                    'ownerMember:id,full_name',
                ])
                ->withCount('financialTransactions as activities_count')
                ->whereIn('pocket_id', $accessiblePocketIds)
                ->orderByDesc('created_at')
                ->get() : collect()),
            'wishes' => ($loadWishes ? WalletWish::query()
                ->forTenant($tenantModel->id)
                ->with(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])
                ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 when status = 'converted' then 2 else 3 end")
                ->orderByDesc('created_at')
                ->get() : collect()),
            'summary' => $loadSummary ? $this->summary->build($tenantModel, $member) : null,
            'monthlyReview' => $loadMonthlyReview ? $this->monthlyReview->buildStatus($tenantModel, $member) : null,
            'members' => $tenantModel->members()
                ->where('profile_status', 'active')
                ->orderBy('full_name')
                ->get(['id', 'full_name', 'role_code']),
            'currencies' => TenantCurrency::forTenant($tenantModel->id)
                ->active()
                ->ordered()
                ->get(['id', 'code', 'name', 'symbol', 'symbol_position', 'decimal_places']),
            'categories' => TenantCategory::forTenant($tenantModel->id)
                ->forModule('finance')
                ->active()
                ->ordered()
                ->get(['id', 'name', 'sub_type', 'icon', 'color', 'is_default']),
            'paymentMethods' => collect(\App\Enums\PaymentMethod::cases())->map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
            'defaultCurrency' => $tenantModel->currency_code,
            'walletSubscribed' => $this->entitlements->can($tenantModel, 'finance', 'view'),
            'activeMemberId' => $member?->id,
            'permissions' => [
                'create' => $request->user()?->can('finance.create') ?? false,
                'update' => $request->user()?->can('finance.update') ?? false,
                'delete' => $request->user()?->can('finance.delete') ?? false,
                'manageShared' => $this->access->canManageSharedStructures($member),
                'managePrivateStructures' => $this->access->canCreatePrivateStructures($member),
            ],
            'limits' => [
                'accounts' => $this->entitlements->limit($tenantModel, 'finance.accounts.max'),
                'pockets' => $this->entitlements->limit($tenantModel, 'finance.pockets.max'),
                'goals' => $this->entitlements->limit($tenantModel, 'finance.goals.max'),
                'wishes' => $this->entitlements->limit($tenantModel, 'finance.wishes.max'),
            ],
            'financeRoute' => [
                'section' => $section,
                'initial_tab' => $initialTab,
                'title' => $title,
                'entity_label' => $entityLabel,
                'back_href' => '/hub',
                'open_monthly_review' => $openMonthlyReview,
                'period_month' => $selectedPeriodMonth,
                'preloaded' => [
                    'accounts' => $loadAccounts,
                    'pockets' => $loadPockets,
                    'budgets' => $loadBudgets,
                    'goals' => $loadGoals,
                    'wishes' => $loadWishes,
                    'summary' => $loadSummary,
                    'monthly_review' => $loadMonthlyReview,
                ],
            ],
        ]);
    }
}
