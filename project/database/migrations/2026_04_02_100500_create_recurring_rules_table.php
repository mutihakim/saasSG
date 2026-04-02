<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_rules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('ruleable_type', 100);
            $table->ulid('ruleable_id');
            $table->enum('frequency', ['harian', 'mingguan', 'bulanan', 'tahunan']);
            $table->tinyInteger('interval')->unsigned()->default(1);
            $table->tinyInteger('day_of_week')->unsigned()->nullable();
            $table->tinyInteger('day_of_month')->unsigned()->nullable();
            $table->tinyInteger('month_of_year')->unsigned()->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('next_run_at')->nullable();
            $table->date('last_run_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'next_run_at', 'is_active']);
            $table->index(['ruleable_type', 'ruleable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_rules');
    }
};
