<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_attachments', function (Blueprint $table) {
            $table->string('status', 20)->default('ready')->after('file_size');
            $table->text('processing_error')->nullable()->after('status');
            $table->timestamp('processed_at')->nullable()->after('processing_error');

            $table->index(['tenant_id', 'status']);
        });

        DB::table('tenant_attachments')
            ->whereNull('processed_at')
            ->update([
                'status' => 'ready',
                'processed_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('tenant_attachments', function (Blueprint $table) {
            $table->dropIndex('tenant_attachments_tenant_id_status_index');
            $table->dropColumn(['status', 'processing_error', 'processed_at']);
        });
    }
};
