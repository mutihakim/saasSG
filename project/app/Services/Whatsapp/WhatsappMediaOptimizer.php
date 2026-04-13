<?php

namespace App\Services\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Whatsapp\TenantWhatsappMedia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Handles image optimization and storage for WhatsApp media attachments.
 * Converts images to WebP under a size limit with iterative quality reduction.
 */
class WhatsappMediaOptimizer
{
    private const WEBP_QUALITIES = [82, 76, 70, 64, 58, 52, 46, 40, 34];
    private const MAX_ITERATIONS = 6;
    private const MIN_DIMENSION = 320;
    private const MAX_DIMENSION_BEFORE_SCALE = 480;
    private const SCALE_FACTOR = 0.85;

    /**
     * Optimize an image to WebP under the given size limit and store it.
     * Returns the storage path, file info.
     */
    public function optimizeAndStoreImage(TenantWhatsappMedia $media, string $storagePath, int $maxBytes = 102_400): ?array
    {
        $contents = Storage::get($media->storage_path);
        if ($contents === null) {
            return null;
        }

        $image = @imagecreatefromstring($contents);
        if (!$image) {
            return null;
        }

        $this->prepareImageResource($image);
        $optimized = $this->encodeWebpUnderLimit($image, $maxBytes);
        imagedestroy($image);

        Storage::put($storagePath, $optimized);

        return [
            'path' => $storagePath,
            'mime_type' => 'image/webp',
            'file_size' => strlen($optimized),
        ];
    }

    /**
     * Build a unique storage path for a transaction attachment.
     */
    public function transactionAttachmentPath(int $tenantId, string $transactionId, int $mediaId): string
    {
        return sprintf(
            'tenants/%d/finance/attachments/transactions/%s/%s.webp',
            $tenantId,
            $transactionId,
            Str::uuid()->toString()
        );
    }

    /**
     * Build a storage path for a group (bulk) attachment.
     */
    public function groupAttachmentPath(Tenant $tenant, string $sourceId, TenantWhatsappMedia $media, string $extension): string
    {
        return sprintf(
            'tenants/%d/finance/attachments/groups/%s/%d.%s',
            $tenant->id,
            $sourceId,
            $media->id,
            ltrim($extension, '.')
        );
    }

    /**
     * Generate a filename for a group attachment.
     */
    public function groupAttachmentFileName(TenantWhatsappMedia $media, ?string $extension = null): string
    {
        $resolvedExtension = $extension ?: $this->resolveMediaExtension($media);
        return sprintf('whatsapp-%d.%s', $media->id, $resolvedExtension);
    }

    /**
     * Resolve the file extension from media storage path or MIME type.
     */
    public function resolveMediaExtension(TenantWhatsappMedia $media): string
    {
        $extension = pathinfo((string) $media->storage_path, PATHINFO_EXTENSION);
        if ($extension === '') {
            $extension = Str::lower((string) Str::afterLast($media->mime_type, '/')) ?: 'bin';
        }
        return ltrim(Str::lower($extension), '.');
    }

    /**
     * Resolve MIME type from media record.
     */
    public function resolveMediaMimeType(TenantWhatsappMedia $media): string
    {
        return $media->mime_type ?: 'application/octet-stream';
    }

    /**
     * Check if the media type is an optimizable image.
     */
    public function isOptimizableImage(TenantWhatsappMedia $media): bool
    {
        return in_array((string) $media->mime_type, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    /**
     * Prepare GD image resource for optimal quality (truecolor + alpha).
     */
    private function prepareImageResource(\GdImage $image): void
    {
        if (function_exists('imagepalettetotruecolor')) {
            @imagepalettetotruecolor($image);
        }
        imagealphablending($image, false);
        imagesavealpha($image, true);
    }

    /**
     * Encode image to WebP with iterative quality reduction and downscaling
     * until the result is under the byte limit.
     */
    private function encodeWebpUnderLimit(\GdImage $image, int $maxBytes): string
    {
        $current = $image;
        $ownsCurrent = false;
        $bestBytes = null;

        for ($iteration = 0; $iteration < self::MAX_ITERATIONS; $iteration++) {
            foreach (self::WEBP_QUALITIES as $quality) {
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
            if ($width <= self::MAX_DIMENSION_BEFORE_SCALE && $height <= self::MAX_DIMENSION_BEFORE_SCALE) {
                break;
            }

            $scaled = imagescale(
                $current,
                max(self::MIN_DIMENSION, (int) floor($width * self::SCALE_FACTOR)),
                max(self::MIN_DIMENSION, (int) floor($height * self::SCALE_FACTOR)),
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

        return $bestBytes ?? throw new \RuntimeException('Failed to optimize WhatsApp image attachment.');
    }

    /**
     * Encode a GD image to WebP format.
     */
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
}
