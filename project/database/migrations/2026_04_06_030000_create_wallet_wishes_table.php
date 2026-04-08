<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_wishes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->ulid('goal_id')->nullable();
            $table->string('title', 140);
            $table->text('description')->nullable();
            $table->decimal('estimated_amount', 15, 2)->nullable();
            $table->string('priority', 20)->default('medium');
            $table->string('status', 20)->default('pending');
            $table->string('image_url', 2000)->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->foreignId('approved_by_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->unsignedInteger('row_version')->default(1);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('goal_id')->references('id')->on('finance_savings_goals')->nullOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_wishes');
    }
};
