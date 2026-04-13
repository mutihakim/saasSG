<?php

namespace App\Services\Finance\Whatsapp\Support;

use App\Models\Whatsapp\TenantWhatsappMedia;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WhatsappResponseParser
{
    public function isPreviewableMedia(TenantWhatsappMedia $media): bool
    {
        return Str::startsWith($media->mime_type, 'image/') || $media->mime_type === 'application/pdf';
    }

    public function loadMediaBase64(string $storagePath): ?string
    {
        if (! Storage::exists($storagePath)) {
            return null;
        }

        return base64_encode((string) Storage::get($storagePath));
    }

    public function normalizeAiResult(
        string $command,
        array $decoded,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences,
        string $provider = 'gemini',
        ?string $model = null
    ): array {
        $normalizedType = $this->normalizeTransactionType($decoded['type'] ?? null);
        $singleCategoryResolution = $this->resolveCategoryNormalization(
            $decoded['category_id'] ?? null,
            $normalizedType,
            $categoryReferences
        );

        $base = [
            'provider' => $provider,
            'model' => $model,
            'confidence_score' => (float) ($decoded['confidence_score'] ?? 0),
            'payload' => $decoded,
            'items' => [],
            'normalization' => [
                'single' => [
                    'transaction_type' => $normalizedType,
                    'category' => $singleCategoryResolution,
                ],
                'items' => [],
            ],
        ];

        if ($normalizedType) {
            $base['payload']['type'] = $normalizedType;
        }

        $base['payload']['category_id'] = $singleCategoryResolution['accepted_category_id'];

        if ($media) {
            $base['payload']['media_id'] = $media->id;
        }

        if ($command === 'bulk') {
            $itemNormalizations = [];
            $items = collect($decoded['items'] ?? [])
                ->filter(fn ($item) => is_array($item))
                ->map(function ($item, $index) use ($categoryReferences, &$itemNormalizations) {
                    $categoryResolution = $this->resolveCategoryNormalization(
                        $item['category_id'] ?? null,
                        'pengeluaran',
                        $categoryReferences
                    );
                    $payload = $item;
                    $payload['category_id'] = $categoryResolution['accepted_category_id'];
                    $itemNormalizations[] = [
                        'index' => $index,
                        'category' => $categoryResolution,
                    ];

                    return [
                        'sort_order' => $index,
                        'description' => (string) ($item['description'] ?? ''),
                        'amount' => isset($item['amount']) ? (float) $item['amount'] : null,
                        'currency_code' => (string) ($item['currency_code'] ?? ''),
                        'payload' => $payload,
                    ];
                })
                ->values()
                ->all();

            $base['items'] = $items;
            $base['normalization']['items'] = $itemNormalizations;
        }

        return $base;
    }

    public function parseStructuredSingle(string $text): array
    {
        $parts = explode('#', $text, 2);
        $description = trim((string) ($parts[0] ?? ''));
        $amount = isset($parts[1]) ? $this->normalizeMoneyToken((string) $parts[1]) : null;

        return [$description, $amount];
    }

    public function parseStructuredBulkItems(string $text, string $currencyCode): array
    {
        $segments = preg_split('/[\r\n,;]+/', $text);

        return collect($segments)
            ->map(fn ($segment) => trim((string) $segment))
            ->filter()
            ->map(function (string $segment, int $index) use ($currencyCode) {
                [$description, $amount] = $this->parseStructuredSingle($segment);
                if ($description === '' || $amount === null) {
                    return null;
                }

                return [
                    'sort_order' => $index,
                    'description' => $description,
                    'amount' => $amount,
                    'currency_code' => $currencyCode,
                    'payload' => [
                        'raw' => $segment,
                        'category_id' => null,
                        'category_hint' => null,
                        'notes' => null,
                    ],
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    public function fallbackBulkItems(?string $text, string $currencyCode): array
    {
        $lines = preg_split('/[\n,]+/', (string) $text);

        return collect($lines)
            ->map(fn ($line) => trim((string) $line))
            ->filter()
            ->values()
            ->map(function (string $line, int $index) use ($currencyCode) {
                [$amount, $description] = $this->extractSimpleAmountAndDescription($line);

                return [
                    'sort_order' => $index,
                    'description' => $description ?: $line,
                    'amount' => $amount,
                    'currency_code' => $currencyCode,
                    'payload' => [
                        'raw' => $line,
                        'category_id' => null,
                        'category_hint' => null,
                        'notes' => null,
                    ],
                ];
            })
            ->all();
    }

    public function extractSimpleAmountAndDescription(?string $text): array
    {
        $source = trim((string) $text);
        if ($source === '') {
            return [null, '', null];
        }

        preg_match('/(\d[\d\.\,]*\s*(rb|ribu|jt|juta)?)/iu', $source, $matches);
        $amountToken = $matches[1] ?? null;
        $amountValue = $amountToken ? $this->normalizeMoneyToken($amountToken) : null;
        $description = trim((string) str_replace((string) $amountToken, '', $source));

        return [$amountValue, $description ?: $source, $amountToken];
    }

    public function normalizeMoneyToken(string $token): ?float
    {
        $value = Str::lower(trim($token));
        $multiplier = 1;
        if (str_contains($value, 'rb') || str_contains($value, 'ribu')) {
            $multiplier = 1000;
        } elseif (str_contains($value, 'jt') || str_contains($value, 'juta')) {
            $multiplier = 1000000;
        }

        $numeric = preg_replace('/[^0-9\,\.]/', '', $value);
        if ($numeric === '') {
            return null;
        }

        $numeric = str_replace('.', '', $numeric);
        $numeric = str_replace(',', '.', $numeric);

        return (float) $numeric * $multiplier;
    }

    public function normalizeTransactionType(mixed $type): ?string
    {
        $value = Str::lower(trim((string) $type));

        return in_array($value, ['pemasukan', 'pengeluaran'], true) ? $value : null;
    }

    public function resolveCategoryNormalization(mixed $categoryId, ?string $transactionType, Collection $categoryReferences): array
    {
        $requestedCategoryId = is_numeric($categoryId) ? (int) $categoryId : null;
        if ($requestedCategoryId === null) {
            return [
                'requested_category_id' => $categoryId,
                'accepted_category_id' => null,
                'transaction_type' => $transactionType,
                'matched' => false,
                'reason' => 'not_numeric',
            ];
        }

        $category = $categoryReferences->first(fn (array $item) => (int) $item['id'] === $requestedCategoryId);
        if (! $category) {
            return [
                'requested_category_id' => $requestedCategoryId,
                'accepted_category_id' => null,
                'transaction_type' => $transactionType,
                'matched' => false,
                'reason' => 'not_found_in_tenant_categories',
            ];
        }

        $subType = (string) ($category['sub_type'] ?? 'all');
        if (! $transactionType || $subType === '' || $subType === 'all') {
            return [
                'requested_category_id' => $requestedCategoryId,
                'accepted_category_id' => $requestedCategoryId,
                'transaction_type' => $transactionType,
                'matched' => true,
                'reason' => 'accepted',
            ];
        }

        if ($subType !== $transactionType) {
            return [
                'requested_category_id' => $requestedCategoryId,
                'accepted_category_id' => null,
                'transaction_type' => $transactionType,
                'matched' => false,
                'reason' => 'sub_type_mismatch',
            ];
        }

        return [
            'requested_category_id' => $requestedCategoryId,
            'accepted_category_id' => $requestedCategoryId,
            'transaction_type' => $transactionType,
            'matched' => true,
            'reason' => 'accepted',
        ];
    }
}
