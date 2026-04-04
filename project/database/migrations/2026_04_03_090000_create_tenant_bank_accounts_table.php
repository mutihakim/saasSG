<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_bank_accounts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->foreignId('owner_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->string('name', 100);
            $table->string('scope', 20)->default('private');
            $table->string('type', 30);
            $table->string('currency_code', 3)->default('IDR');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'scope']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'owner_member_id']);
        });

        Schema::create('tenant_bank_account_member_access', function (Blueprint $table) {
            $table->id();
            $table->ulid('tenant_bank_account_id');
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->boolean('can_view')->default(true);
            $table->boolean('can_use')->default(true);
            $table->boolean('can_manage')->default(false);
            $table->timestamps();

            $table->foreign('tenant_bank_account_id')
                ->references('id')
                ->on('tenant_bank_accounts')
                ->cascadeOnDelete();
            $table->unique(['tenant_bank_account_id', 'member_id'], 'tbama_account_member_unique');
            $table->index(['member_id', 'can_use']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_bank_account_member_access');
        Schema::dropIfExists('tenant_bank_accounts');
    }
};
