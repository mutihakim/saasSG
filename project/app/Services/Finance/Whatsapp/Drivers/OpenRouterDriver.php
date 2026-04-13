<?php

namespace App\Services\Finance\Whatsapp\Drivers;

use App\Contracts\Finance\Whatsapp\WhatsappAiDriverInterface;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Services\Finance\Whatsapp\Support\WhatsappResponseParser;
use Illuminate\Support\Collection;

class OpenRouterDriver implements WhatsappAiDriverInterface
{
    private OpenAiCompatDriver $driver;

    public function __construct(WhatsappResponseParser $parser)
    {
        $this->driver = new OpenAiCompatDriver(
            parser: $parser,
            driverName: 'openrouter',
            model: (string) config('whatsapp.finance.openrouter_model', 'qwen/qwen3.6-plus:free'),
            apiKey: (string) config('whatsapp.finance.openrouter_api_key'),
            baseUrl: rtrim((string) config('whatsapp.finance.openrouter_base_url', 'https://openrouter.ai/api/v1'), '/'),
            timeoutSeconds: max(10, (int) config('whatsapp.finance.openrouter_timeout_seconds', 60)),
            maxTokens: max(256, (int) config('whatsapp.finance.openrouter_max_tokens', 1200)),
            extraHeaders: [
                'HTTP-Referer' => config('app.url', 'https://sanjo.my.id'),
                'X-Title' => 'Family2 WhatsApp Finance',
            ],
            extraBody: ['include_reasoning' => false]
        );
    }

    public function isConfigured(): bool
    {
        return $this->driver->isConfigured();
    }

    public function getConfig(): array
    {
        return $this->driver->getConfig();
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
        return $this->driver->extract($tenant, $member, $command, $text, $media, $categoryReferences, $prompt);
    }
}
