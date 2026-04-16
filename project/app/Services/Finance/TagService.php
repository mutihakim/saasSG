<?php

namespace App\Services\Finance;

use App\Models\Master\TenantTag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TagService
{
    /**
     * Sync tags for a model (create if not exist, attach/detach pivot).
     */
    public function syncTags(Model $model, int $tenantId, array $tagNames): void
    {
        if (empty($tagNames)) {
            // Detach all, decrement usage_count
            $existingTagIds = $model->tags()->pluck('tenant_tags.id')->all();
            if (! empty($existingTagIds)) {
                $this->decrementUsageCounts($tenantId, $existingTagIds);
            }
            $model->tags()->detach();
            return;
        }

        $tagNames = array_unique(array_filter(array_map('trim', $tagNames)));

        // Upsert tags
        $tags = collect($tagNames)->map(function (string $name) use ($tenantId) {
            return TenantTag::firstOrCreate(
                ['tenant_id' => $tenantId, 'name' => $name],
                ['color' => $this->generateColor($name)]
            );
        });

        // Find tags being removed to decrement
        $newIds    = $tags->pluck('id')->all();
        $oldIds    = $model->tags()->pluck('tenant_tags.id')->all();
        $removedIds = array_diff($oldIds, $newIds);
        $addedIds   = array_diff($newIds, $oldIds);

        if (! empty($removedIds)) {
            $this->decrementUsageCounts($tenantId, $removedIds);
        }

        if (! empty($addedIds)) {
            TenantTag::whereIn('id', $addedIds)->increment('usage_count');
        }

        $model->tags()->sync($newIds);
    }

    /**
     * Suggest tags based on partial query.
     */
    public function suggest(int $tenantId, string $query, int $limit = 10): Collection
    {
        return TenantTag::forTenant($tenantId)
            ->search($query)
            ->popular()
            ->limit($limit)
            ->get(['id', 'name', 'color', 'usage_count']);
    }

    /**
     * Generate a deterministic pastel color for a tag name.
     */
    private function generateColor(string $name): string
    {
        $colors = [
            '#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6',
            '#1ABC9C', '#E67E22', '#2980B9', '#27AE60', '#8E44AD',
        ];
        return $colors[abs(crc32($name)) % count($colors)];
    }

    private function decrementUsageCounts(int $tenantId, array $tagIds): void
    {
        TenantTag::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $tagIds)
            ->update([
                'usage_count' => DB::raw('GREATEST(usage_count - 1, 0)'),
            ]);
    }
}
