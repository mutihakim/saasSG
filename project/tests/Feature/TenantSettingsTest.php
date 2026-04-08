<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;
use App\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TenantSettingsTest extends TestCase
{
    use RefreshDatabase;

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
        $memberUser->assignRole('member');

        $response = $this->actingAs($memberUser)
            ->get(route('tenant.settings.profile', $tenant->slug));

        $response->assertForbidden();
        $response->assertInertia(fn (Assert $page) => $page->component('Tenant/Forbidden'));
    }

    public function test_branding_upload_uses_stable_slots_and_removes_previous_file_on_overwrite(): void
    {
        Storage::fake('public');
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_light' => UploadedFile::fake()->image('tenant-light.png', 320, 100),
            ])
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        $tenant->refresh();
        $this->assertSame("tenants/{$tenant->id}/branding/logo-light.png", $tenant->logo_light_path);
        Storage::disk('public')->assertExists($tenant->logo_light_path);

        $oldPath = $tenant->logo_light_path;

        $this->actingAs($owner)
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_light' => UploadedFile::fake()->image('tenant-light.jpg', 320, 100),
            ])
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        $tenant->refresh();
        $this->assertSame("tenants/{$tenant->id}/branding/logo-light.jpg", $tenant->logo_light_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($tenant->logo_light_path);
    }

    public function test_branding_slot_can_be_reset_to_global_fallback(): void
    {
        Storage::fake('public');
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_icon' => UploadedFile::fake()->image('logo-icon.png', 128, 128),
            ])
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        $tenant->refresh();
        Storage::disk('public')->assertExists($tenant->logo_icon_path);

        $this->actingAs($owner)
            ->delete(route('tenant.settings.branding.remove', ['tenant' => $tenant->slug, 'slot' => 'logo_icon']))
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        $tenant->refresh();
        $this->assertNull($tenant->logo_icon_path);
        Storage::disk('public')->assertMissing("tenants/{$tenant->id}/branding/logo-icon.png");
    }

    public function test_branding_upload_validates_allowed_mimes_and_sizes(): void
    {
        Storage::fake('public');
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->from(route('tenant.settings.branding', $tenant->slug))
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'favicon' => UploadedFile::fake()->create('favicon.txt', 10, 'text/plain'),
            ])
            ->assertSessionHasErrors('favicon')
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));
    }

    public function test_deleting_tenant_removes_branding_directory(): void
    {
        Storage::fake('public');
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_dark' => UploadedFile::fake()->image('logo-dark.png', 320, 100),
                'favicon' => UploadedFile::fake()->image('favicon.png', 32, 32),
            ])
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        Storage::disk('public')->assertExists("tenants/{$tenant->id}/branding/logo-dark.png");
        Storage::disk('public')->assertExists("tenants/{$tenant->id}/branding/favicon.png");

        DB::table('tenant_members')->where('tenant_id', $tenant->id)->delete();
        $tenant->delete();

        Storage::disk('public')->assertMissing("tenants/{$tenant->id}/branding/logo-dark.png");
        Storage::disk('public')->assertMissing("tenants/{$tenant->id}/branding/favicon.png");
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
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_light' => UploadedFile::fake()->image('tenant-light.png', 320, 100),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_member_id' => $memberId,
            'action' => 'tenant.settings.branding.updated',
            'target_type' => 'tenants',
            'target_id' => (string) $tenant->id,
        ]);

        $this->actingAs($owner)
            ->delete(route('tenant.settings.branding.remove', ['tenant' => $tenant->slug, 'slot' => 'logo_light']))
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_member_id' => $memberId,
            'action' => 'tenant.settings.branding.reset',
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
        $tenant = app(TenantProvisioningService::class)->provisionDefaultWorkspaceForUser($owner, 'Cabinet');

        return [$owner, $tenant];
    }
}
