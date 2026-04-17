<?php

namespace App\Services\Games;

use App\Models\Games\GameTahfizAyah;
use App\Models\Games\GameTahfizSurah;
use App\Models\Games\TenantGameTahfizFavorite;
use App\Models\Games\TenantGameTahfizMurojaah;
use App\Models\Games\TenantGameTahfizSetting;
use App\Models\Games\TenantGameTahfizStat;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Collection;

class TahfizGameService
{
    public function surahs(): Collection
    {
        return \Illuminate\Support\Facades\Cache::remember('tahfiz_surahs', 86400, function () {
            return GameTahfizSurah::query()
                ->orderBy('id')
                ->get();
        });
    }

    public function bootstrap(Tenant $tenant, TenantMember $member): array
    {
        return [
            'surahs' => $this->surahs(),
            'settings' => $this->settings($tenant, $member),
            'history' => $this->history($tenant, $member),
            'murojaah_history' => $this->murojaahHistory($tenant, $member),
            'favorites' => $this->favorites($tenant),
        ];
    }

    public function surahDetail(int $id, ?Tenant $tenant = null): ?GameTahfizSurah
    {
        $surah = GameTahfizSurah::query()->with(['ayahs' => function($q) {
            $q->orderBy('nomor_ayat');
        }])->find($id);

        if ($surah && $tenant) {
            $favorites = TenantGameTahfizFavorite::query()
                ->where('tenant_id', $tenant->id)
                ->where('surah_id', $id)
                ->get();

            foreach ($surah->ayahs as $ayah) {
                $ayah->setAttribute('tenant_favorites', $favorites->filter(function($f) use ($ayah) {
                    return $ayah->nomor_ayat >= $f->ayah_start && $ayah->nomor_ayat <= $f->ayah_end;
                })->values());
            }
        }

        return $surah;
    }

    public function settings(Tenant $tenant, TenantMember $member): array
    {
        $settings = TenantGameTahfizSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->first();

        if (!$settings) {
            return [
                'default_provider' => 'EQURAN_ID',
                'default_reciter' => '01',
                'auto_next' => true,
                'repeat_count' => 1,
            ];
        }

        return [
            'default_provider' => (string) $settings->default_provider,
            'default_reciter' => (string) $settings->default_reciter,
            'auto_next' => (bool) $settings->auto_next,
            'repeat_count' => (int) $settings->repeat_count,
        ];
    }

    public function updateSettings(Tenant $tenant, TenantMember $member, array $data): array
    {
        $settings = TenantGameTahfizSetting::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'member_id' => $member->id,
            ],
            [
                'default_provider' => $data['default_provider'] ?? 'EQURAN_ID',
                'default_reciter' => $data['default_reciter'] ?? '01',
                'auto_next' => (bool) ($data['auto_next'] ?? true),
                'repeat_count' => (int) ($data['repeat_count'] ?? 1),
            ]
        );

        return $this->settings($tenant, $member);
    }

    public function recordProgress(Tenant $tenant, TenantMember $member, array $data): TenantGameTahfizStat
    {
        return TenantGameTahfizStat::create([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'surah_number' => $data['surah_number'],
            'ayat_awal' => $data['ayat_awal'],
            'ayat_akhir' => $data['ayat_akhir'],
            'status' => $data['status'] ?? 'reading',
            'tanggal_catat' => now(),
        ]);
    }

    public function recordMurojaah(Tenant $tenant, TenantMember $member, array $data): TenantGameTahfizMurojaah
    {
        return TenantGameTahfizMurojaah::create([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'surah_number' => $data['surah_number'],
            'ayat' => $data['ayat'],
            'tajwid_status' => $data['tajwid_status'],
            'hafalan_status' => $data['hafalan_status'],
            'catatan' => $data['catatan'] ?? null,
        ]);
    }

    public function history(Tenant $tenant, TenantMember $member, int $limit = 20): Collection
    {
        return TenantGameTahfizStat::query()
            ->with('surah')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function murojaahHistory(Tenant $tenant, TenantMember $member, int $limit = 200): Collection
    {
        return TenantGameTahfizMurojaah::query()
            ->with('surah')
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function favorites(Tenant $tenant): Collection
    {
        return TenantGameTahfizFavorite::query()
            ->with(['surah'])
            ->where('tenant_id', $tenant->id)
            ->orderBy('category')
            ->orderBy('surah_id')
            ->orderBy('ayah_start')
            ->get();
    }

    public function toggleFavorite(Tenant $tenant, int $surahId, int $ayahStart, int $ayahEnd, ?string $note = null, ?string $category = null): TenantGameTahfizFavorite
    {
        return TenantGameTahfizFavorite::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'surah_id' => $surahId,
                'ayah_start' => $ayahStart,
                'ayah_end' => $ayahEnd,
            ],
            [
                'note' => $note,
                'category' => $category,
            ]
        );
    }

    public function removeFavorite(Tenant $tenant, int $surahId, int $ayahStart, int $ayahEnd): void
    {
        TenantGameTahfizFavorite::query()
            ->where('tenant_id', $tenant->id)
            ->where('surah_id', $surahId)
            ->where('ayah_start', $ayahStart)
            ->where('ayah_end', $ayahEnd)
            ->delete();
    }
}
