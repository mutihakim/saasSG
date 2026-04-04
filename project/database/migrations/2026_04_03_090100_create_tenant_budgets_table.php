<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_budgets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('owner_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->string('name', 100);
            $table->string('code', 50)->nullable();
            $table->string('scope', 20)->default('shared');
            $table->string('period_month', 7);
            $table->decimal('allocated_amount', 15, 2)->default(0);
            $table->decimal('spent_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'period_month']);
            $table->index(['tenant_id', 'scope']);
            $table->index(['tenant_id', 'owner_member_id']);
            $table->unique(['tenant_id', 'period_month', 'name', 'deleted_at'], 'tenant_budgets_unique_period_name');
        });

        Schema::create('tenant_budget_member_access', function (Blueprint $table) {
            $table->id();
            $table->ulid('tenant_budget_id');
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->boolean('can_view')->default(true);
            $table->boolean('can_use')->default(true);
            $table->boolean('can_manage')->default(false);
            $table->timestamps();

            $table->foreign('tenant_budget_id')
                ->references('id')
                ->on('tenant_budgets')
                ->cascadeOnDelete();
            $table->unique(['tenant_budget_id', 'member_id'], 'tbma_budget_member_unique');
        });

        Schema::create('tenant_budget_lines', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->ulid('budget_id');
            $table->ulid('finance_transaction_id')->nullable();
            $table->foreignId('member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->string('entry_type', 20)->default('expense');
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->foreign('budget_id')->references('id')->on('tenant_budgets')->cascadeOnDelete();
            $table->foreign('finance_transaction_id')->references('id')->on('finance_transactions')->nullOnDelete();
            $table->index(['budget_id', 'created_at']);
            $table->index(['finance_transaction_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_budget_lines');
        Schema::dropIfExists('tenant_budget_member_access');
        Schema::dropIfExists('tenant_budgets');
    }
};
