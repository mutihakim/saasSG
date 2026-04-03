<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fix polymorphic relation type mismatch:
     * - Change taggable_id from ulid to string(100)
     * - This allows compatibility with BIGINT (FinanceTransaction) and ULID/UUID models
     * 
     * @see https://laravel.com/docs/eloquent-relationships#polymorphic-relations
     */
    public function up(): void
    {
        // Drop and recreate table with correct type
        // Note: We drop instead of change() because PostgreSQL doesn't support
        // changing column type from ulid to string directly
        Schema::dropIfExists('tenant_taggables');
        
        Schema::create('tenant_taggables', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_tag_id');
            $table->string('taggable_type', 100);
            $table->string('taggable_id', 100); // FIXED: string for polymorphic compatibility
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['tenant_tag_id', 'taggable_type', 'taggable_id']);
            $table->index(['taggable_type', 'taggable_id']);

            $table->foreign('tenant_tag_id')
                  ->references('id')
                  ->on('tenant_tags')
                  ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_taggables');
        
        Schema::create('tenant_taggables', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_tag_id');
            $table->string('taggable_type', 100);
            $table->ulid('taggable_id');
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['tenant_tag_id', 'taggable_type', 'taggable_id']);
            $table->index(['taggable_type', 'taggable_id']);

            $table->foreign('tenant_tag_id')
                  ->references('id')
                  ->on('tenant_tags')
                  ->cascadeOnDelete();
        });
    }
};
