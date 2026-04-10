<?php

namespace App\Services\Finance;

use Illuminate\Support\Facades\Cache;

class FinanceCacheKeyService
{
    public function tenantVersion(int $tenantId): int
    {
        $key = $this->versionKey($tenantId);
        $version = (int) Cache::get($key, 0);

        if ($version <= 0) {
            $version = 1;
            Cache::forever($key, $version);
        }

        return $version;
    }

    public function versioned(int $tenantId, string $suffix): string
    {
        return sprintf(
            'finance:tenant:%d:v%d:%s',
            $tenantId,
            $this->tenantVersion($tenantId),
            ltrim($suffix, ':')
        );
    }

    public function bumpTenantVersion(int $tenantId): int
    {
        $key = $this->versionKey($tenantId);
        $previous = $this->tenantVersion($tenantId); // Ensure key exists before increment.

        $next = Cache::increment($key);
        if (! is_numeric($next)) {
            $next = $previous + 1;
            Cache::forever($key, $next);
        }

        return (int) $next;
    }

    private function versionKey(int $tenantId): string
    {
        return "finance_cache_version:{$tenantId}";
    }
}
