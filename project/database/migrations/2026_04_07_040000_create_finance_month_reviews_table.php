<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_month_reviews', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('period_month', 7);
            $table->string('status', 20)->default('open');
            $table->foreignId('started_by')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->json('snapshot_payload')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'period_month'], 'finance_month_reviews_tenant_period_unique');
            $table->index(['tenant_id', 'status'], 'finance_month_reviews_tenant_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_month_reviews');
    }
};
