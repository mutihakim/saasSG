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
        Schema::create('quran_surahs', function (Blueprint $table) {
            $table->unsignedSmallInteger('id')->primary();
            $table->string('nama', 100)->nullable();
            $table->string('nama_latin', 100)->nullable();
            $table->smallInteger('jumlah_ayat')->nullable();
            $table->string('tempat_turun', 50)->nullable();
            $table->string('arti', 100)->nullable();
            $table->text('deskripsi')->nullable();
            $table->text('audio_full')->nullable();
            $table->timestamps();
        });

        Schema::create('quran_ayahs', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('surah_id')->index();
            $table->unsignedSmallInteger('nomor_ayat')->index();
            $table->text('teks_arab')->nullable();
            $table->text('teks_latin')->nullable();
            $table->text('teks_indonesia')->nullable();
            $table->text('audio')->nullable();
            $table->timestamps();
            
            $table->unique(['surah_id', 'nomor_ayat']);
            $table->foreign('surah_id')->references('id')->on('quran_surahs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_ayahs');
        Schema::dropIfExists('quran_surahs');
    }
};
