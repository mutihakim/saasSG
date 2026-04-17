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
        Schema::create('tenant_game_tahfiz_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->unsignedSmallInteger('surah_id');
            $table->unsignedSmallInteger('ayah_start');
            $table->unsignedSmallInteger('ayah_end');
            $table->string('category')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('surah_id')->references('id')->on('quran_surahs')->onDelete('cascade');
            // Allow multiple favorites in same surah/range if they have different notes/categories
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_game_tahfiz_favorites');
    }
};
