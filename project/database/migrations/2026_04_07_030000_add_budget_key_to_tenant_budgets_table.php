<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_budgets', function (Blueprint $table): void {
            $table->string('budget_key', 120)->nullable()->after('code');
            $table->index(['tenant_id', 'budget_key', 'period_month'], 'tenant_budgets_budget_key_period_idx');
        });

        DB::table('tenant_budgets')
            ->select(['id', 'name', 'code'])
            ->orderBy('created_at')
            ->lazy()
            ->each(function ($budget): void {
                $base = trim((string) ($budget->code ?: $budget->name ?: 'budget'));
                $key = Str::slug($base, '_');

                DB::table('tenant_budgets')
                    ->where('id', $budget->id)
                    ->update(['budget_key' => $key !== '' ? $key : 'budget']);
            });
    }

    public function down(): void
    {
        Schema::table('tenant_budgets', function (Blueprint $table): void {
            $table->dropIndex('tenant_budgets_budget_key_period_idx');
            $table->dropColumn('budget_key');
        });
    }
};
