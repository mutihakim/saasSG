<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_game_math_settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('tenant_members')->cascadeOnDelete();
            $table->string('operator', 1);
            $table->string('default_mode', 20)->default('mencariC');
            $table->unsignedInteger('default_question_count')->default(10);
            $table->unsignedInteger('default_time_limit')->default(15);
            $table->unsignedInteger('mastered_threshold')->default(8);
            $table->timestamps();

            $table->unique([
                'tenant_id',
                'member_id',
                'operator',
            ], 'tenant_game_math_settings_unique_member_op');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_game_math_settings');
    }
};
