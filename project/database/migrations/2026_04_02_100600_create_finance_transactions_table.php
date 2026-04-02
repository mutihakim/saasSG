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
            $table->ulid('category_id')->nullable();
            $table->char('currency_code', 3)->default('IDR');
            $table->unsignedBigInteger('created_by')->nullable();

            // Core fields
            $table->enum('type', ['pemasukan', 'pengeluaran']);
            $table->date('transaction_date');
            $table->decimal('amount', 15, 2);
            $table->string('description', 255);

            // Multi-currency fields
            $table->decimal('exchange_rate', 18, 6)->default('1.000000');
            $table->char('base_currency', 3)->default('IDR');
            $table->decimal('amount_base', 15, 2)->default(0);

            // Detail fields
            $table->text('notes')->nullable();
            $table->enum('payment_method', [
                'tunai', 'transfer', 'kartu_kredit', 'kartu_debit',
                'dompet_digital', 'qris', 'lainnya'
            ])->default('tunai');
            $table->string('reference_number', 100)->nullable();
            $table->string('merchant_name', 150)->nullable();
            $table->string('location', 200)->nullable();
            $table->enum('status', ['terverifikasi', 'pending', 'ditandai'])->default('terverifikasi');

            // OCC
            $table->unsignedInteger('row_version')->default(1);

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('category_id')
                  ->references('id')
                  ->on('shared_categories')
                  ->nullOnDelete();

            $table->foreign('currency_code')
                  ->references('code')
                  ->on('master_currencies');

            $table->foreign('created_by')
                  ->references('id')
                  ->on('tenant_members')
                  ->nullOnDelete();

            // Indexes for performance
            $table->index(['tenant_id', 'transaction_date']);
            $table->index(['tenant_id', 'type', 'transaction_date']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'currency_code']);
            $table->index(['tenant_id', 'amount_base']);
            $table->index(['tenant_id', 'deleted_at']);
            // $table->fullText(['description', 'merchant_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
