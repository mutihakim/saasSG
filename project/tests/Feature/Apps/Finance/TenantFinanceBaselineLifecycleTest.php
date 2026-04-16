<?php

namespace Tests\Feature\Apps\Finance;

use App\Models\Finance\FinanceWallet;
use App\Models\Identity\User;
use App\Models\Master\TenantBankAccount;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantInvitation;
use App\Models\Tenant\TenantMember;
use App\Services\Tenant\TenantProvisionService;

use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantFinanceBaselineLifecycleTest extends TestCase
{

    public function test_tenant_provisioning_creates_shared_and_private_finance_baseline(): void
    {
        $tenant = app(TenantProvisionService::class)->provision([
            'name' => 'Finance Baseline',
            'slug' => 'finance-baseline',
            'plan_code' => 'business',
            'members' => [
                ['key' => 'owner', 'name' => 'Owner', 'role' => 'owner'],
                ['key' => 'umma', 'name' => 'Umma', 'role' => 'member'],
            ],
        ]);

        $this->assertSame(3, TenantBankAccount::query()->where('tenant_id', $tenant->id)->count());
        $this->assertSame(3, FinanceWallet::query()->where('tenant_id', $tenant->id)->where('is_system', true)->count());
        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'scope' => 'shared',
            'notes' => '[system-baseline-shared]',
            'name' => 'Kas Keluarga',
        ]);

        $owner = TenantMember::query()->where('tenant_id', $tenant->id)->where('full_name', 'Owner')->firstOrFail();
        $umma = TenantMember::query()->where('tenant_id', $tenant->id)->where('full_name', 'Umma')->firstOrFail();

        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $owner->id,
            'scope' => 'private',
            'notes' => '[system-baseline-private]',
            'name' => 'Kas Owner',
        ]);
        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $umma->id,
            'scope' => 'private',
            'notes' => '[system-baseline-private]',
            'name' => 'Kas Umma',
        ]);
    }

    public function test_linked_member_store_creates_private_finance_baseline(): void
    {
        [$tenant, $owner] = $this->bootstrapTenantAdmin();
        $linkedUser = User::factory()->create();

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/members", [
            'user_id' => $linkedUser->id,
            'full_name' => 'Finance Child',
            'role_code' => 'member',
            'profile_status' => 'active',
        ]);

        $response->assertCreated();
        $memberId = $response->json('data.member.id');

        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $memberId,
            'scope' => 'private',
            'notes' => '[system-baseline-private]',
            'name' => 'Kas Finance',
        ]);

        $account = TenantBankAccount::query()
            ->where('tenant_id', $tenant->id)
            ->where('owner_member_id', $memberId)
            ->where('notes', '[system-baseline-private]')
            ->firstOrFail();

        $this->assertDatabaseHas('finance_wallets', [
            'tenant_id' => $tenant->id,
            'real_account_id' => $account->id,
            'is_system' => true,
            'name' => 'Utama',
        ]);
    }

    public function test_invitation_accept_creates_private_finance_baseline_for_existing_member(): void
    {
        [$tenant] = $this->bootstrapTenantAdmin();

        $member = TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => null,
            'full_name' => 'Invitee Member',
            'role_code' => 'member',
            'profile_status' => 'active',
            'onboarding_status' => 'invitation_pending',
            'row_version' => 1,
        ]);

        $invitation = TenantInvitation::create([
            'tenant_id' => $tenant->id,
            'invited_by_user_id' => $tenant->owner_user_id,
            'member_id' => $member->id,
            'email' => 'invitee@example.com',
            'full_name' => 'Invitee Member',
            'role_code' => 'member',
            'status' => 'pending',
            'token' => 'token-finance-baseline',
            'expires_at' => now()->addDay(),
        ]);

        $response = $this->postJson('/api/v1/invitations/accept', [
            'token' => $invitation->token,
            'action' => 'accept',
            'name' => 'Invitee Member',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertOk();

        $member->refresh();
        $this->assertNotNull($member->user_id);
        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $member->id,
            'scope' => 'private',
            'notes' => '[system-baseline-private]',
            'name' => 'Kas Invitee',
        ]);
    }

    public function test_normalize_roles_repairs_missing_private_finance_baseline_without_duplicate(): void
    {
        $tenant = app(TenantProvisionService::class)->provisionDefaultWorkspaceForUser(User::factory()->create(), 'Repair Finance');
        $memberUser = User::factory()->create();

        Role::query()->firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'member',
            'guard_name' => 'web',
        ], [
            'display_name' => 'Member',
            'is_system' => true,
            'row_version' => 1,
        ]);

        $member = TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $memberUser->id,
            'full_name' => 'Repair Member',
            'role_code' => 'member',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        $this->assertDatabaseMissing('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $member->id,
            'notes' => '[system-baseline-private]',
        ]);

        Artisan::call('tenant:members:normalize-roles', [
            'tenant' => $tenant->slug,
        ]);

        $this->assertDatabaseHas('tenant_bank_accounts', [
            'tenant_id' => $tenant->id,
            'owner_member_id' => $member->id,
            'scope' => 'private',
            'notes' => '[system-baseline-private]',
        ]);

        Artisan::call('tenant:members:normalize-roles', [
            'tenant' => $tenant->slug,
        ]);

        $this->assertSame(
            1,
            TenantBankAccount::query()
                ->where('tenant_id', $tenant->id)
                ->where('owner_member_id', $member->id)
                ->where('notes', '[system-baseline-private]')
                ->count()
        );
    }

    private function bootstrapTenantAdmin(): array
    {
        $user = User::factory()->create();
        $tenant = Tenant::create([
            'owner_user_id' => $user->id,
            'name' => 'Tenant Finance',
            'slug' => 'tenant-finance',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'currency_code' => 'IDR',
            'plan_code' => 'pro',
            'status' => 'active',
        ]);

        Role::query()->firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'owner',
            'guard_name' => 'web',
        ], [
            'display_name' => 'Owner',
            'is_system' => true,
            'row_version' => 1,
        ]);

        Role::query()->firstOrCreate([
            'tenant_id' => $tenant->id,
            'name' => 'member',
            'guard_name' => 'web',
        ], [
            'display_name' => 'Member',
            'is_system' => true,
            'row_version' => 1,
        ]);

        TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => 'Owner',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'onboarding_status' => 'account_active',
            'row_version' => 1,
        ]);

        Sanctum::actingAs($user);

        return [$tenant, $user];
    }
}
