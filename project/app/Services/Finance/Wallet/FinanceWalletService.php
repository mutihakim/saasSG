<?php

namespace App\Services\Finance\Wallet;

use App\Models\Finance\FinanceWallet;
use App\Models\Tenant\Tenant;
use App\Models\Master\TenantBankAccount;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Str;

class FinanceWalletService
{
    public const MAIN_WALLET_NAME = 'Utama';
    public const MAIN_POCKET_NAME = self::MAIN_WALLET_NAME;
    public const DEFAULT_SHARED_TYPE = 'family';

    public function ensureMainWallet(TenantBankAccount $account): FinanceWallet
    {
        $existing = FinanceWallet::query()
            ->where('tenant_id', $account->tenant_id)
            ->where('real_account_id', $account->id)
            ->where('is_system', true)
            ->first();

        if ($existing) {
            $existing->forceFill([
                'owner_member_id' => $account->owner_member_id,
                'name' => self::MAIN_WALLET_NAME,
                'slug' => Str::slug(self::MAIN_WALLET_NAME),
                'type' => 'main',
                'scope' => $account->scope,
                'currency_code' => $account->currency_code,
                'icon_key' => $existing->icon_key ?: 'ri-safe-line',
                'purpose_type' => 'spending',
                'notes' => 'Wallet sistem utama untuk account ini.',
                'is_active' => (bool) $account->is_active,
            ])->save();

            return $existing;
        }

        return FinanceWallet::create([
            'tenant_id' => $account->tenant_id,
            'real_account_id' => $account->id,
            'owner_member_id' => $account->owner_member_id,
            'name' => self::MAIN_WALLET_NAME,
            'slug' => Str::slug(self::MAIN_WALLET_NAME),
            'type' => 'main',
            'is_system' => true,
            'scope' => $account->scope,
            'currency_code' => $account->currency_code,
            'reference_code' => $this->nextReferenceCode($account->tenant_id),
            'icon_key' => 'ri-safe-line',
            'purpose_type' => 'spending',
            'current_balance' => (float) ($account->current_balance ?? 0),
            'notes' => 'Wallet sistem utama untuk account ini.',
            'is_active' => (bool) $account->is_active,
            'row_version' => 1,
        ]);
    }

    public function ensureMainPocket(TenantBankAccount $account): FinanceWallet
    {
        return $this->ensureMainWallet($account);
    }

    public function resolveMainWalletForAccount(TenantBankAccount $account): FinanceWallet
    {
        return $this->ensureMainWallet($account);
    }

    public function resolveMainPocketForAccount(TenantBankAccount $account): FinanceWallet
    {
        return $this->resolveMainWalletForAccount($account);
    }

    public function syncMainWalletAccessFromAccount(TenantBankAccount $account): FinanceWallet
    {
        $mainWallet = $this->ensureMainWallet($account);
        $this->syncWalletAccessFromAccount($account, $mainWallet);

        return $mainWallet->fresh(['memberAccess:id,full_name']);
    }

    public function syncMainPocketAccessFromAccount(TenantBankAccount $account): FinanceWallet
    {
        return $this->syncMainWalletAccessFromAccount($account);
    }

    public function syncWalletAccessFromAccount(TenantBankAccount $account, FinanceWallet $wallet): FinanceWallet
    {
        $account->loadMissing('memberAccess:id');

        $sync = $account->memberAccess
            ->mapWithKeys(fn (TenantMember $sharedMember) => [
                (int) $sharedMember->id => [
                    'can_view' => (bool) $sharedMember->pivot?->can_view,
                    'can_use' => (bool) $sharedMember->pivot?->can_use,
                    'can_manage' => (bool) $sharedMember->pivot?->can_manage,
                ],
            ])
            ->all();

        if ($account->owner_member_id) {
            $sync[(int) $account->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
        }

        $wallet->memberAccess()->sync($sync);

        return $wallet->fresh(['memberAccess:id,full_name']);
    }

    public function syncPocketAccessFromAccount(TenantBankAccount $account, FinanceWallet $wallet): FinanceWallet
    {
        return $this->syncWalletAccessFromAccount($account, $wallet);
    }

    public function syncInheritedWalletsFromAccount(TenantBankAccount $account): void
    {
        $this->syncMainWalletAccessFromAccount($account);

        $sharedWallets = FinanceWallet::query()
            ->where('tenant_id', $account->tenant_id)
            ->where('real_account_id', $account->id)
            ->where('is_system', false)
            ->where('scope', 'shared')
            ->get();

        foreach ($sharedWallets as $wallet) {
            $wallet->forceFill([
                'owner_member_id' => $account->owner_member_id,
                'scope' => $account->scope === 'shared' ? 'shared' : 'private',
                'currency_code' => $account->currency_code,
                'type' => $wallet->type === 'shared' ? self::DEFAULT_SHARED_TYPE : $wallet->type,
                'row_version' => (int) $wallet->row_version + 1,
            ])->save();

            if ($account->scope === 'shared') {
                $this->syncWalletAccessFromAccount($account, $wallet);
            } else {
                $wallet->memberAccess()->sync([]);
            }
        }
    }

    public function syncInheritedPocketsFromAccount(TenantBankAccount $account): void
    {
        $this->syncInheritedWalletsFromAccount($account);
    }

    public function applyOpeningBalanceDelta(TenantBankAccount $account, float $delta): FinanceWallet
    {
        $mainWallet = $this->ensureMainWallet($account);

        if (abs($delta) > 0.000001) {
            $mainWallet->forceFill([
                'current_balance' => round(((float) $mainWallet->current_balance) + $delta, 2),
            ])->save();
        }

        $this->reconcileAccountBalance($account);

        return $mainWallet->fresh();
    }

    public function reconcileAccountBalance(TenantBankAccount $account): float
    {
        $totalWalletBalance = round((float) $account->wallets()->sum('current_balance'), 2);

        $account->forceFill([
            'current_balance' => $totalWalletBalance,
        ])->save();

        return $totalWalletBalance;
    }

    public function walletSubscribed(Tenant $tenant): bool
    {
        return app(\App\Support\SubscriptionEntitlements::class)->can($tenant, 'finance', 'view');
    }

    private function nextReferenceCode(int $tenantId): string
    {
        do {
            $reference = 'PKT-' . strtoupper(Str::random(8));
        } while (FinanceWallet::query()->where('tenant_id', $tenantId)->where('reference_code', $reference)->exists());

        return $reference;
    }
}
