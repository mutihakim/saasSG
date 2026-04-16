<?php

namespace App\Services\Tenant\Finance;

use App\Models\Master\TenantBankAccount;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Support\Collection;

class TenantFinanceBaselineService
{
    public function __construct(
        private readonly FinanceBaselineBlueprint $blueprint,
        private readonly FinanceWalletService $wallets,
    ) {
    }

    public function ensureTenantFinanceBaseline(Tenant $tenant): void
    {
        $activeMembers = $this->activeMembers($tenant);
        if ($activeMembers->isEmpty()) {
            return;
        }

        $sharedOwner = $this->resolveSharedOwner($activeMembers);
        $sharedAccount = $this->firstSharedBaselineAccount($tenant)
            ?? $this->createSharedBaselineAccount($tenant, $sharedOwner);

        $this->syncSharedBaselineAccount($sharedAccount, $tenant, $sharedOwner);
        $this->syncSharedAccess($sharedAccount, $activeMembers, $sharedOwner);

        foreach ($activeMembers as $member) {
            if (! $this->eligibleForPrivateBaseline($member)) {
                continue;
            }

            $this->ensureMemberFinanceBaseline($tenant, $member);
        }
    }

    public function ensureMemberFinanceBaseline(Tenant $tenant, TenantMember $member): void
    {
        if ((int) $member->tenant_id !== (int) $tenant->id || ! $this->eligibleForPrivateBaseline($member)) {
            return;
        }

        $account = $this->firstPrivateBaselineAccount($tenant, $member)
            ?? $this->createPrivateBaselineAccount($tenant, $member);

        $this->syncPrivateBaselineAccount($account, $tenant, $member);
        $this->syncPrivateAccess($account, $member);
    }

    private function activeMembers(Tenant $tenant): Collection
    {
        return $tenant->members()
            ->whereNull('deleted_at')
            ->where('profile_status', 'active')
            ->orderBy('id')
            ->get();
    }

    private function eligibleForPrivateBaseline(TenantMember $member): bool
    {
        return $member->profile_status === 'active' && $member->user_id !== null;
    }

    private function resolveSharedOwner(Collection $activeMembers): ?TenantMember
    {
        return $activeMembers->first(fn (TenantMember $member) => in_array($member->role_code, ['owner', 'tenant_owner'], true))
            ?? $activeMembers->first();
    }

    private function firstSharedBaselineAccount(Tenant $tenant): ?TenantBankAccount
    {
        return TenantBankAccount::query()
            ->where('tenant_id', $tenant->id)
            ->where('scope', $this->blueprint::SHARED_ACCOUNT_SCOPE)
            ->where('notes', $this->blueprint::SHARED_ACCOUNT_NOTES)
            ->first();
    }

    private function firstPrivateBaselineAccount(Tenant $tenant, TenantMember $member): ?TenantBankAccount
    {
        return TenantBankAccount::query()
            ->where('tenant_id', $tenant->id)
            ->where('owner_member_id', $member->id)
            ->where('scope', $this->blueprint::PRIVATE_ACCOUNT_SCOPE)
            ->where('notes', $this->blueprint::PRIVATE_ACCOUNT_NOTES)
            ->first();
    }

    private function createSharedBaselineAccount(Tenant $tenant, ?TenantMember $owner): TenantBankAccount
    {
        return TenantBankAccount::query()->create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $owner?->id,
            'name' => $this->blueprint->sharedAccountName(),
            'scope' => $this->blueprint::SHARED_ACCOUNT_SCOPE,
            'type' => $this->blueprint::DEFAULT_ACCOUNT_TYPE,
            'currency_code' => $tenant->currency_code ?: 'IDR',
            'opening_balance' => 0,
            'current_balance' => 0,
            'notes' => $this->blueprint::SHARED_ACCOUNT_NOTES,
            'is_active' => true,
            'row_version' => 1,
        ]);
    }

    private function createPrivateBaselineAccount(Tenant $tenant, TenantMember $member): TenantBankAccount
    {
        return TenantBankAccount::query()->create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $member->id,
            'name' => $this->blueprint->privateAccountName($member),
            'scope' => $this->blueprint::PRIVATE_ACCOUNT_SCOPE,
            'type' => $this->blueprint::DEFAULT_ACCOUNT_TYPE,
            'currency_code' => $tenant->currency_code ?: 'IDR',
            'opening_balance' => 0,
            'current_balance' => 0,
            'notes' => $this->blueprint::PRIVATE_ACCOUNT_NOTES,
            'is_active' => true,
            'row_version' => 1,
        ]);
    }

    private function syncSharedBaselineAccount(TenantBankAccount $account, Tenant $tenant, ?TenantMember $owner): void
    {
        $account->forceFill([
            'owner_member_id' => $owner?->id,
            'name' => $this->blueprint->sharedAccountName(),
            'scope' => $this->blueprint::SHARED_ACCOUNT_SCOPE,
            'type' => $this->blueprint::DEFAULT_ACCOUNT_TYPE,
            'currency_code' => $tenant->currency_code ?: 'IDR',
            'notes' => $this->blueprint::SHARED_ACCOUNT_NOTES,
            'is_active' => true,
        ])->save();
    }

    private function syncPrivateBaselineAccount(TenantBankAccount $account, Tenant $tenant, TenantMember $member): void
    {
        $account->forceFill([
            'owner_member_id' => $member->id,
            'name' => $this->blueprint->privateAccountName($member),
            'scope' => $this->blueprint::PRIVATE_ACCOUNT_SCOPE,
            'type' => $this->blueprint::DEFAULT_ACCOUNT_TYPE,
            'currency_code' => $tenant->currency_code ?: 'IDR',
            'notes' => $this->blueprint::PRIVATE_ACCOUNT_NOTES,
            'is_active' => true,
        ])->save();
    }

    private function syncSharedAccess(TenantBankAccount $account, Collection $activeMembers, ?TenantMember $sharedOwner): void
    {
        $sync = $activeMembers
            ->mapWithKeys(fn (TenantMember $member) => [
                (int) $member->id => [
                    'can_view' => true,
                    'can_use' => true,
                    'can_manage' => $sharedOwner && (int) $sharedOwner->id === (int) $member->id,
                ],
            ])
            ->all();

        $account->memberAccess()->sync($sync);
        $this->wallets->ensureMainWallet($account);
        $this->wallets->syncMainWalletAccessFromAccount($account);
    }

    private function syncPrivateAccess(TenantBankAccount $account, TenantMember $member): void
    {
        $account->memberAccess()->sync([
            (int) $member->id => [
                'can_view' => true,
                'can_use' => true,
                'can_manage' => true,
            ],
        ]);

        $this->wallets->ensureMainWallet($account);
        $this->wallets->syncMainWalletAccessFromAccount($account);
    }
}
