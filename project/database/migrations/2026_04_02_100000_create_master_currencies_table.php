<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_currencies', function (Blueprint $table) {
            $table->char('code', 3)->primary();
            $table->string('name', 80);
            $table->string('symbol', 10);
            $table->enum('symbol_position', ['before', 'after'])->default('before');
            $table->tinyInteger('decimal_places')->unsigned()->default(0);
            $table->char('thousands_sep', 1)->default('.');
            $table->char('decimal_sep', 1)->default(',');
            $table->boolean('is_active')->default(true);
            $table->smallInteger('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_currencies');
    }
};
