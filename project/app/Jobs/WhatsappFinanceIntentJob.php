<?php

namespace App\Jobs;

use App\Models\Whatsapp\TenantWhatsappIntent;
use App\Services\Finance\Whatsapp\Actions\ExecuteFinanceIntentAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class WhatsappFinanceIntentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     * AI extraction might take time, especially with images.
     */
    public $timeout = 120;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    public function __construct(
        private readonly int $intentId
    ) {
    }

    public function handle(ExecuteFinanceIntentAction $executeAction): void
    {
        $intent = TenantWhatsappIntent::query()->find($this->intentId);

        if (!$intent) {
            Log::error('whatsapp.finance.intent.job.failed_missing_intent', [
                'intent_id' => $this->intentId,
            ]);
            return;
        }

        if ($intent->status === 'parsed' || $intent->status === 'submitted') {
            Log::info('whatsapp.finance.intent.job.skipped_already_processed', [
                'intent_id' => $intent->id,
                'status' => $intent->status,
            ]);
            return;
        }

        $executeAction->handle($intent);
    }
}
