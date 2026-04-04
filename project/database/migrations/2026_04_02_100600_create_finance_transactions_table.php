<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('currency_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();

            // Core fields
            $table->enum('type', ['pemasukan', 'pengeluaran', 'transfer']);
            $table->date('transaction_date');
            $table->decimal('amount', 15, 2);
            $table->string('description', 255);

            // Multi-currency fields
            $table->decimal('exchange_rate', 18, 6)->default('1.000000');
            $table->char('base_currency_code', 3)->default('IDR');
            $table->decimal('amount_base', 15, 2)->default(0);

            // Detail fields
            $table->text('notes')->nullable();
            $table->enum('payment_method', [
                'tunai', 'transfer', 'kartu_kredit', 'kartu_debit',
                'dompet_digital', 'qris', 'lainnya'
            ])->nullable();
            $table->string('reference_number', 100)->nullable();
            $table->string('merchant_name', 150)->nullable();
            $table->string('location', 200)->nullable();
            $table->enum('status', ['terverifikasi', 'pending', 'ditandai'])->default('terverifikasi');
            $table->string('source_type', 100)->nullable();
            $table->string('source_id', 100)->nullable();
            $table->char('budget_id', 26)->nullable();
            $table->char('bank_account_id', 26)->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->boolean('is_internal_transfer')->default(false);
            $table->char('transfer_pair_id', 26)->nullable();

            // Audit
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('category_id')
                  ->references('id')
                  ->on('tenant_categories')
                  ->nullOnDelete();

            $table->foreign('currency_id')
                  ->references('id')
                  ->on('tenant_currencies');

            $table->foreign('created_by')
                  ->references('id')
                  ->on('tenant_members')
                  ->nullOnDelete();

            $table->foreign('updated_by')
                  ->references('id')
                  ->on('tenant_members')
                  ->nullOnDelete();

            $table->foreign('approved_by')
                  ->references('id')
                  ->on('tenant_members')
                  ->nullOnDelete();

            // Indexes for performance
            $table->index(['tenant_id', 'transaction_date']);
            $table->index(['tenant_id', 'type', 'transaction_date']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'currency_id']);
            $table->index(['tenant_id', 'amount_base']);
            $table->index(['tenant_id', 'deleted_at']);
            $table->index(['source_type', 'source_id']);
            $table->index(['tenant_id', 'budget_id']);
            $table->index(['tenant_id', 'bank_account_id']);
            $table->index(['tenant_id', 'is_internal_transfer']);
            $table->index(['tenant_id', 'transfer_pair_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
