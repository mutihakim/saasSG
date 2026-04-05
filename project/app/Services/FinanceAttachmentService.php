<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FinanceAttachmentService
{
    public function payload(Tenant $tenant, FinanceTransaction $transaction, TenantAttachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'mime_type' => $attachment->mime_type,
            'file_size' => $attachment->file_size,
            'label' => $attachment->label,
            'sort_order' => $attachment->sort_order,
            'preview_url' => route('api.finance.transactions.attachments.preview', [
                'tenant' => $tenant,
                'transaction' => $transaction,
                'attachment' => $attachment,
            ], false),
        ];
    }

    public function storeUploadedFile(FinanceTransaction $transaction, UploadedFile $file): array
    {
        $mimeType = $file->getClientMimeType() ?: $file->getMimeType() ?: 'application/octet-stream';
        if ($this->isConvertibleImageMime($mimeType)) {
            return $this->storeOptimizedImageAttachment(
                transaction: $transaction,
                contents: file_get_contents($file->getRealPath()) ?: '',
                originalName: $file->getClientOriginalName() ?: ('attachment-' . Str::uuid() . '.webp'),
                fallbackMimeType: $mimeType,
            );
        }

        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
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
        ];
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
        if ($filePath === '') {
            return null;
        }

        $candidates = [$filePath];
        if (!Str::startsWith($filePath, 'tenants/')) {
            $candidates[] = sprintf('tenants/%d/%s', (int) $attachment->tenant_id, $filePath);
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

    private function storeOptimizedImageAttachment(
        FinanceTransaction $transaction,
        string $contents,
        string $originalName,
        string $fallbackMimeType,
    ): array {
        $image = @imagecreatefromstring($contents);
        if (!$image) {
            $fileName = Str::uuid()->toString() . '.webp';
            $path = $this->tenantTransactionAttachmentPath(
                tenantId: (int) $transaction->tenant_id,
                transactionId: (string) $transaction->id,
                fileName: $fileName,
            );
            Storage::put($path, $contents);

            return [
                'path' => $path,
                'file_name' => $this->normalizedWebpName($originalName),
                'mime_type' => $fallbackMimeType,
                'file_size' => strlen($contents),
            ];
        }

        $this->prepareImageResource($image);
        $optimized = $this->encodeWebpUnderLimit($image, 100 * 1024);
        imagedestroy($image);

        $fileName = Str::uuid()->toString() . '.webp';
        $path = $this->tenantTransactionAttachmentPath(
            tenantId: (int) $transaction->tenant_id,
            transactionId: (string) $transaction->id,
            fileName: $fileName,
        );
        Storage::put($path, $optimized);

        return [
            'path' => $path,
            'file_name' => $this->normalizedWebpName($originalName),
            'mime_type' => 'image/webp',
            'file_size' => strlen($optimized),
        ];
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

    private function tenantTransactionAttachmentPath(int $tenantId, string $transactionId, string $fileName): string
    {
        return sprintf(
            'tenants/%d/finance/attachments/transactions/%s/%s',
            $tenantId,
            $transactionId,
            $fileName
        );
    }
}
