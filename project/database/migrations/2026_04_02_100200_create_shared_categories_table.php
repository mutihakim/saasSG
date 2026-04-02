<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_categories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('module', 30);
            $table->string('sub_type', 30)->nullable();
            $table->ulid('parent_id')->nullable();
            $table->string('name', 100);
            $table->string('icon', 60)->nullable();
            $table->string('color', 7)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'module', 'sub_type', 'parent_id', 'name']);
            $table->index(['tenant_id', 'module']);
            $table->index(['tenant_id', 'module', 'is_active']);
        });

        // Self-referential FK requires the primary key to exist first
        Schema::table('shared_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('shared_categories')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_categories');
    }
};
