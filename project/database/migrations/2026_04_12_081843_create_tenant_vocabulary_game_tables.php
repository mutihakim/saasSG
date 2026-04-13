<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_game_vocabulary_words', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('bahasa_indonesia', 255);
            $table->string('bahasa_inggris', 255)->nullable();
            $table->string('fonetik', 255)->nullable();
            $table->string('bahasa_arab', 255)->nullable();
            $table->string('fonetik_arab', 255)->nullable();
            $table->string('kategori', 120);
            $table->unsignedSmallInteger('hari');
            $table->timestamps();

            $table->index(['tenant_id', 'kategori', 'hari'], 'tenant_vocab_words_scope_day_idx');
            $table->index(['tenant_id', 'kategori'], 'tenant_vocab_words_scope_category_idx');
        });

        Schema::create('tenant_game_vocabulary_progress', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->foreignId('word_id')->constrained('tenant_game_vocabulary_words')->cascadeOnDelete();
            $table->string('language', 20); // english | arabic
            $table->unsignedInteger('jumlah_benar')->default(0);
            $table->unsignedInteger('jumlah_salah')->default(0);
            $table->unsignedInteger('correct_streak')->default(0);
            $table->unsignedInteger('max_streak')->default(0);
            $table->boolean('is_mastered')->default(false);
            $table->timestamp('last_practiced_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'member_id', 'word_id', 'language'],
                'tenant_vocab_progress_unique_word_language'
            );
            $table->index(['tenant_id', 'member_id', 'language'], 'tenant_vocab_progress_member_lang_idx');
            $table->index(['tenant_id', 'member_id', 'is_mastered'], 'tenant_vocab_progress_mastered_idx');
        });

        Schema::create('tenant_game_vocabulary_settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->string('language', 20); // english | arabic
            $table->string('default_mode', 20)->default('learn'); // learn | practice
            $table->unsignedInteger('mastered_threshold')->default(8);
            $table->boolean('auto_tts')->default(true);
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'member_id', 'language'],
                'tenant_vocab_settings_unique_language'
            );
        });

        Schema::create('tenant_game_vocabulary_sessions', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->string('game_slug', 40)->default('vocabulary');
            $table->string('language', 20); // english | arabic
            $table->string('mode', 20); // practice
            $table->string('category', 120);
            $table->unsignedSmallInteger('day');
            $table->unsignedInteger('question_count');
            $table->unsignedInteger('correct_count');
            $table->unsignedInteger('wrong_count');
            $table->unsignedInteger('best_streak')->default(0);
            $table->decimal('score_percent', 5, 2)->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->json('summary')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(
                ['tenant_id', 'member_id', 'game_slug', 'finished_at'],
                'tenant_vocab_sessions_member_history_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_game_vocabulary_sessions');
        Schema::dropIfExists('tenant_game_vocabulary_settings');
        Schema::dropIfExists('tenant_game_vocabulary_progress');
        Schema::dropIfExists('tenant_game_vocabulary_words');
    }
};
