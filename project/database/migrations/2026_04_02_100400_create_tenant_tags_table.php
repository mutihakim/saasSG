<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->string('name', 50);
            $table->string('color', 7)->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            
            $table->unsignedInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'usage_count']);
        });

        Schema::create('tenant_taggables', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_tag_id');
            $table->string('taggable_type', 100);
            $table->string('taggable_id', 100);
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['tenant_tag_id', 'taggable_type', 'taggable_id']);
            $table->index(['taggable_type', 'taggable_id']);

            $table->foreign('tenant_tag_id')
                  ->references('id')
                  ->on('tenant_tags')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_taggables');
        Schema::dropIfExists('tenant_tags');
    }
};
