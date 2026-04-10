<?php

namespace App\Services;

use App\Exceptions\WhatsappIntentExtractionException;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantCategory;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WhatsappAiExtractionService
{
    public function extract(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media = null
    ): array {
        $startedAt = microtime(true);
        $categoryReferences = $this->financeCategoryReferences($tenant);
        $normalizedText = trim((string) $text);

        if ($this->isStructuredCommandPayload($command, $normalizedText)) {
            $result = $this->extractStructured($tenant, $command, $normalizedText, $media, $categoryReferences);
            $result['processing_time_ms'] = (int) round((microtime(true) - $startedAt) * 1000);

            return $result;
        }

        if (!$this->requiresAi($command, $normalizedText, $media)) {
            $result = $this->extractFallback($tenant, $command, $normalizedText, $media, $categoryReferences);
            $result['processing_time_ms'] = (int) round((microtime(true) - $startedAt) * 1000);

            return $result;
        }

        $driver = (string) config('whatsapp.finance.ai_driver', 'openrouter');
        $driverConfig = $this->resolveAiDriverConfig($driver);
        if (!$driverConfig['configured']) {
            throw new WhatsappIntentExtractionException(
                sprintf('%s is required for natural language finance extraction but is not configured.', ucfirst($driver)),
                'Maaf, AI untuk membaca pesan transaksi sedang tidak tersedia. Coba lagi nanti atau gunakan format terstruktur seperti `/tx deskripsi#jumlah`.',
                [
                    'driver' => $driver,
                    'command' => $command,
                    'text' => $normalizedText,
                    'reason' => 'ai_not_configured',
                    'config' => $driverConfig,
                ]
            );
        }

        try {
            $result = match ($driver) {
                'openrouter' => $this->extractWithOpenRouter($tenant, $member, $command, $normalizedText, $media, $categoryReferences),
                'gemini' => $this->extractWithGemini($tenant, $member, $command, $normalizedText, $media, $categoryReferences),
                'groq' => $this->extractWithGroq($tenant, $member, $command, $normalizedText, $media, $categoryReferences),
                default => throw new \RuntimeException("Unsupported AI driver [{$driver}] for finance extraction."),
            };
            $result['processing_time_ms'] = (int) round((microtime(true) - $startedAt) * 1000);

            return $result;
        } catch (\Throwable $e) {
            report($e);

            throw new WhatsappIntentExtractionException(
                $e->getMessage(),
                'Maaf, AI gagal memahami pesan transaksi saat ini. Coba lagi sebentar lagi atau gunakan format terstruktur seperti `/tx deskripsi#jumlah`.',
                [
                    'driver' => $driver,
                    'command' => $command,
                    'text' => $normalizedText,
                    'reason' => 'ai_request_failed',
                    'exception_class' => $e::class,
                    'exception_message' => $e->getMessage(),
                ]
            );
        }
    }

    private function extractWithGemini(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        $model = (string) config('whatsapp.finance.gemini_model', 'gemini-2.5-flash');
        $apiKey = (string) config('whatsapp.finance.gemini_api_key');
        $prompt = $this->buildPrompt($tenant, $member, $command, $text, $categoryReferences);
        $parts = [[
            'text' => $prompt,
        ]];

        if ($media && $this->isPreviewableMedia($media)) {
            $contents = $this->loadMediaBase64($media->storage_path);
            if ($contents) {
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => $media->mime_type,
                        'data' => $contents,
                    ],
                ];
            }
        }

        $response = Http::timeout(30)
            ->acceptJson()
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                ],
                'contents' => [[
                    'parts' => $parts,
                ]],
            ])
            ->throw()
            ->json();

        $textPayload = (string) data_get($response, 'candidates.0.content.parts.0.text', '');
        $decoded = json_decode($textPayload, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('Gemini did not return valid JSON extraction.');
        }

        $normalized = $this->normalizeAiResult($command, $decoded, $media, $categoryReferences);
        $normalized['raw_response'] = [
            'driver' => 'gemini',
            'request' => [
                'model' => $model,
                'command' => $command,
                'text' => $text,
                'member_name' => $member?->full_name,
                'tenant_locale' => $tenant->locale,
                'tenant_currency_code' => $tenant->currency_code,
                'prompt' => $prompt,
                'category_references' => $categoryReferences->values()->all(),
                'has_media' => $media !== null,
                'media_meta' => $media ? [
                    'id' => $media->id,
                    'mime_type' => $media->mime_type,
                    'size_bytes' => $media->size_bytes,
                ] : null,
            ],
            'response' => $response,
            'response_text' => $textPayload,
            'decoded' => $decoded,
            'normalization' => $normalized['normalization'] ?? null,
        ];

        return $normalized;
    }

    private function extractWithOpenRouter(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        $model = (string) config('whatsapp.finance.openrouter_model', 'qwen/qwen3.6-plus:free');
        $apiKey = (string) config('whatsapp.finance.openrouter_api_key');
        $baseUrl = rtrim((string) config('whatsapp.finance.openrouter_base_url', 'https://openrouter.ai/api/v1'), '/');
        $timeoutSeconds = max(10, (int) config('whatsapp.finance.openrouter_timeout_seconds', 60));
        $maxTokens = max(256, (int) config('whatsapp.finance.openrouter_max_tokens', 1200));
        $prompt = $this->buildPrompt($tenant, $member, $command, $text, $categoryReferences);
        $messages = [[
            'role' => 'user',
            'content' => $this->buildOpenRouterContent($prompt, $media),
        ]];

        $response = Http::timeout($timeoutSeconds)
            ->acceptJson()
            ->withToken($apiKey)
            ->withHeaders([
                'HTTP-Referer' => config('app.url', 'https://sanjo.my.id'),
                'X-Title' => 'Family2 WhatsApp Finance',
            ])
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0,
                'max_tokens' => $maxTokens,
                'include_reasoning' => false,
                'response_format' => ['type' => 'json_object'],
            ])
            ->throw()
            ->json();

        $textPayload = (string) data_get($response, 'choices.0.message.content', '');
        $decoded = json_decode($textPayload, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('OpenRouter did not return valid JSON extraction.');
        }

        $normalized = $this->normalizeAiResult($command, $decoded, $media, $categoryReferences, 'openrouter', $model);
        $normalized['raw_response'] = [
            'driver' => 'openrouter',
            'request' => [
                'model' => $model,
                'base_url' => $baseUrl,
                'timeout_seconds' => $timeoutSeconds,
                'max_tokens' => $maxTokens,
                'command' => $command,
                'text' => $text,
                'member_name' => $member?->full_name,
                'tenant_locale' => $tenant->locale,
                'tenant_currency_code' => $tenant->currency_code,
                'prompt' => $prompt,
                'category_references' => $categoryReferences->values()->all(),
                'has_media' => $media !== null,
                'media_meta' => $media ? [
                    'id' => $media->id,
                    'mime_type' => $media->mime_type,
                    'size_bytes' => $media->size_bytes,
                ] : null,
            ],
            'response' => $response,
            'response_text' => $textPayload,
            'decoded' => $decoded,
            'normalization' => $normalized['normalization'] ?? null,
        ];

        return $normalized;
    }

    private function extractWithGroq(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        $model = $media
            ? (string) config('whatsapp.finance.groq_vision_model', 'meta-llama/llama-4-scout-17b-16e-instruct')
            : ($command === 'bulk'
                ? (string) config('whatsapp.finance.groq_model_bulk', 'llama-3.1-8b-instant')
                : (string) config('whatsapp.finance.groq_model_single', 'llama-3.1-8b-instant'));
        $apiKey = (string) config('whatsapp.finance.groq_api_key');
        $baseUrl = rtrim((string) config('whatsapp.finance.groq_base_url', 'https://api.groq.com/openai/v1'), '/');
        $timeoutSeconds = max(10, (int) config('whatsapp.finance.groq_timeout_seconds', 30));
        $maxTokens = max(256, (int) config('whatsapp.finance.groq_max_tokens', 1200));
        $prompt = $this->buildPrompt($tenant, $member, $command, $text, $categoryReferences);
        $messages = [[
            'role' => 'user',
            'content' => $this->buildOpenRouterContent($prompt, $media),
        ]];

        $response = Http::timeout($timeoutSeconds)
            ->acceptJson()
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0,
                'max_tokens' => $maxTokens,
                'response_format' => ['type' => 'json_object'],
            ])
            ->throw()
            ->json();

        $textPayload = (string) data_get($response, 'choices.0.message.content', '');
        $decoded = json_decode($textPayload, true);
        if (!is_array($decoded)) {
            throw new \RuntimeException('Groq did not return valid JSON extraction.');
        }

        $normalized = $this->normalizeAiResult($command, $decoded, $media, $categoryReferences, 'groq', $model);
        $normalized['raw_response'] = [
            'driver' => 'groq',
            'request' => [
                'model' => $model,
                'base_url' => $baseUrl,
                'timeout_seconds' => $timeoutSeconds,
                'max_tokens' => $maxTokens,
                'command' => $command,
                'text' => $text,
                'member_name' => $member?->full_name,
                'tenant_locale' => $tenant->locale,
                'tenant_currency_code' => $tenant->currency_code,
                'prompt' => $prompt,
                'category_references' => $categoryReferences->values()->all(),
                'has_media' => $media !== null,
                'media_meta' => $media ? [
                    'id' => $media->id,
                    'mime_type' => $media->mime_type,
                    'size_bytes' => $media->size_bytes,
                ] : null,
            ],
            'response' => $response,
            'response_text' => $textPayload,
            'decoded' => $decoded,
            'normalization' => $normalized['normalization'] ?? null,
        ];

        return $normalized;
    }

    private function extractStructured(
        Tenant $tenant,
        string $command,
        string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        if ($command === 'bulk') {
            $items = $this->parseStructuredBulkItems($text, $tenant->currency_code ?? 'IDR');
            if ($items === []) {
                throw new WhatsappIntentExtractionException(
                    'Structured bulk payload is invalid.',
                    'Format `/bulk` tidak valid. Gunakan format `deskripsi#jumlah` per item.',
                    [
                        'driver' => 'structured',
                        'command' => $command,
                        'text' => $text,
                        'reason' => 'invalid_structured_bulk_payload',
                    ]
                );
            }

            $result = [
                'provider' => 'structured',
                'model' => 'hash-delimited',
                'confidence_score' => 0.99,
                'payload' => [
                    'merchant' => null,
                    'transaction_date' => now()->toDateString(),
                    'subtotal' => collect($items)->sum(fn ($item) => (float) ($item['amount'] ?? 0)),
                    'total' => collect($items)->sum(fn ($item) => (float) ($item['amount'] ?? 0)),
                    'notes' => $text,
                    'category_id' => null,
                    'needs_review_flags' => [],
                    'media_id' => $media?->id,
                ],
                'items' => $items,
                'normalization' => [
                    'single' => null,
                    'items' => collect($items)->map(fn ($item, $index) => [
                        'index' => $index,
                        'amount' => $item['amount'] ?? null,
                        'description' => $item['description'] ?? null,
                        'category' => [
                            'requested_category_id' => null,
                            'accepted_category_id' => null,
                            'transaction_type' => 'pengeluaran',
                            'matched' => false,
                            'reason' => 'structured_mode_no_category_mapping',
                        ],
                    ])->values()->all(),
                ],
            ];

            $result['raw_response'] = [
                'driver' => 'structured',
                'request' => [
                    'command' => $command,
                    'text' => $text,
                    'category_references' => $categoryReferences->values()->all(),
                    'has_media' => $media !== null,
                ],
                'response' => null,
                'response_text' => null,
                'decoded' => $result['payload'],
                'normalization' => $result['normalization'],
            ];

            return $result;
        }

        [$description, $amount] = $this->parseStructuredSingle($text);
        if ($description === '' || $amount === null) {
            throw new WhatsappIntentExtractionException(
                'Structured single payload is invalid.',
                'Format `/tx` tidak valid. Gunakan format `/tx deskripsi#jumlah`.',
                [
                    'driver' => 'structured',
                    'command' => $command,
                    'text' => $text,
                    'reason' => 'invalid_structured_single_payload',
                ]
            );
        }

        $result = [
            'provider' => 'structured',
            'model' => 'hash-delimited',
            'confidence_score' => 0.99,
            'payload' => [
                'type' => 'pengeluaran',
                'amount' => $amount,
                'currency_code' => $tenant->currency_code ?? 'IDR',
                'transaction_date' => now()->toDateString(),
                'merchant' => null,
                'notes' => $text,
                'category_id' => null,
                'category_hint' => null,
                'account_hint' => null,
                'budget_hint' => null,
                'tags' => [],
                'description' => $description,
                'needs_review_flags' => [],
                'media_id' => $media?->id,
            ],
            'items' => [],
            'normalization' => [
                'single' => [
                    'mode' => 'structured',
                    'parsed_amount' => $amount,
                    'description' => $description,
                    'category' => [
                        'requested_category_id' => null,
                        'accepted_category_id' => null,
                        'transaction_type' => 'pengeluaran',
                        'matched' => false,
                        'reason' => 'structured_mode_no_category_mapping',
                    ],
                ],
                'items' => [],
            ],
        ];

        $result['raw_response'] = [
            'driver' => 'structured',
            'request' => [
                'command' => $command,
                'text' => $text,
                'category_references' => $categoryReferences->values()->all(),
                'has_media' => $media !== null,
            ],
            'response' => null,
            'response_text' => null,
            'decoded' => $result['payload'],
            'normalization' => $result['normalization'],
        ];

        return $result;
    }

    private function buildPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        Collection $categoryReferences
    ): string {
        return $command === 'bulk'
            ? $this->buildBulkShoppingPrompt($tenant, $member, $text, $categoryReferences)
            : $this->buildSingleTransactionPrompt($tenant, $member, $text, $categoryReferences);
    }

    private function buildSingleTransactionPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $text,
        Collection $categoryReferences
    ): string {
        $categoryReferenceJson = json_encode($categoryReferences->values()->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
You are extracting a single finance transaction from natural language text.
Return ONLY valid JSON with no markdown formatting.

Locale: {$tenant->locale}
Currency: {$tenant->currency_code}
Member: {$member?->full_name}

Text to extract:
{$text}

Available categories:
{$categoryReferenceJson}

Return JSON with these keys:
confidence_score, type, amount, currency_code, transaction_date, merchant, notes, category_id, category_hint, account_hint, budget_hint, tags, needs_review_flags, description

Rules:
- type must be "pemasukan" or "pengeluaran"
- amount must be the final total money value
- if both quantity and total price appear, use the total price as amount
- never use quantity as amount
- description should be concise, without quantity or total price
- choose category_id only if one category is clearly the best match
- prefer food/drink purchases to food-related categories, not transport or fuel
- set needs_review_flags if anything is ambiguous
PROMPT;
    }

    private function buildBulkShoppingPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $text,
        Collection $categoryReferences
    ): string {
        $categoryReferenceJson = json_encode($categoryReferences->values()->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
You are extracting multiple shopping items from a receipt or shopping list.
Return ONLY valid JSON with no markdown formatting.

Locale: {$tenant->locale}
Currency: {$tenant->currency_code}
Member: {$member?->full_name}

Text to extract:
{$text}

Available categories:
{$categoryReferenceJson}

Return JSON with this exact structure:
{
  "confidence_score": 0.9,
  "merchant": "store name or null",
  "transaction_date": "YYYY-MM-DD or null",
  "subtotal": total_sum,
  "total": total_sum,
  "notes": "",
  "items": [
    {"description": "item name", "amount": number, "currency_code": "{$tenant->currency_code}", "category_id": number_or_null, "category_hint": "category name or null", "notes": ""}
  ],
  "needs_review_flags": []
}

Rules:
- Extract EVERY item from the text as a separate entry in the items array
- amount is the price for that single item
- If a line contains just a name and a number, the number is the amount
- Choose category_id only if it clearly matches one of the available categories above
- Set needs_review_flags if anything is ambiguous
PROMPT;
    }

    private function normalizeAiResult(
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
            'model' => $model ?? $this->configuredModelFor($provider),
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

    private function resolveAiDriverConfig(string $driver): array
    {
        return match ($driver) {
            'openrouter' => [
                'configured' => (string) config('whatsapp.finance.openrouter_api_key', '') !== '',
                'model' => (string) config('whatsapp.finance.openrouter_model', 'qwen/qwen3.6-plus:free'),
                'base_url' => (string) config('whatsapp.finance.openrouter_base_url', 'https://openrouter.ai/api/v1'),
            ],
            'gemini' => [
                'configured' => (string) config('whatsapp.finance.gemini_api_key', '') !== '',
                'model' => (string) config('whatsapp.finance.gemini_model', 'gemini-2.5-flash'),
            ],
            'groq' => [
                'configured' => (string) config('whatsapp.finance.groq_api_key', '') !== '',
                'model_single' => (string) config('whatsapp.finance.groq_model_single', 'llama-3.1-8b-instant'),
                'model_bulk' => (string) config('whatsapp.finance.groq_model_bulk', 'llama-3.1-8b-instant'),
                'model_vision' => (string) config('whatsapp.finance.groq_vision_model', 'meta-llama/llama-4-scout-17b-16e-instruct'),
                'base_url' => (string) config('whatsapp.finance.groq_base_url', 'https://api.groq.com/openai/v1'),
            ],
            default => [
                'configured' => false,
                'model' => null,
            ],
        };
    }

    private function configuredModelFor(string $provider): ?string
    {
        return match ($provider) {
            'openrouter' => (string) config('whatsapp.finance.openrouter_model', 'qwen/qwen3.6-plus:free'),
            'gemini' => (string) config('whatsapp.finance.gemini_model', 'gemini-2.5-flash'),
            'groq' => sprintf(
                'single:%s / bulk:%s / vision:%s',
                config('whatsapp.finance.groq_model_single', 'llama-3.1-8b-instant'),
                config('whatsapp.finance.groq_model_bulk', 'llama-3.1-8b-instant'),
                config('whatsapp.finance.groq_vision_model', 'meta-llama/llama-4-scout-17b-16e-instruct'),
            ),
            default => null,
        };
    }

    private function buildOpenRouterContent(string $prompt, ?TenantWhatsappMedia $media): array|string
    {
        if (!$media || !$this->isPreviewableMedia($media)) {
            return $prompt;
        }

        $contents = $this->loadMediaBase64($media->storage_path);
        if (!$contents) {
            return $prompt;
        }

        return [
            [
                'type' => 'text',
                'text' => $prompt,
            ],
            [
                'type' => 'image_url',
                'image_url' => [
                    'url' => sprintf('data:%s;base64,%s', $media->mime_type, $contents),
                ],
            ],
        ];
    }

    private function extractFallback(
        Tenant $tenant,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        if ($command === 'bulk') {
            $items = $this->fallbackBulkItems($text, $tenant->currency_code ?? 'IDR');
            $result = [
                'provider' => 'fallback',
                'model' => 'heuristic',
                'confidence_score' => $items === [] ? 0.2 : 0.55,
                'payload' => [
                    'merchant' => null,
                    'transaction_date' => now()->toDateString(),
                    'subtotal' => collect($items)->sum(fn ($item) => (float) ($item['amount'] ?? 0)),
                    'total' => collect($items)->sum(fn ($item) => (float) ($item['amount'] ?? 0)),
                    'notes' => $text,
                    'category_id' => null,
                    'needs_review_flags' => ['manual_review_recommended'],
                    'media_id' => $media?->id,
                ],
                'items' => $items,
                'normalization' => [
                    'single' => null,
                    'items' => collect($items)->map(fn ($item, $index) => [
                        'index' => $index,
                        'amount' => $item['amount'] ?? null,
                        'description' => $item['description'] ?? null,
                        'category' => [
                            'requested_category_id' => data_get($item, 'payload.category_id'),
                            'accepted_category_id' => null,
                            'transaction_type' => 'pengeluaran',
                            'matched' => false,
                            'reason' => 'fallback_no_category_mapping',
                        ],
                    ])->values()->all(),
                ],
            ];

            $result['raw_response'] = [
                'driver' => 'fallback',
                'request' => [
                    'command' => $command,
                    'text' => $text,
                    'category_references' => $categoryReferences->values()->all(),
                    'has_media' => $media !== null,
                ],
                'response' => null,
                'response_text' => null,
                'decoded' => $result['payload'],
                'normalization' => $result['normalization'],
            ];

            return $result;
        }

        [$amount, $description, $amountToken] = $this->extractSimpleAmountAndDescription($text);
        $result = [
            'provider' => 'fallback',
            'model' => 'heuristic',
            'confidence_score' => $amount ? 0.6 : 0.25,
            'payload' => [
                'type' => 'pengeluaran',
                'amount' => $amount,
                'currency_code' => $tenant->currency_code ?? 'IDR',
                'transaction_date' => now()->toDateString(),
                'merchant' => null,
                'notes' => $text,
                'category_id' => null,
                'category_hint' => null,
                'account_hint' => null,
                'budget_hint' => null,
                'tags' => [],
                'description' => $description,
                'needs_review_flags' => ['manual_review_recommended'],
                'media_id' => $media?->id,
            ],
            'items' => [],
            'normalization' => [
                'single' => [
                    'amount_token' => $amountToken,
                    'parsed_amount' => $amount,
                    'description' => $description,
                    'category' => [
                        'requested_category_id' => null,
                        'accepted_category_id' => null,
                        'transaction_type' => 'pengeluaran',
                        'matched' => false,
                        'reason' => 'fallback_no_category_mapping',
                    ],
                ],
                'items' => [],
            ],
        ];

        $result['raw_response'] = [
            'driver' => 'fallback',
            'request' => [
                'command' => $command,
                'text' => $text,
                'category_references' => $categoryReferences->values()->all(),
                'has_media' => $media !== null,
            ],
            'response' => null,
            'response_text' => null,
            'decoded' => $result['payload'],
            'normalization' => $result['normalization'],
        ];

        return $result;
    }

    private function isStructuredCommandPayload(string $command, string $text): bool
    {
        if ($text === '' || !str_contains($text, '#')) {
            return false;
        }

        if ($command === 'tx') {
            return count(explode('#', $text)) >= 2;
        }

        $segments = preg_split('/[\r\n,;]+/', $text);
        foreach ($segments as $segment) {
            $segment = trim((string) $segment);
            if ($segment === '') {
                continue;
            }

            if (!str_contains($segment, '#')) {
                return false;
            }
        }

        return true;
    }

    private function requiresAi(string $command, string $text, ?TenantWhatsappMedia $media): bool
    {
        return in_array($command, ['tx', 'bulk'], true) && ($media !== null || $text !== '');
    }

    private function parseStructuredSingle(string $text): array
    {
        $parts = explode('#', $text, 2);
        $description = trim((string) ($parts[0] ?? ''));
        $amount = isset($parts[1]) ? $this->normalizeMoneyToken((string) $parts[1]) : null;

        return [$description, $amount];
    }

    private function parseStructuredBulkItems(string $text, string $currencyCode): array
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

    private function fallbackBulkItems(?string $text, string $currencyCode): array
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

    private function extractSimpleAmountAndDescription(?string $text): array
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

    private function normalizeMoneyToken(string $token): ?float
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

    private function isPreviewableMedia(TenantWhatsappMedia $media): bool
    {
        return Str::startsWith($media->mime_type, 'image/') || $media->mime_type === 'application/pdf';
    }

    private function loadMediaBase64(string $storagePath): ?string
    {
        if (!Storage::exists($storagePath)) {
            return null;
        }

        return base64_encode((string) Storage::get($storagePath));
    }

    private function financeCategoryReferences(Tenant $tenant): Collection
    {
        return TenantCategory::query()
            ->forTenant($tenant->id)
            ->forModule('finance')
            ->active()
            ->ordered()
            ->get(['id', 'name', 'sub_type'])
            ->map(fn (TenantCategory $category) => [
                'id' => (int) $category->id,
                'name' => (string) $category->name,
                'sub_type' => $category->sub_type ?: 'all',
            ]);
    }

    private function normalizeTransactionType(mixed $type): ?string
    {
        $value = Str::lower(trim((string) $type));

        return in_array($value, ['pemasukan', 'pengeluaran'], true) ? $value : null;
    }

    private function resolveCategoryNormalization(mixed $categoryId, ?string $transactionType, Collection $categoryReferences): array
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
        if (!$category) {
            return [
                'requested_category_id' => $requestedCategoryId,
                'accepted_category_id' => null,
                'transaction_type' => $transactionType,
                'matched' => false,
                'reason' => 'not_found_in_tenant_categories',
            ];
        }

        $subType = (string) ($category['sub_type'] ?? 'all');
        if (!$transactionType || $subType === '' || $subType === 'all') {
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
