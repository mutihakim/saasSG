<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * 
     * Objective: Normalizing unique indexes to support PostgreSQL SoftDeletes.
     * By using Partial Unique Index (WHERE deleted_at IS NULL), we allow 
     * reusing codes/names that have been soft-deleted.
     */
    public function up(): void
    {
        // 1. UOM
        Schema::table('tenant_uom', function (Blueprint $table) {
            $table->dropUnique('tenant_uom_tenant_id_code_unique');
        });
        DB::statement('CREATE UNIQUE INDEX tenant_uom_tenant_id_code_unique ON tenant_uom (tenant_id, code) WHERE deleted_at IS NULL');

        // 2. Currency
        Schema::table('tenant_currencies', function (Blueprint $table) {
            $table->dropUnique('tenant_currencies_tenant_id_code_unique');
        });
        DB::statement('CREATE UNIQUE INDEX tenant_currencies_tenant_id_code_unique ON tenant_currencies (tenant_id, code) WHERE deleted_at IS NULL');

        // 3. Category
        Schema::table('tenant_categories', function (Blueprint $table) {
            $table->dropUnique('unique_tenant_category_name');
        });
        // Note: sub_type is nullable, partial index will still respect this.
        DB::statement('CREATE UNIQUE INDEX unique_tenant_category_name ON tenant_categories (tenant_id, module, sub_type, name) WHERE deleted_at IS NULL');

        // 4. Tag
        Schema::table('tenant_tags', function (Blueprint $table) {
            $table->dropUnique('tenant_tags_tenant_id_name_unique');
        });
        DB::statement('CREATE UNIQUE INDEX tenant_tags_tenant_id_name_unique ON tenant_tags (tenant_id, name) WHERE deleted_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tag
        Schema::table('tenant_tags', function (Blueprint $table) {
            $table->dropIndex('tenant_tags_tenant_id_name_unique');
            $table->unique(['tenant_id', 'name']);
        });

        // Category
        Schema::table('tenant_categories', function (Blueprint $table) {
            $table->dropIndex('unique_tenant_category_name');
            $table->unique(['tenant_id', 'module', 'sub_type', 'name'], 'unique_tenant_category_name');
        });

        // Currency
        Schema::table('tenant_currencies', function (Blueprint $table) {
            $table->dropIndex('tenant_currencies_tenant_id_code_unique');
            $table->unique(['tenant_id', 'code']);
        });

        // UOM
        Schema::table('tenant_uom', function (Blueprint $table) {
            $table->dropIndex('tenant_uom_tenant_id_code_unique');
            $table->unique(['tenant_id', 'code']);
        });
    }
};
