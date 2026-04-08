<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_budgets', function (Blueprint $table) {
            $table->ulid('pocket_id')->nullable()->after('owner_member_id');
            $table->foreign('pocket_id')
                ->references('id')
                ->on('finance_pockets')
                ->nullOnDelete();
            $table->index(['tenant_id', 'pocket_id']);
        });

        DB::table('finance_pockets')
            ->where('is_system', true)
            ->update([
                'name' => 'Utama',
                'slug' => 'utama',
                'type' => 'main',
                'notes' => 'Wallet sistem utama untuk account ini.',
            ]);
    }

    public function down(): void
    {
        Schema::table('tenant_budgets', function (Blueprint $table) {
            $table->dropForeign(['pocket_id']);
            $table->dropIndex(['tenant_id', 'pocket_id']);
            $table->dropColumn('pocket_id');
        });
    }
};
