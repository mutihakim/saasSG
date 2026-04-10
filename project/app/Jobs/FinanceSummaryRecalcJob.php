<?php

namespace App\Jobs;

use App\Models\Tenant\Tenant;
use App\Services\Finance\FinanceSummaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FinanceSummaryRecalcJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly int $tenantId,
    ) {
    }

    public function handle(FinanceSummaryService $summary): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (! $tenant) {
            return;
        }

        $summary->recalculateForTenant($tenant);
    }
}
