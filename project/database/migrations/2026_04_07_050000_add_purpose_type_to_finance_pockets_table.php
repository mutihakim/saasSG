<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            // purpose_type menentukan tujuan fungsional wallet:
            // 'spending' = wallet pengeluaran rutin (dapat diberi budget)
            // 'saving'   = wallet tabungan/simpanan jangka panjang (tidak perlu budget belanja)
            // 'income'   = wallet penerimaan pendapatan (kotak masuk)
            $table->string('purpose_type', 20)->default('spending')->after('type');
            $table->index(['tenant_id', 'purpose_type'], 'finance_pockets_tenant_purpose_idx');
        });
    }

    public function down(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table): void {
            $table->dropIndex('finance_pockets_tenant_purpose_idx');
            $table->dropColumn('purpose_type');
        });
    }
};
