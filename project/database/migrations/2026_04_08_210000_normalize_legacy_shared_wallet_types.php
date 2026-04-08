<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('finance_pockets')
            ->where('type', 'shared')
            ->update([
                'type' => 'family',
                'scope' => 'shared',
            ]);
    }

    public function down(): void
    {
        DB::table('finance_pockets')
            ->where('type', 'family')
            ->where('scope', 'shared')
            ->update([
                'type' => 'shared',
            ]);
    }
};
