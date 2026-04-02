<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_attachments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('attachable_type', 100);
            $table->ulid('attachable_id');
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->enum('file_type', ['gambar', 'pdf', 'dokumen', 'audio', 'video', 'lainnya'])
                  ->default('gambar');
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->unsignedInteger('file_size')->default(0);
            $table->string('mime_type', 100)->nullable();
            $table->string('caption', 255)->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('uploaded_by')
                  ->references('id')
                  ->on('tenant_members')
                  ->onDelete('set null');

            $table->index(['attachable_type', 'attachable_id']);
            $table->index(['tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_attachments');
    }
};
