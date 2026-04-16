<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Games\GameTahfizSurah;
use App\Models\Games\GameTahfizAyah;
use Illuminate\Support\Facades\DB;

class SeedTahfizQuran extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tahfiz:seed-quran';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch and seed all 114 Surahs and 6236 Ayahs into PostgreSQL from equran.id';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to fetch Surahs...');

        $response = Http::timeout(30)->get('https://equran.id/api/v2/surat');

        if (!$response->successful()) {
            $this->error('Failed to fetch from equran.id API');
            return;
        }

        $surahs = $response->json('data');
        $totalSurahs = count($surahs);
        $this->info("Found {$totalSurahs} surahs. Seeding process started...");

        $bar = $this->output->createProgressBar($totalSurahs);
        $bar->start();

        foreach ($surahs as $surah) {
            DB::beginTransaction();
            try {
                // Insert or Update Surah
                $surahModel = GameTahfizSurah::updateOrCreate(
                    ['id' => $surah['nomor']],
                    [
                        'nama' => $surah['nama'] ?? null,
                        'nama_latin' => $surah['namaLatin'] ?? null,
                        'jumlah_ayat' => $surah['jumlahAyat'] ?? null,
                        'tempat_turun' => $surah['tempatTurun'] ?? null,
                        'arti' => $surah['arti'] ?? null,
                        'deskripsi' => strip_tags($surah['deskripsi'] ?? ''),
                        'audio_full' => $surah['audioFull']['01'] ?? null,
                    ]
                );

                // Fetch details for ayahs
                $detailResponse = Http::timeout(60)->get("https://equran.id/api/v2/surat/{$surah['nomor']}");
                if ($detailResponse->successful()) {
                    $ayahs = $detailResponse->json('data.ayat');
                    foreach ($ayahs as $ayah) {
                        GameTahfizAyah::updateOrCreate(
                            [
                                'surah_id' => $surah['nomor'],
                                'nomor_ayat' => $ayah['nomorAyat'],
                            ],
                            [
                                'teks_arab' => $ayah['teksArab'] ?? null,
                                'teks_latin' => $ayah['teksLatin'] ?? null,
                                'teks_indonesia' => $ayah['teksIndonesia'] ?? null,
                                'audio' => $ayah['audio']['01'] ?? null,
                            ]
                        );
                    }
                } else {
                    $this->error("\nFailed to fetch ayahs for Surah {$surah['nomor']}");
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("\nError migrating Surah {$surah['nomor']}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->info("\nQuran initialization completed successfully! All data is now in PostgreSQL.");
    }
}
