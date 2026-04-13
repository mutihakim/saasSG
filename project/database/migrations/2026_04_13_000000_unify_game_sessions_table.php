<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Buat tabel sementara atau baru jika belum sesuai
        // Karena kita ingin struktur yang bersih, kita akan mengubah tabel tenant_game_sessions yang ada
        // dan memindahkan data dari tenant_game_vocabulary_sessions ke sana.

        Schema::table('tenant_game_sessions', function (Blueprint $table) {
            // Tambahkan kolom baru yang dibutuhkan
            if (!Schema::hasColumn('tenant_game_sessions', 'metadata')) {
                $table->json('metadata')->after('game_slug')->nullable();
            }

            // Jadikan kolom lama nullable agar tidak error saat insert data vocab sementara
            $table->string('operator', 1)->nullable()->change();
            $table->string('game_mode', 20)->nullable()->change();
            $table->unsignedInteger('number_range')->nullable()->change();
            $table->unsignedInteger('time_limit_seconds')->nullable()->change();
        });

        // 2. Migrasi data Math ke format baru (pindahkan kolom spesifik ke metadata)
        $mathSessions = DB::table('tenant_game_sessions')->where('game_slug', 'math')->get();
        foreach ($mathSessions as $session) {
            $metadata = [
                'operator' => $session->operator,
                'game_mode' => $session->game_mode,
                'number_range' => $session->number_range,
                'random_range' => $session->random_range,
                'time_limit_seconds' => $session->time_limit_seconds,
            ];

            DB::table('tenant_game_sessions')
                ->where('id', $session->id)
                ->update(['metadata' => json_encode($metadata)]);
        }

        // 3. Migrasi data Vocabulary ke tenant_game_sessions
        if (Schema::hasTable('tenant_game_vocabulary_sessions')) {
            $vocabSessions = DB::table('tenant_game_vocabulary_sessions')->get();
            foreach ($vocabSessions as $session) {
                $metadata = [
                    'language' => $session->language,
                    'mode' => $session->mode,
                    'category' => $session->category,
                    'day' => $session->day,
                ];

                DB::table('tenant_game_sessions')->insert([
                    'id' => $session->id,
                    'tenant_id' => $session->tenant_id,
                    'member_id' => $session->member_id,
                    'game_slug' => 'vocabulary',
                    'metadata' => json_encode($metadata),
                    'question_count' => $session->question_count,
                    'correct_count' => $session->correct_count,
                    'wrong_count' => $session->wrong_count,
                    'best_streak' => $session->best_streak,
                    'score_percent' => $session->score_percent,
                    'duration_seconds' => $session->duration_seconds,
                    'summary' => $session->summary,
                    'started_at' => $session->started_at,
                    'finished_at' => $session->finished_at,
                    'created_at' => $session->created_at,
                    'updated_at' => $session->updated_at,
                ]);
            }

            // Hapus tabel lama vocabulary sessions
            Schema::dropIfExists('tenant_game_vocabulary_sessions');
        }

        // 4. Hapus kolom-kolom spesifik Math yang sudah dipindah ke metadata
        Schema::table('tenant_game_sessions', function (Blueprint $table) {
            $table->dropColumn(['operator', 'game_mode', 'number_range', 'random_range', 'time_limit_seconds']);
        });
    }

    public function down(): void
    {
        // Untuk rollback, kita perlu mengembalikan kolom-kolom lama. 
        // Namun karena ini perubahan struktural besar, disarankan backup data jika di production.
        Schema::table('tenant_game_sessions', function (Blueprint $table) {
            $table->string('operator', 1)->nullable();
            $table->string('game_mode', 20)->nullable();
            $table->unsignedInteger('number_range')->nullable();
            $table->unsignedInteger('random_range')->nullable();
            $table->unsignedInteger('time_limit_seconds')->nullable();
            $table->dropColumn('metadata');
        });
    }
};
