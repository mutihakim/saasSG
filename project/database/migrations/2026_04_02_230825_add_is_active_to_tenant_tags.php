<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_tags', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('usage_count');
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('tenant_tags', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_active']);
            $table->dropColumn('is_active');
        });
    }
};
