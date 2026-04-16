<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillVocabularySessionSummaries extends Command
{
    protected $signature = 'games:vocabulary:backfill-summaries {--dry-run : Show what would be updated without making changes}';
    protected $description = 'Backfill old vocabulary session summaries with complete attempt data';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('🔍 Searching for old vocabulary sessions...');
        
        $sessions = DB::table('tenant_game_sessions')
            ->where('game_slug', 'vocabulary')
            ->whereNotNull('summary')
            ->get(['id', 'summary', 'metadata']);

        $totalSessions = $sessions->count();
        $updatedCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        if ($totalSessions === 0) {
            $this->info('✅ No old sessions found. All summaries are already up to date.');
            return Command::SUCCESS;
        }

        $this->info("📊 Found {$totalSessions} vocabulary sessions to check.");
        
        if ($isDryRun) {
            $this->warn('⚠️ DRY RUN MODE - No changes will be made.');
        }

        $bar = $this->output->createProgressBar($totalSessions);
        $bar->start();

        foreach ($sessions as $session) {
            try {
                $summary = json_decode($session->summary, true);
                $metadata = $session->metadata ? json_decode($session->metadata, true) : [];

                // Check if already has new format
                if (isset($summary['language']) && isset($summary['attempts'][0]['prompt'])) {
                    $skippedCount++;
                    $bar->advance();
                    continue;
                }

                // Get language from session metadata
                $language = $summary['language'] 
                    ?? $metadata['language'] 
                    ?? 'english';

                // Get attempts
                $oldAttempts = $summary['attempts'] ?? [];
                $newAttempts = [];

                foreach ($oldAttempts as $attempt) {
                    $wordId = $attempt['word_id'] ?? null;
                    if (!$wordId) {
                        $newAttempts[] = $attempt;
                        continue;
                    }

                    // Fetch word from database
                    $word = DB::table('tenant_game_vocabulary_words')
                        ->where('id', $wordId)
                        ->first();

                    if (!$word) {
                        $this->warn("  ⚠️ Word ID {$wordId} not found");
                        $newAttempts[] = $attempt;
                        continue;
                    }

                    // Build complete attempt data
                    $prompt = $word->bahasa_indonesia;
                    $correctAnswer = $this->getTargetText($word, $language);
                    
                    $newAttempts[] = [
                        'word_id' => $wordId,
                        'prompt' => $prompt,
                        'correct_answer' => $correctAnswer,
                        'selected_answer' => $attempt['selected_answer'] ?? '',
                        'correct' => $attempt['correct'] ?? false,
                        'streak_after' => $attempt['streak_after'] ?? 0,
                    ];
                }

                // Build new summary
                $newSummary = [
                    'language' => $language,
                    'attempts' => $newAttempts,
                ];

                if (!$isDryRun) {
                    DB::table('tenant_game_sessions')
                        ->where('id', $session->id)
                        ->update([
                            'summary' => json_encode($newSummary),
                        ]);
                }

                $updatedCount++;
                $bar->advance();

            } catch (\Exception $e) {
                $errorCount++;
                $this->error("\n  ❌ Error processing session {$session->id}: {$e->getMessage()}");
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("📋 Results:");
        $this->table(
            ['Status', 'Count'],
            [
                ['✅ Updated', $updatedCount],
                ['⏭️ Skipped (already complete)', $skippedCount],
                ['❌ Errors', $errorCount],
                ['📊 Total processed', $totalSessions],
            ]
        );

        if ($isDryRun) {
            $this->warn('⚠️ This was a dry run. Run without --dry-run to actually update the data.');
        } else {
            $this->info("✅ Successfully updated {$updatedCount} session(s).");
        }

        return Command::SUCCESS;
    }

    private function getTargetText(object $word, string $language): string
    {
        return match ($language) {
            'english' => $word->bahasa_inggris ?? '',
            'mandarin' => $word->bahasa_mandarin ?? '',
            'arabic' => $word->bahasa_arab ?? '',
            default => $word->bahasa_inggris ?? '',
        };
    }
}
