<?php

namespace App\Services\Finance\Whatsapp\Drivers;

use App\Contracts\Finance\Whatsapp\WhatsappAiDriverInterface;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Services\Finance\Whatsapp\Support\WhatsappResponseParser;
use Illuminate\Support\Collection;

class GroqDriver implements WhatsappAiDriverInterface
{
    private string $apiKey;

    private string $baseUrl;

    private int $timeoutSeconds;

    private int $maxTokens;

    private WhatsappResponseParser $parser;

    public function __construct(WhatsappResponseParser $parser)
    {
        $this->parser = $parser;
        $this->apiKey = (string) config('whatsapp.finance.groq_api_key');
        $this->baseUrl = rtrim((string) config('whatsapp.finance.groq_base_url', 'https://api.groq.com/openai/v1'), '/');
        $this->timeoutSeconds = max(10, (int) config('whatsapp.finance.groq_timeout_seconds', 30));
        $this->maxTokens = max(256, (int) config('whatsapp.finance.groq_max_tokens', 1200));
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function getConfig(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'model_single' => (string) config('whatsapp.finance.groq_model_single', 'llama-3.1-8b-instant'),
            'model_bulk' => (string) config('whatsapp.finance.groq_model_bulk', 'llama-3.1-8b-instant'),
            'model_vision' => (string) config('whatsapp.finance.groq_vision_model', 'meta-llama/llama-4-scout-17b-16e-instruct'),
            'base_url' => $this->baseUrl,
        ];
    }

    public function extract(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences,
        string $prompt
    ): array {
        $model = $media
            ? (string) config('whatsapp.finance.groq_vision_model', 'meta-llama/llama-4-scout-17b-16e-instruct')
            : ($command === 'bulk'
                ? (string) config('whatsapp.finance.groq_model_bulk', 'llama-3.1-8b-instant')
                : (string) config('whatsapp.finance.groq_model_single', 'llama-3.1-8b-instant'));

        $driver = new OpenAiCompatDriver(
            parser: $this->parser,
            driverName: 'groq',
            model: $model,
            apiKey: $this->apiKey,
            baseUrl: $this->baseUrl,
            timeoutSeconds: $this->timeoutSeconds,
            maxTokens: $this->maxTokens
        );

        return $driver->extract($tenant, $member, $command, $text, $media, $categoryReferences, $prompt);
    }
}
