<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id(); // Following tenant_members (BIGINT)
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('currency_id');
            $table->unsignedBigInteger('created_by')->nullable();

            // Core fields
            $table->enum('type', ['pemasukan', 'pengeluaran']);
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
            ])->default('tunai');
            $table->string('reference_number', 100)->nullable();
            $table->string('merchant_name', 150)->nullable();
            $table->string('location', 200)->nullable();
            $table->enum('status', ['terverifikasi', 'pending', 'ditandai'])->default('terverifikasi');

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

            // Indexes for performance
            $table->index(['tenant_id', 'transaction_date']);
            $table->index(['tenant_id', 'type', 'transaction_date']);
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'currency_id']);
            $table->index(['tenant_id', 'amount_base']);
            $table->index(['tenant_id', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
