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
        Schema::create('tenant_game_tahfiz_murojaah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained('tenant_members')->onDelete('cascade');
            $table->unsignedSmallInteger('surah_number');
            $table->unsignedSmallInteger('ayat');
            $table->string('tajwid_status', 20); // bagus, cukup, kurang
            $table->string('hafalan_status', 20); // lancar, terbata, belum_hafal
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('surah_number')->references('id')->on('quran_surahs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_game_tahfiz_murojaah');
    }
};
