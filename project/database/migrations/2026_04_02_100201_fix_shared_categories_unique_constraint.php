<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shared_categories', function (Blueprint $table) {
            // Drop the old unique constraint that includes parent_id
            $table->dropUnique(['tenant_id', 'module', 'sub_type', 'parent_id', 'name']);

            // Add new unique constraint: name must be unique per tenant + module
            // This prevents duplicate category names within the same tenant and module
            $table->unique(['tenant_id', 'module', 'name'], 'unique_tenant_module_name');
        });
    }

    public function down(): void
    {
        Schema::table('shared_categories', function (Blueprint $table) {
            // Drop the new constraint
            $table->dropUnique('unique_tenant_module_name');

            // Restore the old constraint
            $table->unique(['tenant_id', 'module', 'sub_type', 'parent_id', 'name'], 'shared_categories_tenant_id_module_sub_type_parent_id_name_unique');
        });
    }
};
