<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_pockets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->ulid('real_account_id');
            $table->foreignId('owner_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->string('name', 100);
            $table->string('slug', 120)->nullable();
            $table->string('type', 30)->default('personal');
            $table->string('scope', 20)->default('private');
            $table->string('currency_code', 3)->default('IDR');
            $table->string('reference_code', 40);
            $table->string('icon_key', 60)->nullable();
            $table->decimal('target_amount', 15, 2)->nullable();
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('real_account_id')
                ->references('id')
                ->on('tenant_bank_accounts')
                ->cascadeOnDelete();

            $table->unique(['tenant_id', 'reference_code'], 'finance_pockets_tenant_reference_unique');
            $table->index(['tenant_id', 'real_account_id']);
            $table->index(['tenant_id', 'scope']);
            $table->index(['tenant_id', 'owner_member_id']);
        });

        Schema::create('finance_pocket_member_access', function (Blueprint $table) {
            $table->id();
            $table->ulid('finance_pocket_id');
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->boolean('can_view')->default(true);
            $table->boolean('can_use')->default(true);
            $table->boolean('can_manage')->default(false);
            $table->timestamps();

            $table->foreign('finance_pocket_id')
                ->references('id')
                ->on('finance_pockets')
                ->cascadeOnDelete();
            $table->unique(['finance_pocket_id', 'member_id'], 'fpma_pocket_member_unique');
            $table->index(['member_id', 'can_use']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_pocket_member_access');
        Schema::dropIfExists('finance_pockets');
    }
};
