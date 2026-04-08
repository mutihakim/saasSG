<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FinanceSavingsGoal;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\WalletWish;
use App\Services\FinanceAccessService;
use App\Services\MonthlyReviewService;
use App\Services\WalletCashflowService;
use App\Services\WalletSummaryService;
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

    public function index(Request $request, string $tenant): Response
    {
        $tenantModel = $request->attributes->get('currentTenant');
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $accessiblePocketIds = $this->access->accessiblePocketsQuery($tenantModel, $member)->pluck('finance_pockets.id');

        $accounts = $this->access->accessibleAccountsQuery($tenantModel, $member)
            ->active()
            ->orderBy('scope')
            ->orderBy('name')
            ->get();
        $pockets = $this->access->accessiblePocketsQuery($tenantModel, $member)
            ->active()
            ->orderBy('scope')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tenant/Wallet/Page', [
            'accounts' => $this->cashflow->enrichAccounts($tenantModel, $member, $accounts),
            'pockets' => $this->cashflow->enrichPockets($tenantModel, $member, $pockets),
            'budgets' => $this->access->accessibleBudgetsQuery($tenantModel, $member)
                ->active()
                ->forPeriod(now()->format('Y-m'))
                ->orderBy('name')
                ->get(),
            'goals' => FinanceSavingsGoal::query()
                ->forTenant($tenantModel->id)
                ->with(['pocket:id,name,real_account_id,current_balance', 'ownerMember:id,full_name'])
                ->whereIn('pocket_id', $accessiblePocketIds)
                ->orderByDesc('created_at')
                ->get(),
            'wishes' => WalletWish::query()
                ->forTenant($tenantModel->id)
                ->with(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,pocket_id'])
                ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 when status = 'converted' then 2 else 3 end")
                ->orderByDesc('created_at')
                ->get(),
            'summary' => $this->summary->build($tenantModel, $member),
            'monthlyReview' => $this->monthlyReview->buildStatus($tenantModel, $member),
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
            'walletSubscribed' => $this->entitlements->can($tenantModel, 'wallet', 'view'),
            'activeMemberId' => $member?->id,
            'permissions' => [
                'create' => $request->user()?->can('wallet.create') ?? false,
                'update' => $request->user()?->can('wallet.update') ?? false,
                'delete' => $request->user()?->can('wallet.delete') ?? false,
                'manageShared' => $this->access->canManageSharedStructures($member),
                'managePrivateStructures' => $this->access->canCreatePrivateStructures($member),
            ],
            'limits' => [
                'accounts' => $this->entitlements->limit($tenantModel, 'finance.accounts.max'),
                'pockets' => $this->entitlements->limit($tenantModel, 'wallet.pockets.max'),
                'goals' => $this->entitlements->limit($tenantModel, 'wallet.goals.max'),
                'wishes' => $this->entitlements->limit($tenantModel, 'wallet.wishes.max'),
            ],
        ]);
    }
}
