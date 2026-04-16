<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RebuildTagUsageCountsCommand extends Command
{
    protected $signature = 'app:rebuild-tag-usage-counts';

    protected $description = 'Recalculate tenant tag usage_count values from tenant_taggables.';

    public function handle(): int
    {
        $this->components->info('Rebuilding tenant tag usage counts...');

        $counts = DB::table('tenant_taggables')
            ->select('tenant_tag_id', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('tenant_tag_id')
            ->pluck('aggregate', 'tenant_tag_id');

        $updated = 0;

        DB::table('tenant_tags')
            ->select('id')
            ->orderBy('id')
            ->chunkById(500, function ($tags) use ($counts, &$updated): void {
                foreach ($tags as $tag) {
                    DB::table('tenant_tags')
                        ->where('id', $tag->id)
                        ->update([
                            'usage_count' => max(0, (int) ($counts[$tag->id] ?? 0)),
                        ]);

                    $updated++;
                }
            });

        $this->components->info("Rebuilt usage_count for {$updated} tags.");

        return self::SUCCESS;
    }
}
