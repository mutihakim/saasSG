<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenant_members', function (Blueprint $table) {
            // Composite index for tenant member lookups
            $table->index(['tenant_id', 'user_id', 'profile_status', 'deleted_at'], 'tenant_members_tenant_user_status_idx');
            // Index for counting members by tenant
            $table->index(['tenant_id', 'profile_status', 'deleted_at'], 'tenant_members_tenant_status_idx');
            // Index for onboarding status queries
            $table->index(['tenant_id', 'onboarding_status', 'deleted_at'], 'tenant_members_tenant_onboarding_idx');
        });

        Schema::table('roles', function (Blueprint $table) {
            // Index for tenant roles filtering
            $table->index(['tenant_id', 'is_system'], 'roles_tenant_system_idx');
        });

        Schema::table('tenant_invitations', function (Blueprint $table) {
            // Index for pending invitations count
            $table->index(['tenant_id', 'status'], 'tenant_invitations_tenant_status_idx');
        });

        Schema::table('tenants', function (Blueprint $table) {
            // Index for slug lookups
            $table->index('slug', 'tenants_slug_idx');
            // Index for plan code queries
            $table->index('plan_code', 'tenants_plan_code_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_members', function (Blueprint $table) {
            $table->dropIndex('tenant_members_tenant_user_status_idx');
            $table->dropIndex('tenant_members_tenant_status_idx');
            $table->dropIndex('tenant_members_tenant_onboarding_idx');
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropIndex('roles_tenant_system_idx');
        });

        Schema::table('tenant_invitations', function (Blueprint $table) {
            $table->dropIndex('tenant_invitations_tenant_status_idx');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex('tenants_slug_idx');
            $table->dropIndex('tenants_plan_code_idx');
        });
    }
};
