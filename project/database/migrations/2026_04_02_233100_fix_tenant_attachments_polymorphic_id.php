<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fix polymorphic relation type mismatch for attachments:
     * - Change attachable_id from ulid to string(100)
     * - This allows compatibility with BIGINT (FinanceTransaction) and ULID/UUID models
     * 
     * @see https://laravel.com/docs/eloquent-relationships#polymorphic-relations
     */
    public function up(): void
    {
        Schema::table('tenant_attachments', function (Blueprint $table) {
            $table->string('attachable_id', 100)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_attachments', function (Blueprint $table) {
            $table->ulid('attachable_id')->change();
        });
    }
};
