<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_whatsapp_intents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->foreignId('source_message_id')->nullable()->constrained('tenant_whatsapp_messages')->nullOnDelete();
            $table->foreignId('media_id')->nullable()->constrained('tenant_whatsapp_media')->nullOnDelete();
            $table->string('token', 120)->unique();
            $table->string('command', 40);
            $table->string('intent_type', 40);
            $table->string('input_type', 20)->default('text');
            $table->string('status', 30)->default('received');
            $table->string('ai_provider', 40)->nullable();
            $table->string('ai_model', 80)->nullable();
            $table->decimal('confidence_score', 5, 4)->nullable();
            $table->unsignedInteger('processing_time_ms')->nullable();
            $table->json('raw_input')->nullable();
            $table->json('extracted_payload')->nullable();
            $table->json('error_payload')->nullable();
            $table->string('linked_resource_type', 40)->nullable();
            $table->unsignedBigInteger('linked_resource_id')->nullable();
            $table->timestampTz('app_opened_at')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'member_id', 'status']);
        });

        Schema::table('tenant_whatsapp_intents', function (Blueprint $table) {
            $table->string('sender_jid', 60)->after('member_id');
            $table->index(['tenant_id', 'sender_jid', 'status'], 'tenant_whatsapp_intents_sender_status_idx');
        });

        Schema::create('tenant_whatsapp_intent_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intent_id')->constrained('tenant_whatsapp_intents')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 255)->nullable();
            $table->decimal('amount', 18, 2)->nullable();
            $table->string('currency_code', 10)->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['intent_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_whatsapp_intent_items');
        Schema::dropIfExists('tenant_whatsapp_intents');
    }
};
