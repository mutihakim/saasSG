<?php

namespace App\Services\Tenant\MasterData;

use App\Models\Master\TenantTag;
use App\Models\Tenant\Tenant;
use Database\Seeders\Support\Master\TagBlueprint;

class TenantTagService
{
    public function ensureTags(Tenant $tenant): void
    {
        foreach (TagBlueprint::defaultTags() as $tag) {
            TenantTag::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => $tag['name'],
                ],
                [
                    'color' => $tag['color'],
                    'usage_count' => 0,
                    'is_active' => true,
                    'row_version' => 1,
                ]
            );
        }
    }
}
