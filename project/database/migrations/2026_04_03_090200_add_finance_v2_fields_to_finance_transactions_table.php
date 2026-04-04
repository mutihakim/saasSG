<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->foreignId('owner_member_id')->nullable()->after('created_by')->constrained('tenant_members')->nullOnDelete();
            $table->string('budget_status', 20)->default('unbudgeted')->after('budget_id');
            $table->decimal('budget_delta', 15, 2)->default(0)->after('budget_status');
            $table->string('transfer_direction', 10)->nullable()->after('is_internal_transfer');

            $table->index(['tenant_id', 'owner_member_id']);
            $table->index(['tenant_id', 'budget_status']);

            $table->foreign('bank_account_id')
                ->references('id')
                ->on('tenant_bank_accounts')
                ->nullOnDelete();
            $table->foreign('budget_id')
                ->references('id')
                ->on('tenant_budgets')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->dropForeign(['bank_account_id']);
            $table->dropForeign(['budget_id']);
            $table->dropForeign(['owner_member_id']);
            $table->dropIndex(['tenant_id', 'owner_member_id']);
            $table->dropIndex(['tenant_id', 'budget_status']);
            $table->dropColumn(['owner_member_id', 'budget_status', 'budget_delta', 'transfer_direction']);
        });
    }
};
