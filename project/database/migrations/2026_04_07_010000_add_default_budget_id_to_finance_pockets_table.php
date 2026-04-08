<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->ulid('default_budget_id')->nullable()->after('icon_key');
            $table->foreign('default_budget_id')
                ->references('id')
                ->on('tenant_budgets')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->dropForeign(['default_budget_id']);
            $table->dropColumn('default_budget_id');
        });
    }
};
