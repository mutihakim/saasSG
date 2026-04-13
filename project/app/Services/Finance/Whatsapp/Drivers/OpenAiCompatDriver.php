<?php

namespace App\Services\Finance\Whatsapp\Drivers;

use App\Contracts\Finance\Whatsapp\WhatsappAiDriverInterface;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Services\Finance\Whatsapp\Support\WhatsappResponseParser;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class OpenAiCompatDriver implements WhatsappAiDriverInterface
{
    public function __construct(
        private readonly WhatsappResponseParser $parser,
        private readonly string $driverName,
        private readonly string $model,
        private readonly string $apiKey,
        private readonly string $baseUrl,
        private readonly int $timeoutSeconds,
        private readonly int $maxTokens,
        private readonly array $extraHeaders = [],
        private readonly array $extraBody = []
    ) {}

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function getConfig(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'model' => $this->model,
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
        $messages = [[
            'role' => 'user',
            'content' => $this->buildContent($prompt, $media),
        ]];

        $httpOptions = Http::timeout($this->timeoutSeconds)
            ->acceptJson()
            ->withToken($this->apiKey);

        if ($this->extraHeaders !== []) {
            $httpOptions = $httpOptions->withHeaders($this->extraHeaders);
        }

        $body = array_merge([
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => 0,
            'max_tokens' => $this->maxTokens,
            'response_format' => ['type' => 'json_object'],
        ], $this->extraBody);

        $response = $httpOptions
            ->post("{$this->baseUrl}/chat/completions", $body)
            ->throw()
            ->json();

        $textPayload = (string) data_get($response, 'choices.0.message.content', '');
        $decoded = json_decode($textPayload, true);
        if (! is_array($decoded)) {
            throw new \RuntimeException("{$this->driverName} did not return valid JSON extraction.");
        }

        $normalized = $this->parser->normalizeAiResult($command, $decoded, $media, $categoryReferences, $this->driverName, $this->model);
        $normalized['raw_response'] = [
            'driver' => $this->driverName,
            'model' => $this->model,
            'response_text' => $textPayload,
            'decoded' => $decoded,
        ];

        return $normalized;
    }

    private function buildContent(string $prompt, ?TenantWhatsappMedia $media): array|string
    {
        if (! $media || ! $this->parser->isPreviewableMedia($media)) {
            return $prompt;
        }

        $contents = $this->parser->loadMediaBase64($media->storage_path);
        if (! $contents) {
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
}
