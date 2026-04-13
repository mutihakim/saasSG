<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportVocabularyWordsCommand extends Command
{
    protected $signature = 'games:vocabulary:import
        {--path= : Path to JSON/CSV source file}
        {--tenant= : Optional tenant id (empty means global library)}';

    protected $description = 'Import vocabulary words into tenant_game_vocabulary_words';

    public function handle(): int
    {
        $path = trim((string) $this->option('path'));
        $tenantOption = $this->option('tenant');
        $tenantId = $tenantOption !== null && $tenantOption !== '' ? (int) $tenantOption : null;

        if ($path === '') {
            $this->error('--path is required');
            return self::INVALID;
        }

        if (!is_file($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $ext = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));
        $rows = match ($ext) {
            'json' => $this->readJson($path),
            'csv' => $this->readCsv($path),
            default => null,
        };

        if ($rows === null) {
            $this->error('Unsupported file type. Use .json or .csv');
            return self::INVALID;
        }

        if (empty($rows)) {
            $this->warn('No rows to import.');
            return self::SUCCESS;
        }

        $now = now();
        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $normalized = $this->normalizeRow($row);
                if ($normalized === null) {
                    $skipped++;
                    $this->warn("Skipped row #".($index + 1)." (invalid required fields)");
                    continue;
                }

                [$bahasaIndonesia, $bahasaInggris, $fonetik, $bahasaArab, $fonetikArab, $kategori, $hari] = $normalized;

                $query = DB::table('tenant_game_vocabulary_words')
                    ->where('bahasa_indonesia', $bahasaIndonesia)
                    ->where('kategori', $kategori)
                    ->where('hari', $hari);

                if ($tenantId === null) {
                    $query->whereNull('tenant_id');
                } else {
                    $query->where('tenant_id', $tenantId);
                }

                $existing = $query->first(['id']);

                if ($existing) {
                    DB::table('tenant_game_vocabulary_words')
                        ->where('id', $existing->id)
                        ->update([
                            'bahasa_inggris' => $bahasaInggris,
                            'fonetik' => $fonetik,
                            'bahasa_arab' => $bahasaArab,
                            'fonetik_arab' => $fonetikArab,
                            'updated_at' => $now,
                        ]);
                    $updated++;
                } else {
                    DB::table('tenant_game_vocabulary_words')->insert([
                        'tenant_id' => $tenantId,
                        'bahasa_indonesia' => $bahasaIndonesia,
                        'bahasa_inggris' => $bahasaInggris,
                        'fonetik' => $fonetik,
                        'bahasa_arab' => $bahasaArab,
                        'fonetik_arab' => $fonetikArab,
                        'kategori' => $kategori,
                        'hari' => $hari,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $inserted++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: '.$e->getMessage());
            return self::FAILURE;
        }

        $scopeLabel = $tenantId === null ? 'global' : "tenant={$tenantId}";
        $this->info("Vocabulary import done ({$scopeLabel}). Inserted={$inserted}, Updated={$updated}, Skipped={$skipped}");

        return self::SUCCESS;
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    private function readJson(string $path): ?array
    {
        $raw = file_get_contents($path);
        if ($raw === false) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return null;
        }

        return array_values(array_filter($decoded, 'is_array'));
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    private function readCsv(string $path): ?array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return null;
        }

        $rows = [];
        $headers = null;

        while (($data = fgetcsv($handle)) !== false) {
            if ($headers === null) {
                $headers = array_map(
                    static fn ($value) => trim(mb_strtolower((string) $value)),
                    $data
                );
                continue;
            }

            $assoc = [];
            foreach ($headers as $idx => $header) {
                if ($header === '') {
                    continue;
                }
                $assoc[$header] = $data[$idx] ?? null;
            }
            $rows[] = $assoc;
        }

        fclose($handle);
        return $rows;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<int, mixed>|null
     */
    private function normalizeRow(array $row): ?array
    {
        $bahasaIndonesia = trim((string) ($row['bahasa_indonesia'] ?? ''));
        $kategori = trim((string) ($row['kategori'] ?? ''));
        $hari = (int) ($row['hari'] ?? 0);

        if ($bahasaIndonesia === '' || $kategori === '' || $hari < 1) {
            return null;
        }

        $bahasaInggris = $this->nullableString($row['bahasa_inggris'] ?? null);
        $fonetik = $this->nullableString($row['fonetik'] ?? null);
        $bahasaArab = $this->nullableString($row['bahasa_arab'] ?? null);
        $fonetikArab = $this->nullableString($row['fonetik_arab'] ?? null);

        return [$bahasaIndonesia, $bahasaInggris, $fonetik, $bahasaArab, $fonetikArab, $kategori, $hari];
    }

    private function nullableString(mixed $value): ?string
    {
        $trimmed = trim((string) ($value ?? ''));
        return $trimmed !== '' ? $trimmed : null;
    }
}
