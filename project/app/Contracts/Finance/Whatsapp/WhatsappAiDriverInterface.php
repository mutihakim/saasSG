<?php

namespace App\Contracts\Finance\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Whatsapp\TenantWhatsappMedia;
use Illuminate\Support\Collection;

interface WhatsappAiDriverInterface
{
    /**
     * Determine if the driver is configured.
     */
    public function isConfigured(): bool;

    /**
     * Get the driver configuration array for debugging.
     */
    public function getConfig(): array;

    /**
     * Extract intent data from text/media using AI.
     */
    public function extract(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        ?TenantWhatsappMedia $media,
        Collection $categoryReferences,
        string $prompt
    ): array;
}
