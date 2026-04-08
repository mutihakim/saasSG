<?php

namespace App\Console\Commands;

use App\Models\TenantWhatsappIntent;
use App\Models\TenantWhatsappMedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupWhatsappDraftMedia extends Command
{
    protected $signature = 'whatsapp:draft-media:cleanup {--hours=6 : Minimum age in hours before orphan draft media can be cleaned}';

    protected $description = 'Clean expired or consumed WhatsApp draft media files that are no longer needed.';

    public function handle(): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $staleBefore = now()->subHours($hours);
        $purged = 0;

        TenantWhatsappMedia::query()
            ->where(function ($query) use ($staleBefore) {
                $query->where('created_at', '<=', $staleBefore)
                    ->orWhere(function ($consumed) {
                        $consumed->whereNotNull('consumed_at')
                            ->where('consumed_at', '<=', now()->subMinutes(10));
                    });
            })
            ->orderBy('id')
            ->chunkById(100, function ($mediaItems) use (&$purged) {
                foreach ($mediaItems as $media) {
                    if ($this->shouldKeepMedia($media)) {
                        continue;
                    }

                    if ($media->storage_path && Storage::exists($media->storage_path)) {
                        Storage::delete($media->storage_path);
                    }

                    $media->delete();
                    $purged++;
                }
            });

        $this->info("Purged {$purged} WhatsApp draft media file(s).");

        return self::SUCCESS;
    }

    private function shouldKeepMedia(TenantWhatsappMedia $media): bool
    {
        if ($media->consumed_at !== null) {
            return false;
        }

        return TenantWhatsappIntent::query()
            ->where('tenant_id', $media->tenant_id)
            ->whereIn('status', ['processing', 'parsed', 'app_opened'])
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->where(function ($query) use ($media) {
                $query->where('media_id', $media->id)
                    ->orWhereJsonContains('raw_input->media_ids', (int) $media->id);
            })
            ->exists();
    }
}
