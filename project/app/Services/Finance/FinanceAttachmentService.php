<?php

namespace App\Services\Finance;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FinanceAttachmentService
{
    public function payload(Tenant $tenant, FinanceTransaction $transaction, TenantAttachment $attachment): array
    {
        $status = $this->normalizeAttachmentStatus($attachment);

        return [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'mime_type' => $attachment->mime_type,
            'file_size' => $attachment->file_size,
            'label' => $attachment->label,
            'sort_order' => $attachment->sort_order,
            'status' => $status,
            'processing_error' => $attachment->processing_error,
            'processed_at' => optional($attachment->processed_at)?->toISOString(),
            'preview_url' => $status === 'ready'
                ? route('api.finance.transactions.attachments.preview', [
                    'tenant' => $tenant,
                    'transaction' => $transaction,
                    'attachment' => $attachment,
                ], false)
                : null,
        ];
    }

    public function ensureAsyncAttachmentSchemaReady(): void
    {
        if (Schema::hasColumns('tenant_attachments', ['status', 'processing_error', 'processed_at'])) {
            return;
        }

        throw new \RuntimeException('Attachment async schema is not ready. Run the latest tenant_attachments migration first.');
    }

    public function planUploadedFile(FinanceTransaction $transaction, UploadedFile $file): array
    {
        $mimeType = $file->getClientMimeType() ?: $file->getMimeType() ?: 'application/octet-stream';
        if ($this->isConvertibleImageMime($mimeType)) {
            $extension = $this->normalizedExtension(
                $file->getClientOriginalExtension() ?: $file->guessExtension(),
                $mimeType
            );
            $fileName = Str::uuid()->toString() . '.' . $extension;
            $path = $this->tenantTransactionAttachmentStagingPath(
                tenantId: (int) $transaction->tenant_id,
                transactionId: (string) $transaction->id,
                fileName: $fileName,
            );

            Storage::putFileAs(dirname($path), $file, basename($path));

            return [
                'path' => $path,
                'file_name' => $file->getClientOriginalName() ?: ('attachment-' . Str::uuid() . '.' . $extension),
                'mime_type' => $mimeType,
                'file_size' => $file->getSize() ?: 0,
                'status' => 'processing',
                'needs_processing' => true,
            ];
        }

        $extension = $this->normalizedExtension($file->getClientOriginalExtension() ?: $file->guessExtension(), $mimeType);
        $fileName = Str::uuid()->toString() . '.' . strtolower($extension);
        $path = $this->tenantTransactionAttachmentPath(
            tenantId: (int) $transaction->tenant_id,
            transactionId: (string) $transaction->id,
            fileName: $fileName,
        );

        Storage::putFileAs(dirname($path), $file, basename($path));

        return [
            'path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'file_size' => $file->getSize() ?: 0,
            'status' => 'ready',
            'needs_processing' => false,
        ];
    }

    public function writeUploadedFile(UploadedFile $file, string $path): void
    {
        $written = Storage::putFileAs(dirname($path), $file, basename($path));

        if ($written === false || ! Storage::exists($path)) {
            throw new \RuntimeException('Failed to store attachment upload.');
        }
    }

    public function deletePhysicalFile(?string $path): void
    {
        $normalized = ltrim((string) $path, '/');
        if ($normalized === '') {
            return;
        }

        if (Storage::exists($normalized)) {
            Storage::delete($normalized);
        }
    }

    public function belongsToTransaction(FinanceTransaction $transaction, TenantAttachment $attachment): bool
    {
        $expectedMorphTypes = array_unique([
            FinanceTransaction::class,
            $transaction->getMorphClass(),
        ]);

        return (int) $attachment->tenant_id === (int) $transaction->tenant_id
            && in_array((string) $attachment->attachable_type, $expectedMorphTypes, true)
            && (string) $attachment->attachable_id === (string) $transaction->id;
    }

    public function resolveStoragePath(TenantAttachment $attachment): ?string
    {
        $filePath = ltrim((string) ($attachment->file_path ?? ''), '/');
        $transactionId = (string) ($attachment->attachable_id ?? '');
        $baseName = $filePath !== '' ? basename($filePath) : '';
        $fileName = trim((string) ($attachment->file_name ?? ''));

        $candidates = [];

        if ($filePath !== '') {
            $candidates[] = $filePath;
            if (!Str::startsWith($filePath, 'tenants/')) {
                $candidates[] = sprintf('tenants/%d/%s', (int) $attachment->tenant_id, $filePath);
            }
        }

        if ($transactionId !== '' && $baseName !== '') {
            $candidates[] = sprintf(
                'tenants/%d/finance/attachments/transactions/%s/%s',
                (int) $attachment->tenant_id,
                $transactionId,
                $baseName
            );
            $candidates[] = sprintf('finance/attachments/transactions/%s/%s', $transactionId, $baseName);
        }

        if ($transactionId !== '' && $fileName !== '') {
            $candidates[] = sprintf(
                'tenants/%d/finance/attachments/transactions/%s/%s',
                (int) $attachment->tenant_id,
                $transactionId,
                $fileName
            );
            $candidates[] = sprintf('finance/attachments/transactions/%s/%s', $transactionId, $fileName);
        }

        foreach (array_unique($candidates) as $candidate) {
            if (Storage::exists($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    public function isConvertibleImageMime(?string $mimeType): bool
    {
        return in_array((string) $mimeType, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    public function processPendingImageAttachment(TenantAttachment $attachment): void
    {
        $transactionId = (string) $attachment->attachable_id;
        $resolvedPath = $this->resolveStoragePath($attachment);

        if ($resolvedPath === null) {
            throw new \RuntimeException('Attachment staging file not found.');
        }

        $contents = Storage::get($resolvedPath);
        $image = @imagecreatefromstring($contents);
        if (!$image) {
            throw new \RuntimeException('Failed to decode image attachment.');
        }

        $this->prepareImageResource($image);
        $optimized = $this->encodeWebpUnderLimit($image, 100 * 1024);
        imagedestroy($image);

        $fileName = Str::uuid()->toString() . '.webp';
        $path = $this->tenantTransactionAttachmentPath(
            tenantId: (int) $attachment->tenant_id,
            transactionId: $transactionId,
            fileName: $fileName,
        );
        Storage::put($path, $optimized);

        $attachment->forceFill([
            'file_path' => $path,
            'file_name' => $this->normalizedWebpName((string) $attachment->file_name),
            'mime_type' => 'image/webp',
            'file_size' => strlen($optimized),
            'status' => 'ready',
            'processing_error' => null,
            'processed_at' => now(),
        ])->save();

        if ($resolvedPath !== $path && Storage::exists($resolvedPath)) {
            Storage::delete($resolvedPath);
        }
    }

    public function normalizeAttachmentStatus(TenantAttachment $attachment): string
    {
        $status = strtolower(trim((string) ($attachment->status ?? '')));

        return in_array($status, ['processing', 'ready', 'failed'], true) ? $status : 'ready';
    }

    private function encodeWebpUnderLimit(\GdImage $image, int $maxBytes): string
    {
        $current = $image;
        $ownsCurrent = false;
        $bestBytes = null;
        $qualities = [82, 76, 70, 64, 58, 52, 46, 40, 34];

        for ($iteration = 0; $iteration < 6; $iteration++) {
            foreach ($qualities as $quality) {
                $encoded = $this->encodeImageToWebp($current, $quality);
                if ($encoded === null) {
                    continue;
                }

                if ($bestBytes === null || strlen($encoded) < strlen($bestBytes)) {
                    $bestBytes = $encoded;
                }

                if (strlen($encoded) <= $maxBytes) {
                    if ($ownsCurrent && $current !== $image) {
                        imagedestroy($current);
                    }

                    return $encoded;
                }
            }

            $width = imagesx($current);
            $height = imagesy($current);
            if ($width <= 480 && $height <= 480) {
                break;
            }

            $scaled = imagescale(
                $current,
                max(320, (int) floor($width * 0.85)),
                max(320, (int) floor($height * 0.85)),
                IMG_BILINEAR_FIXED
            );

            if ($scaled === false) {
                break;
            }

            $this->prepareImageResource($scaled);
            if ($ownsCurrent && $current !== $image) {
                imagedestroy($current);
            }

            $current = $scaled;
            $ownsCurrent = true;
        }

        if ($ownsCurrent && $current !== $image) {
            imagedestroy($current);
        }

        return $bestBytes ?? throw new \RuntimeException('Failed to optimize image attachment.');
    }

    private function encodeImageToWebp(\GdImage $image, int $quality): ?string
    {
        ob_start();
        $success = imagewebp($image, null, $quality);
        $contents = ob_get_clean();

        if (!$success || !is_string($contents) || $contents === '') {
            return null;
        }

        return $contents;
    }

    private function prepareImageResource(\GdImage $image): void
    {
        if (function_exists('imagepalettetotruecolor')) {
            @imagepalettetotruecolor($image);
        }

        imagealphablending($image, false);
        imagesavealpha($image, true);
    }

    private function normalizedWebpName(string $originalName): string
    {
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        $name = trim($name) !== '' ? $name : 'attachment';

        return $name . '.webp';
    }

    private function normalizedExtension(?string $extension, string $mimeType): string
    {
        $clean = strtolower(trim((string) $extension));
        if ($clean !== '') {
            return $clean;
        }

        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            default => 'bin',
        };
    }

    private function tenantTransactionAttachmentPath(int $tenantId, string $transactionId, string $fileName): string
    {
        return sprintf(
            'tenants/%d/finance/attachments/transactions/%s/%s',
            $tenantId,
            $transactionId,
            $fileName
        );
    }

    private function tenantTransactionAttachmentStagingPath(int $tenantId, string $transactionId, string $fileName): string
    {
        return sprintf(
            'tenants/%d/finance/attachments/transactions/%s/staging/%s',
            $tenantId,
            $transactionId,
            $fileName
        );
    }
}
