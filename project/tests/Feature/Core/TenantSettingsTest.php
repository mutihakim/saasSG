<?php

namespace Tests\Feature\Core;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Services\Tenant\TenantProvisionService;
use Illuminate\Support\Facades\DB;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TenantSettingsTest extends TestCase
{

    public function test_owner_can_view_and_update_tenant_settings_pages(): void
    {
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->get(route('tenant.settings', $tenant->slug))
            ->assertRedirect(route('tenant.settings.profile', $tenant->slug));

        $this->actingAs($owner)
            ->get(route('tenant.settings.profile', $tenant->slug))
            ->assertOk();

        $this->actingAs($owner)
            ->patch(route('tenant.settings.profile', $tenant->slug), [
                'display_name' => 'Cabinet Pro',
                'legal_name' => 'PT Cabinet Pro',
                'registration_number' => 'REG-123',
                'tax_id' => 'TAX-321',
                'industry' => 'SaaS',
                'website_url' => 'https://cabinet.test',
                'support_email' => 'support@cabinet.test',
                'billing_email' => 'billing@cabinet.test',
                'phone' => '+62-811-0000-0000',
                'address_line_1' => 'Jl. Sudirman No. 1',
                'address_line_2' => 'Suite 12A',
                'city' => 'Jakarta',
                'state_region' => 'DKI Jakarta',
                'postal_code' => '10220',
                'country_code' => 'ID',
            ])
            ->assertRedirect(route('tenant.settings.profile', $tenant->slug));

        $this->assertSame('Cabinet Pro', $tenant->fresh()->display_name);

        $this->actingAs($owner)
            ->patch(route('tenant.settings.localization', $tenant->slug), [
                'locale' => 'en',
                'timezone' => 'Asia/Singapore',
                'currency_code' => 'USD',
                'country_code' => 'SG',
            ])
            ->assertRedirect(route('tenant.settings.localization', $tenant->slug));

        $tenant->refresh();
        $this->assertSame('en', $tenant->locale);
        $this->assertSame('USD', $tenant->currency_code);

        $this->actingAs($owner)
            ->patch(route('tenant.settings.billing', $tenant->slug), [
                'billing_contact_name' => 'Finance Team',
                'billing_email' => 'finance@cabinet.test',
                'legal_name' => 'PT Cabinet Pro',
                'tax_id' => 'TAX-321',
                'address_line_1' => 'Jl. Sudirman No. 1',
                'address_line_2' => 'Suite 12A',
                'city' => 'Jakarta',
                'state_region' => 'DKI Jakarta',
                'postal_code' => '10220',
                'country_code' => 'ID',
            ])
            ->assertRedirect(route('tenant.settings.billing', $tenant->slug));

        $this->assertSame('Finance Team', $tenant->fresh()->billing_contact_name);
    }

    public function test_member_without_settings_permission_cannot_access_tenant_settings(): void
    {
        [$owner, $tenant] = $this->provisionTenant();
        $memberUser = User::factory()->create();

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $memberUser->id,
            'full_name' => $memberUser->name,
            'role_code' => 'member',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $memberRole = Role::firstOrCreate(['name' => 'member', 'guard_name' => 'web', 'tenant_id' => $tenant->id]);
        // Ensure member role does NOT have tenant.settings permissions
        $memberRole->syncPermissions([]);
        $memberUser->assignRole('member');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $response = $this->actingAs($memberUser)
            ->get(route('tenant.settings.profile', $tenant->slug));

        $response->assertForbidden();
        $response->assertInertia(fn (Assert $page) => $page->component('Tenant/Forbidden'));
    }


    public function test_settings_mutations_write_activity_logs(): void
    {
        Storage::fake('public');
        [$owner, $tenant] = $this->provisionTenant();
        $memberId = TenantMember::query()->where('tenant_id', $tenant->id)->where('user_id', $owner->id)->value('id');

        $this->actingAs($owner)
            ->patch(route('tenant.settings.profile', $tenant->slug), [
                'display_name' => 'Cabinet Audit',
                'legal_name' => 'PT Cabinet Audit',
                'registration_number' => 'REG-456',
                'tax_id' => 'TAX-456',
                'industry' => 'SaaS',
                'website_url' => 'https://audit.test',
                'support_email' => 'support@audit.test',
                'billing_email' => 'billing@audit.test',
                'phone' => '+62-811-1111-1111',
                'address_line_1' => 'Jl. Audit',
                'address_line_2' => 'Suite 1',
                'city' => 'Jakarta',
                'state_region' => 'DKI Jakarta',
                'postal_code' => '10110',
                'country_code' => 'ID',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_member_id' => $memberId,
            'action' => 'tenant.settings.profile.updated',
            'target_type' => 'tenants',
            'target_id' => (string) $tenant->id,
        ]);


        $this->actingAs($owner)
            ->patch(route('tenant.settings.localization', $tenant->slug), [
                'locale' => 'en',
                'timezone' => 'Asia/Singapore',
                'currency_code' => 'USD',
                'country_code' => 'SG',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_member_id' => $memberId,
            'action' => 'tenant.settings.localization.updated',
            'target_type' => 'tenants',
            'target_id' => (string) $tenant->id,
        ]);

        $this->actingAs($owner)
            ->patch(route('tenant.settings.billing', $tenant->slug), [
                'billing_contact_name' => 'Audit Finance',
                'billing_email' => 'finance@audit.test',
                'legal_name' => 'PT Cabinet Audit',
                'tax_id' => 'TAX-456',
                'address_line_1' => 'Jl. Audit',
                'address_line_2' => 'Suite 1',
                'city' => 'Jakarta',
                'state_region' => 'DKI Jakarta',
                'postal_code' => '10110',
                'country_code' => 'ID',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_member_id' => $memberId,
            'action' => 'tenant.settings.billing.updated',
            'target_type' => 'tenants',
            'target_id' => (string) $tenant->id,
        ]);
    }

    private function provisionTenant(): array
    {
        $owner = User::factory()->create();
        $tenant = app(TenantProvisionService::class)->provisionDefaultWorkspaceForUser($owner, 'Cabinet');

        return [$owner, $tenant];
    }
}
