<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_bank_account_member_access', function (Blueprint $table) {
            $table->index(
                ['member_id', 'can_view', 'tenant_bank_account_id'],
                'tbama_member_can_view_account_idx'
            );
        });

        Schema::table('tenant_budget_member_access', function (Blueprint $table) {
            $table->index(
                ['member_id', 'can_view', 'tenant_budget_id'],
                'tbma_member_can_view_budget_idx'
            );
        });

        Schema::table('finance_pocket_member_access', function (Blueprint $table) {
            $table->index(
                ['member_id', 'can_view', 'finance_pocket_id'],
                'fpma_member_can_view_pocket_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('tenant_bank_account_member_access', function (Blueprint $table) {
            $table->dropIndex('tbama_member_can_view_account_idx');
        });

        Schema::table('tenant_budget_member_access', function (Blueprint $table) {
            $table->dropIndex('tbma_member_can_view_budget_idx');
        });

        Schema::table('finance_pocket_member_access', function (Blueprint $table) {
            $table->dropIndex('fpma_member_can_view_pocket_idx');
        });
    }
};
