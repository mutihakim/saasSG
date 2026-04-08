<?php

namespace App\Services;

use App\Jobs\ProcessFinanceAttachmentImage;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Throwable;

class FinanceTransactionAttachmentMutationService
{
    public function __construct(
        private readonly FinanceAttachmentService $attachmentService,
        private readonly FinanceTransactionCleanupService $cleanup,
    ) {
    }

    public function uploadAttachments(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $payload = $request->validate([
            'attachments' => ['required', 'array', 'min:1', 'max:10'],
            'attachments.*' => ['file', 'max:5120', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf'],
        ]);

        try {
            $this->attachmentService->ensureAsyncAttachmentSchemaReady();
        } catch (RuntimeException $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 503);
        }

        $existingSortOrder = (int) $transaction->attachments()->max('sort_order');
        $created = [];
        $backgroundProcessingWarning = false;

        foreach ($payload['attachments'] as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $planned = $this->attachmentService->planUploadedFile($transaction, $file);
            $createdAttachment = $transaction->attachments()->create([
                'tenant_id' => $tenant->id,
                'file_name' => $planned['file_name'],
                'file_path' => $planned['path'],
                'mime_type' => $planned['mime_type'],
                'file_size' => $planned['file_size'],
                'label' => null,
                'sort_order' => $existingSortOrder + $index + 1,
                'row_version' => 1,
                'status' => $planned['status'],
                'processing_error' => null,
                'processed_at' => $planned['status'] === 'ready' ? now() : null,
            ]);

            try {
                $this->attachmentService->writeUploadedFile($file, $planned['path']);

                if (($planned['needs_processing'] ?? false) === false) {
                    $createdAttachment->forceFill([
                        'status' => 'ready',
                        'processing_error' => null,
                        'processed_at' => now(),
                    ])->save();
                }
            } catch (Throwable $e) {
                $this->attachmentService->deletePhysicalFile($planned['path']);

                $createdAttachment->forceFill([
                    'status' => 'failed',
                    'processing_error' => mb_substr(trim($e->getMessage()) ?: 'Failed to store attachment upload.', 0, 500),
                    'processed_at' => null,
                ])->save();

                $created[] = $createdAttachment->fresh();

                continue;
            }

            if (($planned['needs_processing'] ?? false) === true) {
                if (Config::get('queue.default') !== 'redis') {
                    $backgroundProcessingWarning = true;
                }

                try {
                    ProcessFinanceAttachmentImage::dispatch((int) $createdAttachment->id)
                        ->onConnection('redis')
                        ->onQueue('finance-media');
                } catch (Throwable) {
                    $backgroundProcessingWarning = true;
                }
            }

            $created[] = $createdAttachment->fresh();
        }

        return response()->json([
            'ok' => true,
            'data' => [
                'attachments' => collect($created)
                    ->map(fn (TenantAttachment $attachment) => $this->attachmentService->payload($tenant, $transaction, $attachment))
                    ->values()
                    ->all(),
                'background_processing_warning' => $backgroundProcessingWarning,
            ],
        ], 201);
    }

    public function destroyAttachment(TenantAttachment $attachment): JsonResponse
    {
        $this->cleanup->deleteAttachmentRecord($attachment);

        return response()->json(['ok' => true]);
    }
}
