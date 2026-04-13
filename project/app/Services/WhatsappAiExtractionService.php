<?php

namespace App\Services;

use App\Exceptions\WhatsappIntentExtractionException;
use App\Models\Master\TenantCategory;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Services\Finance\Whatsapp\Drivers\GeminiDriver;
use App\Services\Finance\Whatsapp\Drivers\GroqDriver;
use App\Services\Finance\Whatsapp\Drivers\OpenRouterDriver;
use App\Services\Finance\Whatsapp\Support\WhatsappResponseParser;
use App\Services\Whatsapp\WhatsappAiPromptBuilder;
use Illuminate\Support\Collection;

class WhatsappAiExtractionService
{
    public function __construct(
        private readonly WhatsappAiPromptBuilder $promptBuilder,
        private readonly WhatsappResponseParser $parser,
    ) {}

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

        if (! $this->requiresAi($command, $normalizedText, $media)) {
            $result = $this->extractFallback($tenant, $command, $normalizedText, $media, $categoryReferences);
            $result['processing_time_ms'] = (int) round((microtime(true) - $startedAt) * 1000);

            return $result;
        }

        $driverName = (string) config('whatsapp.finance.ai_driver', 'openrouter');

        $driver = match ($driverName) {
            'openrouter' => new OpenRouterDriver($this->parser),
            'gemini' => new GeminiDriver($this->parser),
            'groq' => new GroqDriver($this->parser),
            default => throw new \RuntimeException("Unsupported AI driver [{$driverName}] for finance extraction."),
        };

        if (! $driver->isConfigured()) {
            throw new WhatsappIntentExtractionException(
                sprintf('%s is required for natural language finance extraction but is not configured.', ucfirst($driverName)),
                'Maaf, AI untuk membaca pesan transaksi sedang tidak tersedia. Coba lagi nanti atau gunakan format terstruktur seperti `/tx deskripsi#jumlah`.',
                [
                    'driver' => $driverName,
                    'command' => $command,
                    'text' => $normalizedText,
                    'reason' => 'ai_not_configured',
                    'config' => $driver->getConfig(),
                ]
            );
        }

        try {
            $prompt = $this->promptBuilder->buildPrompt($tenant, $member, $command, $normalizedText, $categoryReferences);
            $result = $driver->extract($tenant, $member, $command, $normalizedText, $media, $categoryReferences, $prompt);
            $result['processing_time_ms'] = (int) round((microtime(true) - $startedAt) * 1000);

            return $result;
        } catch (\Throwable $e) {
            report($e);

            throw new WhatsappIntentExtractionException(
                $e->getMessage(),
                'Maaf, AI gagal memahami pesan transaksi saat ini. Coba lagi sebentar lagi atau gunakan format terstruktur seperti `/tx deskripsi#jumlah`.',
                [
                    'driver' => $driverName,
                    'command' => $command,
                    'text' => $normalizedText,
                    'reason' => 'ai_request_failed',
                    'exception_class' => $e::class,
                    'exception_message' => $e->getMessage(),
                ]
            );
        }
    }

    private function extractStructured(
        Tenant $tenant,
        string $command,
        string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        if ($command === 'bulk') {
            $items = $this->parser->parseStructuredBulkItems($text, $tenant->currency_code ?? 'IDR');
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

        [$description, $amount] = $this->parser->parseStructuredSingle($text);
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

    private function extractFallback(
        Tenant $tenant,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences
    ): array {
        if ($command === 'bulk') {
            $items = $this->parser->fallbackBulkItems($text, $tenant->currency_code ?? 'IDR');
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

        [$amount, $description, $amountToken] = $this->parser->extractSimpleAmountAndDescription($text);
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
        if ($text === '' || ! str_contains($text, '#')) {
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

            if (! str_contains($segment, '#')) {
                return false;
            }
        }

        return true;
    }

    private function requiresAi(string $command, string $text, ?TenantWhatsappMedia $media): bool
    {
        return in_array($command, ['tx', 'bulk'], true) && ($media !== null || $text !== '');
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
}
