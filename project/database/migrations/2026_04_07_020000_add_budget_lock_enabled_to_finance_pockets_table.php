<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->boolean('budget_lock_enabled')
                ->default(false)
                ->after('default_budget_id');
        });
    }

    public function down(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->dropColumn('budget_lock_enabled');
        });
    }
};
