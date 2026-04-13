<?php

namespace App\Services\Finance\Whatsapp\Drivers;

use App\Contracts\Finance\Whatsapp\WhatsappAiDriverInterface;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use App\Services\Finance\Whatsapp\Support\WhatsappResponseParser;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class GeminiDriver implements WhatsappAiDriverInterface
{
    public function __construct(
        private readonly WhatsappResponseParser $parser
    ) {}

    public function isConfigured(): bool
    {
        return (string) config('whatsapp.finance.gemini_api_key', '') !== '';
    }

    public function getConfig(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'model' => (string) config('whatsapp.finance.gemini_model', 'gemini-2.5-flash'),
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
        $model = (string) config('whatsapp.finance.gemini_model', 'gemini-2.5-flash');
        $apiKey = (string) config('whatsapp.finance.gemini_api_key');
        $parts = [['text' => $prompt]];

        if ($media && $this->parser->isPreviewableMedia($media)) {
            $contents = $this->parser->loadMediaBase64($media->storage_path);
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
        if (! is_array($decoded)) {
            throw new \RuntimeException('Gemini did not return valid JSON extraction.');
        }

        $normalized = $this->parser->normalizeAiResult($command, $decoded, $media, $categoryReferences, 'gemini', $model);
        $normalized['raw_response'] = [
            'driver' => 'gemini',
            'model' => $model,
            'response_text' => $textPayload,
            'decoded' => $decoded,
        ];

        return $normalized;
    }
}
