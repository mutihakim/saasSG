<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('finance_pockets', 'target_amount')) {
            Schema::table('finance_pockets', function (Blueprint $table) {
                $table->dropColumn('target_amount');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('finance_pockets', 'target_amount')) {
            Schema::table('finance_pockets', function (Blueprint $table) {
                $table->decimal('target_amount', 15, 2)->nullable()->after('icon_key');
            });
        }
    }
};
