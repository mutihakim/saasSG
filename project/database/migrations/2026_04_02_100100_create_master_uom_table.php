<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_uom', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 50);
            $table->string('abbreviation', 10);
            $table->enum('dimension_type', ['berat', 'volume', 'jumlah', 'panjang', 'luas', 'waktu', 'lainnya'])
                  ->default('jumlah');
            $table->string('base_unit_code', 20)->nullable();
            $table->decimal('base_factor', 18, 8)->nullable();
            $table->boolean('is_active')->default(true);
            $table->smallInteger('sort_order')->default(0);

            $table->index(['dimension_type', 'is_active']);
        });

        // Add self-referential FK after table+unique constraint are in place
        Schema::table('master_uom', function (Blueprint $table) {
            $table->foreign('base_unit_code')
                  ->references('code')
                  ->on('master_uom')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_uom');
    }
};
