<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinanceSavingsGoal;
use App\Models\Tenant\Tenant;
use App\Models\Finance\WalletWish;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceSummaryService;
use App\Services\Finance\FinanceReportService;
use App\Services\Finance\MonthlyReviewService;
use App\Services\Finance\Transactions\FinanceTransactionQueryService;
use App\Services\Finance\Wallet\WalletCashflowService;
use App\Services\Finance\Wallet\WalletSummaryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceBootstrapApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly WalletCashflowService $cashflow,
        private readonly WalletSummaryService $walletSummary,
        private readonly MonthlyReviewService $monthlyReview,
        private readonly FinanceTransactionQueryService $transactionQueries,
        private readonly FinanceSummaryService $summary,
        private readonly FinanceReportService $reports,
    ) {
    }

    public function show(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);

        $validated = $request->validate([
            'section' => ['nullable', Rule::in(['home', 'accounts', 'planning', 'review', 'transactions', 'reports'])],
            'view' => ['nullable', Rule::in(['budgets', 'goals', 'wishes'])],
            'month' => ['nullable', 'date_format:Y-m'],
            'active_only' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],

            // Filters for transactions summary/list
            'search' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:pemasukan,pengeluaran,transfer'],
            'category_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'max:10'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'bank_account_id' => ['nullable', 'string', 'size:26'],
            'wallet_id' => ['nullable', 'string', 'size:26'],
            'budget_id' => ['nullable', 'string', 'size:26'],
            'owner_member_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'transaction_kind' => ['nullable', 'in:all,external,internal_transfer'],

            // Filters for report
            'group_by' => ['nullable', 'in:day,week,month'],
        ]);

        $section = (string) ($validated['section'] ?? 'home');
        $planningView = (string) ($validated['view'] ?? 'budgets');
        $periodMonth = (string) ($validated['month'] ?? now()->format('Y-m'));
        $activeOnly = (bool) ($validated['active_only'] ?? true);

        $loadAccounts = in_array($section, ['home', 'accounts', 'reports'], true);
        $loadBudgets = ($section === 'planning' && $planningView === 'budgets') || $section === 'reports';
        $loadGoals = $section === 'home' || ($section === 'planning' && $planningView === 'goals');
        $loadWishes = $section === 'home' || ($section === 'planning' && $planningView === 'wishes');
        $loadWallets = in_array($section, ['home', 'accounts', 'planning', 'transactions'], true) || $loadGoals;
        $loadWalletSummary = in_array($section, ['home', 'accounts', 'review'], true);
        $loadMonthlyReview = in_array($section, ['home', 'review'], true);
        $loadTransactions = $section === 'transactions';
        $loadFinanceSummary = $section === 'transactions';
        $loadReport = $section === 'reports';

        $accounts = collect();
        if ($loadAccounts) {
            $accounts = $this->access->accessibleAccountsSummaryQuery($tenant, $member)
                ->when($activeOnly, fn ($query) => $query->active())
                ->orderBy('scope')
                ->orderBy('name')
                ->get();
            $accounts = $this->cashflow->enrichAccounts(
                $tenant,
                $member,
                $accounts,
                detailLevel: WalletCashflowService::DETAIL_SUMMARY,
            );
        }

        $wallets = collect();
        if ($loadWallets) {
            $wallets = $this->access->accessiblePocketsSummaryQuery($tenant, $member)
                ->when($activeOnly, fn ($query) => $query->active())
                ->orderBy('scope')
                ->orderByDesc('is_system')
                ->orderBy('name')
                ->get();
            $wallets = $this->cashflow->enrichPockets(
                $tenant,
                $member,
                $wallets,
                detailLevel: WalletCashflowService::DETAIL_SUMMARY,
            );
        }

        $budgets = collect();
        if ($loadBudgets) {
            $budgets = $this->access->accessibleBudgetsQuery($tenant, $member)
                ->when($activeOnly, fn ($query) => $query->active())
                ->when($section === 'planning', fn ($query) => $query->forPeriod($periodMonth))
                ->orderByDesc('period_month')
                ->orderBy('name')
                ->get();
        }

        $goals = collect();
        if ($loadGoals) {
            $accessibleWalletIds = $wallets->pluck('id');
            $goals = FinanceSavingsGoal::query()
                ->forTenant($tenant->id)
                ->with([
                    'pocket:id,name,real_account_id,current_balance,currency_code,scope,icon_key',
                    'pocket.realAccount:id,name,currency_code,type',
                    'ownerMember:id,full_name',
                ])
                ->withCount('financialTransactions as activities_count')
                ->whereIn('wallet_id', $accessibleWalletIds)
                ->orderByDesc('created_at')
                ->get();
        }

        $wishes = collect();
        if ($loadWishes) {
            $wishes = WalletWish::query()
                ->forTenant($tenant->id)
                ->with(['ownerMember:id,full_name', 'approvedByMember:id,full_name', 'goal:id,name,wallet_id'])
                ->orderByRaw("case when status = 'pending' then 0 when status = 'approved' then 1 when status = 'converted' then 2 else 3 end")
                ->orderByDesc('created_at')
                ->get();
        }

        $transactions = [];
        $transactionsMeta = null;
        if ($loadTransactions) {
            if (! $request->filled('month') && ! $request->filled('date_from') && ! $request->filled('date_to')) {
                $request->merge(['month' => $periodMonth]);
            }
            if (! $request->filled('per_page')) {
                $request->merge(['per_page' => 10]);
            }

            $transactionsPayload = $this->transactionQueries->paginatedTransactions($request, $tenant, $member);
            $transactions = $transactionsPayload['transactions'] ?? [];
            $transactionsMeta = $transactionsPayload['meta'] ?? null;
        }

        $financeSummary = null;
        if ($loadFinanceSummary) {
            $summaryFilters = collect([
                'search' => $validated['search'] ?? null,
                'type' => $validated['type'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'currency_code' => $validated['currency_code'] ?? null,
                'payment_method' => $validated['payment_method'] ?? null,
                'bank_account_id' => $validated['bank_account_id'] ?? null,
                'wallet_id' => $validated['wallet_id'] ?? null,
                'budget_id' => $validated['budget_id'] ?? null,
                'owner_member_id' => $validated['owner_member_id'] ?? null,
                'month' => $validated['month'] ?? $periodMonth,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
                'transaction_kind' => $validated['transaction_kind'] ?? null,
            ])->filter(fn ($value) => $value !== null && $value !== '')->all();

            $financeSummary = $this->transactionQueries->filteredSummary($tenant, $member, $summaryFilters);
        }

        $report = null;
        if ($loadReport) {
            $reportFilters = [
                'date_from' => $validated['date_from'] ?? CarbonImmutable::createFromFormat('Y-m', $periodMonth)->startOfMonth()->toDateString(),
                'date_to' => $validated['date_to'] ?? CarbonImmutable::createFromFormat('Y-m', $periodMonth)->endOfMonth()->toDateString(),
                'group_by' => $validated['group_by'] ?? 'day',
                'account_id' => $validated['bank_account_id'] ?? null,
                'budget_id' => $validated['budget_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'owner_member_id' => $validated['owner_member_id'] ?? null,
            ];

            $report = $this->reports->getReport($tenant, $member, $reportFilters);
        }

        return response()->json([
            'ok' => true,
            'data' => [
                'section' => $section,
                'view' => $section === 'planning' ? $planningView : null,
                'period_month' => $periodMonth,
                'cache_version' => $this->summary->cacheVersion($tenant->id),
                'preloaded' => [
                    'accounts' => $loadAccounts,
                    'wallets' => $loadWallets,
                    'budgets' => $loadBudgets,
                    'goals' => $loadGoals,
                    'wishes' => $loadWishes,
                    'summary' => $loadWalletSummary || $loadFinanceSummary,
                    'monthly_review' => $loadMonthlyReview,
                    'transactions' => $loadTransactions,
                    'report' => $loadReport,
                ],
                'accounts' => $accounts,
                'wallets' => $wallets,
                'budgets' => $budgets,
                'goals' => $goals,
                'wishes' => $wishes,
                'wallet_summary' => $loadWalletSummary ? $this->walletSummary->build($tenant, $member) : null,
                'monthly_review' => $loadMonthlyReview ? $this->monthlyReview->buildStatus($tenant, $member) : null,
                'finance_summary' => $financeSummary,
                'transactions' => $transactions,
                'transactions_meta' => $transactionsMeta,
                'report' => $report,
            ],
        ]);
    }
}
