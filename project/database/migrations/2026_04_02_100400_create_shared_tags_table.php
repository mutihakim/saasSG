<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_tags', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('color', 7)->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'usage_count']);
        });

        Schema::create('shared_taggables', function (Blueprint $table) {
            $table->ulid('shared_tag_id');
            $table->string('taggable_type', 100);
            $table->ulid('taggable_id');
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['shared_tag_id', 'taggable_type', 'taggable_id']);
            $table->index(['taggable_type', 'taggable_id']);

            $table->foreign('shared_tag_id')
                  ->references('id')
                  ->on('shared_tags')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_taggables');
        Schema::dropIfExists('shared_tags');
    }
};
