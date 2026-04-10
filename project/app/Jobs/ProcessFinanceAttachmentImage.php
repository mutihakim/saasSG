<?php

namespace App\Jobs;

use App\Models\Finance\FinanceTransaction;
use App\Models\Misc\TenantAttachment;
use App\Services\Finance\FinanceAttachmentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessFinanceAttachmentImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $attachmentId,
    ) {
    }

    public function handle(FinanceAttachmentService $attachments): void
    {
        $attachment = TenantAttachment::query()->find($this->attachmentId);
        if (! $attachment) {
            return;
        }

        $expectedMorphTypes = array_unique([
            FinanceTransaction::class,
            (new FinanceTransaction())->getMorphClass(),
        ]);

        if (! in_array((string) $attachment->attachable_type, $expectedMorphTypes, true)) {
            return;
        }

        if ($attachments->normalizeAttachmentStatus($attachment) !== 'processing') {
            return;
        }

        try {
            $attachments->processPendingImageAttachment($attachment);
        } catch (Throwable $e) {
            $attachment->forceFill([
                'status' => 'failed',
                'processing_error' => mb_substr(trim($e->getMessage()) ?: 'Failed to process image attachment.', 0, 500),
            ])->save();
        }
    }
}
