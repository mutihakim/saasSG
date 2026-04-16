<?php

namespace App\Services\Games;

use App\Models\Games\GameTahfizAyah;
use App\Models\Games\GameTahfizSurah;
use App\Models\Games\TenantGameTahfizSetting;
use App\Models\Games\TenantGameTahfizStat;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Collection;

class TahfizGameService
{
    public function surahs(): Collection
    {
        return GameTahfizSurah::query()
            ->orderBy('id')
            ->get();
    }

    public function surahDetail(int $id): ?GameTahfizSurah
    {
        return GameTahfizSurah::query()
            ->with(['ayahs' => function($q) {
                $q->orderBy('nomor_ayat');
            }])
            ->find($id);
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

    public function history(Tenant $tenant, TenantMember $member, int $limit = 20): Collection
    {
        return TenantGameTahfizStat::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
}
