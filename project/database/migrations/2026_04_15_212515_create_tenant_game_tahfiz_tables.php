<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenant_game_tahfiz_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained('tenant_members')->onDelete('cascade');
            $table->string('default_provider', 50)->default('EQURAN_ID');
            $table->string('default_reciter', 50)->default('01');
            $table->boolean('auto_next')->default(true);
            $table->integer('repeat_count')->default(1);
            $table->timestamps();
        });

        Schema::create('tenant_game_tahfiz_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained('tenant_members')->onDelete('cascade');
            $table->unsignedSmallInteger('surah_number');
            $table->unsignedSmallInteger('ayat_awal')->nullable();
            $table->unsignedSmallInteger('ayat_akhir')->nullable();
            $table->string('status', 50)->default('memorized'); // memorized, reading
            $table->date('tanggal_catat')->nullable();
            $table->timestamps();
            
            $table->foreign('surah_number')->references('id')->on('quran_surahs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_game_tahfiz_progress');
        Schema::dropIfExists('tenant_game_tahfiz_settings');
    }
};
