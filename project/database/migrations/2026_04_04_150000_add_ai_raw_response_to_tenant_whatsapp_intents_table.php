<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_whatsapp_intents', function (Blueprint $table) {
            $table->json('ai_raw_response')->nullable()->after('extracted_payload');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_whatsapp_intents', function (Blueprint $table) {
            $table->dropColumn('ai_raw_response');
        });
    }
};
