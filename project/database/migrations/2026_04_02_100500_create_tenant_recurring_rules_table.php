<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_recurring_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->string('ruleable_type', 100);
            $table->ulid('ruleable_id');
            
            $table->string('frequency', 20); // daily, weekly, monthly, yearly
            $table->integer('interval')->default(1);
            $table->json('by_day')->nullable(); // [0, 1, 2] for Sun, Mon, Tue
            $table->integer('day_of_month')->nullable();
            
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('total_occurrences')->nullable();
            
            $table->unsignedInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'ruleable_type', 'ruleable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_recurring_rules');
    }
};
