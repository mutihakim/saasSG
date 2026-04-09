<?php

namespace App\Services\Finance\Transactions;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceSummaryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class FinanceTransactionQueryService
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceSummaryService $summary,
        private readonly FinanceTransactionPresenter $presenter,
    ) {
    }

    public function visibleQuery(Tenant $tenant, ?TenantMember $member): Builder
    {
        return $this->access->visibleTransactionsQuery($tenant, $member);
    }

    public function applyFilters(Builder $query, Request|array $input): Builder
    {
        $filters = $input instanceof Request ? $input->all() : $input;

        return $query
            ->when($filters['search'] ?? null, fn (Builder $builder, string $search) => $builder->search($search))
            ->when($filters['type'] ?? null, fn (Builder $builder, string $type) => $builder->byType($type))
            ->when($filters['category_id'] ?? null, fn (Builder $builder, int|string $categoryId) => $builder->byCategory((int) $categoryId))
            ->when($filters['currency_code'] ?? null, fn (Builder $builder, string $currencyCode) => $builder->byCurrency($currencyCode))
            ->when($filters['payment_method'] ?? null, fn (Builder $builder, string $paymentMethod) => $builder->where('payment_method', $paymentMethod))
            ->when($filters['bank_account_id'] ?? null, fn (Builder $builder, string $accountId) => $builder->where('bank_account_id', $accountId))
            ->when($filters['pocket_id'] ?? null, fn (Builder $builder, string $pocketId) => $builder->where('pocket_id', $pocketId))
            ->when($filters['budget_id'] ?? null, fn (Builder $builder, string $budgetId) => $builder->where('budget_id', $budgetId))
            ->when($filters['owner_member_id'] ?? null, fn (Builder $builder, int|string $ownerMemberId) => $builder->where('owner_member_id', $ownerMemberId))
            ->when(($filters['transaction_kind'] ?? null) === 'external', fn (Builder $builder) => $builder->where('type', '!=', 'transfer'))
            ->when(($filters['transaction_kind'] ?? null) === 'internal_transfer', fn (Builder $builder) => $builder->where(function (Builder $internal) {
                $internal
                    ->where('type', 'transfer')
                    ->orWhere('is_internal_transfer', true);
            }))
            ->when($filters['month'] ?? null, fn (Builder $builder, string $month) => $builder->forMonth($month))
            ->when(! ($filters['month'] ?? null), fn (Builder $builder) => $builder->byDateRange($filters['date_from'] ?? null, $filters['date_to'] ?? null));
    }

    public function paginatedTransactions(Request $request, Tenant $tenant, ?TenantMember $member): array
    {
        $query = $this->visibleQuery($tenant, $member)
            ->with($this->presenter->relationsForList())
            ->withCount('attachments');

        $this->applyFilters($query, $request);

        $sortField = in_array($request->sort, ['transaction_date', 'amount_base', 'created_at'], true)
            ? $request->sort
            : 'transaction_date';
        $direction = $request->direction === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortField, $direction);
        if ($sortField !== 'created_at') {
            $query->orderBy('created_at', $direction);
        }
        if ($sortField !== 'id') {
            $query->orderBy('id', $direction);
        }

        $perPage = max(1, min((int) ($request->per_page ?? 15), 100));
        $paginator = $query->paginate($perPage);

        return [
            'transactions' => collect($paginator->items())
                ->map(fn (FinanceTransaction $transaction) => $this->presenter->transactionForList($transaction))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ];
    }

    public function filteredSummary(Tenant $tenant, ?TenantMember $member, array $validated): array
    {
        $query = $this->visibleQuery($tenant, $member);
        $this->applyFilters($query, $validated);

        $excludeInternalTransfers = ! ($validated['owner_member_id'] ?? null)
            && $this->access->isPrivileged($member)
            && (($validated['transaction_kind'] ?? 'all') !== 'internal_transfer');

        // Build a stable cache key from the active filter params
        $filterPayload = array_filter($validated, fn ($v) => $v !== null && $v !== '');
        ksort($filterPayload);
        $cacheKey = sprintf(
            'finance_summary_filtered:%d:%d:%s',
            $tenant->id,
            $member?->id ?? 0,
            md5(json_encode($filterPayload) . ($excludeInternalTransfers ? '1' : '0')),
        );

        return $this->summary->getFilteredSummary($query, $tenant, [
            'exclude_internal_transfers' => $excludeInternalTransfers,
            'cache_key' => $cacheKey,
        ]);
    }

    public function exportQuery(Request $request, Tenant $tenant, ?TenantMember $member): Builder
    {
        $query = $this->visibleQuery($tenant, $member)
            ->with(['category:id,name', 'currency:code,symbol', 'bankAccount:id,name', 'budget:id,name', 'ownerMember:id,full_name', 'tags:id,name']);

        $this->applyFilters($query, $request);

        return $query->orderBy('transaction_date', 'desc');
    }
}
