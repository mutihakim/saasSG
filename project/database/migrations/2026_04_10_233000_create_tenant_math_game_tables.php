<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_game_math_stats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->string('operator', 1);
            $table->unsignedInteger('angka_pilihan');
            $table->unsignedInteger('angka_random');
            $table->unsignedInteger('jumlah_benar')->default(0);
            $table->unsignedInteger('jumlah_salah')->default(0);
            $table->unsignedInteger('current_streak_benar')->default(0);
            $table->unsignedInteger('max_streak_benar')->default(0);
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();

            $table->unique([
                'tenant_id',
                'member_id',
                'operator',
                'angka_pilihan',
                'angka_random',
            ], 'tenant_game_math_stats_unique_pair');
            $table->index(['tenant_id', 'member_id', 'operator'], 'tenant_game_math_stats_member_op_idx');
            $table->index(['tenant_id', 'member_id', 'max_streak_benar'], 'tenant_game_math_stats_mastered_idx');
        });

        Schema::create('tenant_game_sessions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->string('game_slug', 40)->default('math');
            $table->string('operator', 1);
            $table->string('game_mode', 20);
            $table->unsignedInteger('number_range');
            $table->unsignedInteger('random_range')->nullable();
            $table->unsignedInteger('question_count');
            $table->unsignedInteger('time_limit_seconds');
            $table->unsignedInteger('correct_count');
            $table->unsignedInteger('wrong_count');
            $table->unsignedInteger('best_streak')->default(0);
            $table->decimal('score_percent', 5, 2)->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->json('summary')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'member_id', 'game_slug', 'finished_at'], 'tenant_game_sessions_member_history_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_game_sessions');
        Schema::dropIfExists('tenant_game_math_stats');
    }
};
