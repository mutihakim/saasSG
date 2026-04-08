<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->ulid('pocket_id')->nullable()->after('bank_account_id');
            $table->foreign('pocket_id')->references('id')->on('finance_pockets')->nullOnDelete();
            $table->index(['tenant_id', 'pocket_id']);
        });
    }

    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->dropForeign(['pocket_id']);
            $table->dropIndex(['tenant_id', 'pocket_id']);
            $table->dropColumn('pocket_id');
        });
    }
};
