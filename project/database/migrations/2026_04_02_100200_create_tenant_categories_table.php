<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Pattern: Following tenant_members (BIGINT ID, SoftDeletes, row_version).
     * Constraint: UNIQUE (tenant_id, module, sub_type, name)
     */
    public function up(): void
    {
        Schema::create('tenant_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Core Identity
            $table->string('module', 30);
            $table->string('sub_type', 30)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name', 100);
            
            // Visual & UI
            $table->string('icon', 60)->nullable();
            $table->string('color', 7)->nullable();
            $table->smallInteger('sort_order')->default(0);
            
            // Status & Defaults
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            
            // Audit & OCC (Following tenant_members pattern)
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            // Constraints
            $table->unique(['tenant_id', 'module', 'sub_type', 'name'], 'unique_tenant_category_name');
            $table->index(['tenant_id', 'module', 'is_active']);
            $table->index(['tenant_id', 'parent_id']);
        });

        // Self-referential FK
        Schema::table('tenant_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('tenant_categories')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_categories');
    }
};
