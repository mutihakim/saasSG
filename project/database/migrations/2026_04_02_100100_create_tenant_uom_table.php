<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_uom', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->string('code', 20);
            $table->string('name', 50);
            $table->string('abbreviation', 10);
            $table->string('dimension_type', 30); // e.g. berat, volume, pcs
            
            $table->string('base_unit_code', 20)->nullable();
            $table->decimal('base_factor', 18, 6)->default('1.000000');
            
            $table->boolean('is_active')->default(true);
            $table->smallInteger('sort_order')->default(0);
            $table->unsignedInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'dimension_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_uom');
    }
};
