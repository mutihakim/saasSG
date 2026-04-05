<?php

namespace App\Console\Commands;

use App\Models\FinanceTransaction;
use App\Models\TenantAttachment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NormalizeFinanceAttachments extends Command
{
    protected $signature = 'finance:attachments:normalize
        {--dry-run : Show planned changes without writing files or database rows}
        {--chunk=100 : Number of attachment rows to process per chunk}';

    protected $description = 'Normalize finance attachment polymorphic type, storage path, and optimize large images to WebP.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunkSize = max(1, (int) $this->option('chunk'));
        $targetMorphType = (new FinanceTransaction())->getMorphClass();

        $stats = [
            'inspected' => 0,
            'normalized_type' => 0,
            'normalized_path' => 0,
            'optimized_image' => 0,
            'optimized_under_limit' => 0,
            'missing_files' => 0,
            'updated_rows' => 0,
        ];

        TenantAttachment::withTrashed()
            ->whereIn('attachable_type', [$targetMorphType, FinanceTransaction::class])
            ->orderBy('id')
            ->chunkById($chunkSize, function ($attachments) use ($dryRun, $targetMorphType, &$stats) {
                foreach ($attachments as $attachment) {
                    $stats['inspected']++;
                    $updates = [];

                    if ((string) $attachment->attachable_type !== $targetMorphType) {
                        $updates['attachable_type'] = $targetMorphType;
                        $stats['normalized_type']++;
                    }

                    $resolvedPath = $this->resolveExistingPath($attachment);
                    if ($resolvedPath === null) {
                        $stats['missing_files']++;

                        if (!empty($updates) && !$dryRun) {
                            $attachment->forceFill($updates)->save();
                            $stats['updated_rows']++;
                        }

                        continue;
                    }

                    $currentSize = max(
                        (int) (Storage::size($resolvedPath) ?: 0),
                        (int) ($attachment->file_size ?: 0)
                    );
                    $shouldOptimizeImage = $this->isConvertibleImageMime($attachment->mime_type)
                        && $currentSize > 100 * 1024;

                    if ($shouldOptimizeImage) {
                        $optimized = $this->optimizeImageContents((string) Storage::get($resolvedPath), 100 * 1024);

                        if ($optimized !== null) {
                            $targetPath = $this->normalizedTransactionPath($attachment, $resolvedPath, 'webp');
                            $targetFileName = $this->normalizedWebpName((string) $attachment->file_name);

                            if (!$dryRun) {
                                Storage::makeDirectory(dirname($targetPath));
                                Storage::put($targetPath, $optimized);

                                if ($resolvedPath !== $targetPath && Storage::exists($resolvedPath)) {
                                    Storage::delete($resolvedPath);
                                }
                            }

                            if ((string) $attachment->file_path !== $targetPath) {
                                $updates['file_path'] = $targetPath;
                                $stats['normalized_path']++;
                            }

                            $updates['file_name'] = $targetFileName;
                            $updates['mime_type'] = 'image/webp';
                            $updates['file_size'] = strlen($optimized);
                            $stats['optimized_image']++;
                            if (strlen($optimized) <= 100 * 1024) {
                                $stats['optimized_under_limit']++;
                            }
                        }
                    } else {
                        $normalizedPath = $this->normalizedTransactionPath(
                            $attachment,
                            $resolvedPath,
                            pathinfo($resolvedPath, PATHINFO_EXTENSION) ?: pathinfo((string) $attachment->file_path, PATHINFO_EXTENSION)
                        );

                        if ($resolvedPath !== $normalizedPath) {
                            if (!$dryRun) {
                                Storage::makeDirectory(dirname($normalizedPath));
                                Storage::put($normalizedPath, (string) Storage::get($resolvedPath));

                                if (Storage::exists($resolvedPath)) {
                                    Storage::delete($resolvedPath);
                                }
                            }

                            $updates['file_path'] = $normalizedPath;
                            $stats['normalized_path']++;
                        } elseif ((string) $attachment->file_path !== $resolvedPath) {
                            $updates['file_path'] = $resolvedPath;
                            $stats['normalized_path']++;
                        }
                    }

                    if (!empty($updates) && !$dryRun) {
                        $attachment->forceFill($updates)->save();
                        $stats['updated_rows']++;
                    }
                }
            });

        foreach ($stats as $label => $value) {
            $this->line(sprintf('%s: %d', str_replace('_', ' ', $label), $value));
        }

        if ($dryRun) {
            $this->comment('Dry run only. No files or database rows were changed.');
        }

        return self::SUCCESS;
    }

    private function resolveExistingPath(TenantAttachment $attachment): ?string
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

    private function normalizedTransactionPath(TenantAttachment $attachment, string $resolvedPath, ?string $extension = null): string
    {
        $normalizedExtension = ltrim(Str::lower((string) $extension), '.');
        if ($normalizedExtension === '') {
            $normalizedExtension = ltrim(Str::lower((string) pathinfo($resolvedPath, PATHINFO_EXTENSION)), '.');
        }
        if ($normalizedExtension === '') {
            $normalizedExtension = 'bin';
        }

        return sprintf(
            'tenants/%d/finance/attachments/transactions/%s/%s.%s',
            (int) $attachment->tenant_id,
            (string) $attachment->attachable_id,
            pathinfo(basename($resolvedPath), PATHINFO_FILENAME),
            $normalizedExtension
        );
    }

    private function isConvertibleImageMime(?string $mimeType): bool
    {
        return in_array((string) $mimeType, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    private function optimizeImageContents(string $contents, int $maxBytes): ?string
    {
        $image = @imagecreatefromstring($contents);
        if (!$image) {
            return null;
        }

        $this->prepareImageResource($image);
        $optimized = $this->encodeWebpUnderLimit($image, $maxBytes);
        imagedestroy($image);

        return $optimized;
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

        return $bestBytes ?? throw new \RuntimeException('Failed to optimize finance attachment image.');
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
}
