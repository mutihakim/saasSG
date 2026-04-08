<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->string('default_budget_key', 120)->nullable()->after('default_budget_id');
            $table->index(['tenant_id', 'default_budget_key'], 'finance_pockets_default_budget_key_idx');
        });

        DB::statement('
            update finance_pockets
            set default_budget_key = tenant_budgets.budget_key
            from tenant_budgets
            where tenant_budgets.id = finance_pockets.default_budget_id
        ');
    }

    public function down(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->dropIndex('finance_pockets_default_budget_key_idx');
            $table->dropColumn('default_budget_key');
        });
    }
};
