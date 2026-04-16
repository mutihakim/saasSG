<?php

namespace Tests\Feature\Core;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Services\Tenant\TenantProvisionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantBrandingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_branding_upload_uses_stable_slots_and_removes_previous_file_on_overwrite(): void
    {
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
        [$owner, $tenant] = $this->provisionTenant();

        $this->actingAs($owner)
            ->patch(route('tenant.settings.branding', $tenant->slug), [
                'logo_dark' => UploadedFile::fake()->image('logo-dark.png', 320, 100),
                'favicon' => UploadedFile::fake()->image('favicon.png', 32, 32),
            ])
            ->assertRedirect(route('tenant.settings.branding', $tenant->slug));

        Storage::disk('public')->assertExists("tenants/{$tenant->id}/branding/logo-dark.png");
        Storage::disk('public')->assertExists("tenants/{$tenant->id}/branding/favicon.png");

        // Delete finance baseline accounts (created by TenantFinanceBaselineService during provisioning)
        DB::table('tenant_bank_accounts')->where('tenant_id', $tenant->id)->delete();
        DB::table('tenant_members')->where('tenant_id', $tenant->id)->delete();
        $tenant->delete();

        Storage::disk('public')->assertMissing("tenants/{$tenant->id}/branding/logo-dark.png");
        Storage::disk('public')->assertMissing("tenants/{$tenant->id}/branding/favicon.png");
    }

    public function test_branding_mutations_write_activity_logs(): void
    {
        [$owner, $tenant] = $this->provisionTenant();
        $memberId = TenantMember::query()->where('tenant_id', $tenant->id)->where('user_id', $owner->id)->value('id');

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
    }

    private function provisionTenant(): array
    {
        $owner = User::factory()->create();
        $tenant = app(TenantProvisionService::class)->provisionDefaultWorkspaceForUser($owner, 'Cabinet');

        return [$owner, $tenant];
    }
}
