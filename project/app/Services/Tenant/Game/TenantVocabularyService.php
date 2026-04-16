<?php

namespace App\Services\Tenant\Game;

use App\Models\Tenant\Tenant;
use Database\Seeders\Support\Game\VocabularyBlueprint;
use Illuminate\Support\Facades\DB;

class TenantVocabularyService
{
    /**
     * Ensure default vocabulary words are present (primarily for global library).
     *
     * @param Tenant|null $tenant Optional tenant for tenant-specific words
     */
    public function ensureVocabulary(?Tenant $tenant = null): void
    {
        $words = VocabularyBlueprint::defaultWords();
        $tenantId = $tenant?->id;
        $now = now();

        foreach ($words as $word) {
            DB::table('tenant_game_vocabulary_words')->updateOrInsert(
                [
                    'tenant_id' => $tenantId,
                    'bahasa_indonesia' => $word['bahasa_indonesia'],
                    'kategori' => $word['kategori'] ?? 'General',
                    'hari' => $word['hari'] ?? 1,
                ],
                array_merge($word, [
                    'tenant_id' => $tenantId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }
    }
}
