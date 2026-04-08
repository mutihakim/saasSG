<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('finance_goal_activities');
    }

    public function down(): void
    {
        Schema::create('finance_goal_activities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->ulid('goal_id');
            $table->ulid('pocket_id');
            $table->ulid('source_pocket_id')->nullable();
            $table->foreignId('actor_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->ulid('related_transaction_id')->nullable();
            $table->string('event_type', 40);
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('description', 255)->nullable();
            $table->text('notes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();

            $table->foreign('goal_id')->references('id')->on('finance_savings_goals')->cascadeOnDelete();
            $table->foreign('pocket_id')->references('id')->on('finance_pockets')->cascadeOnDelete();
            $table->foreign('source_pocket_id')->references('id')->on('finance_pockets')->nullOnDelete();
            $table->foreign('related_transaction_id')->references('id')->on('finance_transactions')->nullOnDelete();

            $table->index(['tenant_id', 'goal_id', 'occurred_at']);
            $table->index(['tenant_id', 'pocket_id']);
        });
    }
};
