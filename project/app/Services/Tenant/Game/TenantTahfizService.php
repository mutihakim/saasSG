<?php

namespace App\Services\Tenant\Game;

use App\Models\Tenant\Tenant;
use Illuminate\Support\Facades\DB;

class TenantTahfizService
{
    /**
     * Ensure Quran data (Surahs and Ayahs) is present.
     * This is typically run once for the global library (tenant_id is null).
     *
     * @param Tenant|null $tenant Optional tenant for tenant-specific data
     */
    public function ensureQuranData(?Tenant $tenant = null): void
    {
        // Check if data already exists to avoid redundant work
        if (DB::table('quran_ayahs')->count() >= 6236) {
            return;
        }

        $jsonPath = database_path('data/quran_data.json');

        if (file_exists($jsonPath)) {
            // High-performance loading from JSON dump
            $data = json_decode(file_get_contents($jsonPath), true);
            
            if (isset($data['surahs'])) {
                foreach (array_chunk($data['surahs'], 50) as $chunk) {
                    DB::table('quran_surahs')->upsert($chunk, ['id'], ['nama', 'nama_latin', 'jumlah_ayat', 'tempat_turun', 'arti', 'deskripsi', 'audio_full', 'updated_at']);
                }
            }

            if (isset($data['ayahs'])) {
                foreach (array_chunk($data['ayahs'], 200) as $chunk) {
                    DB::table('quran_ayahs')->upsert($chunk, ['surah_id', 'nomor_ayat'], ['teks_arab', 'teks_latin', 'teks_indonesia', 'audio', 'updated_at']);
                }
            }
        } else {
            // Fallback to Blueprint-based seeding if dump is not available
            $this->seedSurahs();
            $this->seedAyahs();
        }
    }

    /**
     * Seed all 114 Surahs.
     */
    protected function seedSurahs(): void
    {
        if (!class_exists(SurahBlueprint::class)) return;
        
        $surahs = SurahBlueprint::defaultSurahs();
        $now = now();

        foreach ($surahs as $surah) {
            DB::table('quran_surahs')->updateOrInsert(
                ['id' => $surah['id']],
                array_merge($surah, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }
    }

    /**
     * Seed all Ayahs from all 30 Juz.
     */
    protected function seedAyahs(): void
    {
        // This is a legacy fallback. In modern setups, we use the SQL dump.
        // Keeping it for backward compatibility or if blueprints are present.
        $juzBlueprints = [];
        for ($i = 1; $i <= 30; $i++) {
            $class = "Database\\Seeders\\Support\\Game\\Blueprints\\Tahfiz\\Juz{$i}Blueprint";
            if (class_exists($class)) {
                $juzBlueprints[] = $class;
            }
        }

        if (empty($juzBlueprints)) return;

        $now = now();

        foreach ($juzBlueprints as $juzClass) {
            $ayahs = $juzClass::defaultAyahs();
            $batch = [];

            foreach ($ayahs as $ayah) {
                $batch[] = array_merge($ayah, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            foreach (array_chunk($batch, 200) as $chunk) {
                DB::table('quran_ayahs')->upsert(
                    $chunk,
                    ['surah_id', 'nomor_ayat'],
                    ['teks_arab', 'teks_latin', 'teks_indonesia', 'audio', 'updated_at']
                );
            }
        }
    }
}
