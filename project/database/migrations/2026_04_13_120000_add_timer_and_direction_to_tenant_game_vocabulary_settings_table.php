<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_game_vocabulary_settings', function (Blueprint $table) {
            $table->unsignedInteger('default_time_limit')->default(8)->after('mastered_threshold');
            $table->string('translation_direction', 20)->default('id_to_target')->after('auto_tts');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_game_vocabulary_settings', function (Blueprint $table) {
            $table->dropColumn(['default_time_limit', 'translation_direction']);
        });
    }
};
