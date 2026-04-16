<?php

namespace Tests\Feature\Core;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;

use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantRoleApiTest extends TestCase
{

    public function test_role_index_reports_linked_and_pending_members_from_tenant_members(): void
    {
        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $owner = User::factory()->create();
        $linkedUser = User::factory()->create(['name' => 'Linked Member']);

        $tenant = Tenant::factory()->create([
            'slug' => 'role-api-test',
            'owner_user_id' => $owner->id,
            'plan_code' => 'pro',
        ]);

        Role::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'owner',
            'display_name' => 'Owner',
            'guard_name' => 'web',
            'is_system' => true,
            'row_version' => 1,
        ]);

        Role::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'parents',
            'display_name' => 'Parents',
            'guard_name' => 'web',
            'is_system' => false,
            'row_version' => 1,
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'full_name' => 'Owner Member',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $linkedUser->id,
            'full_name' => 'Linked Parent',
            'role_code' => 'parents',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => null,
            'full_name' => 'Pending Parent',
            'role_code' => 'parents',
            'profile_status' => 'active',
            'onboarding_status' => 'no_account',
            'row_version' => 1,
        ]);

        $response = $this->actingAs($owner)
            ->withHeader('X-Tenant', $tenant->slug)
            ->getJson("/api/v1/tenants/{$tenant->slug}/roles");

        $response->assertOk();
        $response->assertJsonPath('data.roles.1.name', 'parents');
        $response->assertJsonPath('data.roles.1.members_count', 2);
        $response->assertJsonPath('data.roles.1.linked_members_count', 1);
        $response->assertJsonPath('data.roles.1.pending_members_count', 1);
        $response->assertJsonCount(1, 'data.roles.1.members_preview');
    }
}
