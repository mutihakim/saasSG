<?php

namespace App\Observers;

use App\Jobs\FinanceSummaryRecalcJob;
use App\Models\Finance\FinanceTransaction;
use App\Services\Finance\FinanceSummaryService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

class FinanceTransactionObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(
        private readonly FinanceSummaryService $summary,
    ) {
    }

    public function created(FinanceTransaction $transaction): void
    {
        $this->invalidateTenantCaches($transaction);
    }

    public function updated(FinanceTransaction $transaction): void
    {
        $this->invalidateTenantCaches($transaction);
    }

    public function deleted(FinanceTransaction $transaction): void
    {
        $this->invalidateTenantCaches($transaction);
    }

    public function restored(FinanceTransaction $transaction): void
    {
        $this->invalidateTenantCaches($transaction);
    }

    public function forceDeleted(FinanceTransaction $transaction): void
    {
        $this->invalidateTenantCaches($transaction);
    }

    private function invalidateTenantCaches(FinanceTransaction $transaction): void
    {
        if (! $transaction->tenant_id) {
            return;
        }

        $tenantId = (int) $transaction->tenant_id;

        $this->summary->invalidateTenantCaches($tenantId);
        FinanceSummaryRecalcJob::dispatch($tenantId)->afterCommit();
    }
}
