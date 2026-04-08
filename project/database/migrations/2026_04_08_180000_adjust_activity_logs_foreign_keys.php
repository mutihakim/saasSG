<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['actor_user_id']);
            $table->dropForeign(['actor_member_id']);

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('actor_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('actor_member_id')->references('id')->on('tenant_members')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['actor_user_id']);
            $table->dropForeign(['actor_member_id']);

            $table->foreign('tenant_id')->references('id')->on('tenants');
            $table->foreign('actor_user_id')->references('id')->on('users');
            $table->foreign('actor_member_id')->references('id')->on('tenant_members');
        });
    }
};
