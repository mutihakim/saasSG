<?php

namespace App\Services\Finance\Wallet;

use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use Illuminate\Support\Str;

class WalletPocketService
{
    public const MAIN_POCKET_NAME = 'Utama';
    public const DEFAULT_SHARED_TYPE = 'family';

    public function ensureMainPocket(TenantBankAccount $account): FinancePocket
    {
        $existing = FinancePocket::query()
            ->where('tenant_id', $account->tenant_id)
            ->where('real_account_id', $account->id)
            ->where('is_system', true)
            ->first();

        if ($existing) {
            $existing->forceFill([
                'owner_member_id' => $account->owner_member_id,
                'name' => self::MAIN_POCKET_NAME,
                'slug' => Str::slug(self::MAIN_POCKET_NAME),
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

        return FinancePocket::create([
            'tenant_id' => $account->tenant_id,
            'real_account_id' => $account->id,
            'owner_member_id' => $account->owner_member_id,
            'name' => self::MAIN_POCKET_NAME,
            'slug' => Str::slug(self::MAIN_POCKET_NAME),
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

    public function resolveMainPocketForAccount(TenantBankAccount $account): FinancePocket
    {
        return $this->ensureMainPocket($account);
    }

    public function syncMainPocketAccessFromAccount(TenantBankAccount $account): FinancePocket
    {
        $mainPocket = $this->ensureMainPocket($account);
        $this->syncPocketAccessFromAccount($account, $mainPocket);

        return $mainPocket->fresh(['memberAccess:id,full_name']);
    }

    public function syncPocketAccessFromAccount(TenantBankAccount $account, FinancePocket $pocket): FinancePocket
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

        $pocket->memberAccess()->sync($sync);

        return $pocket->fresh(['memberAccess:id,full_name']);
    }

    public function syncInheritedPocketsFromAccount(TenantBankAccount $account): void
    {
        $this->syncMainPocketAccessFromAccount($account);

        $sharedPockets = FinancePocket::query()
            ->where('tenant_id', $account->tenant_id)
            ->where('real_account_id', $account->id)
            ->where('is_system', false)
            ->where('scope', 'shared')
            ->get();

        foreach ($sharedPockets as $pocket) {
            $pocket->forceFill([
                'owner_member_id' => $account->owner_member_id,
                'scope' => $account->scope === 'shared' ? 'shared' : 'private',
                'currency_code' => $account->currency_code,
                'type' => $pocket->type === 'shared' ? self::DEFAULT_SHARED_TYPE : $pocket->type,
                'row_version' => (int) $pocket->row_version + 1,
            ])->save();

            if ($account->scope === 'shared') {
                $this->syncPocketAccessFromAccount($account, $pocket);
            } else {
                $pocket->memberAccess()->sync([]);
            }
        }
    }

    public function applyOpeningBalanceDelta(TenantBankAccount $account, float $delta): FinancePocket
    {
        $mainPocket = $this->ensureMainPocket($account);

        if (abs($delta) > 0.000001) {
            $mainPocket->forceFill([
                'current_balance' => round(((float) $mainPocket->current_balance) + $delta, 2),
            ])->save();
        }

        $this->reconcileAccountBalance($account);

        return $mainPocket->fresh();
    }

    public function reconcileAccountBalance(TenantBankAccount $account): float
    {
        $totalPocketBalance = round((float) $account->pockets()->sum('current_balance'), 2);

        $account->forceFill([
            'current_balance' => $totalPocketBalance,
        ])->save();

        return $totalPocketBalance;
    }

    public function walletSubscribed(Tenant $tenant): bool
    {
        return app(\App\Support\SubscriptionEntitlements::class)->can($tenant, 'finance', 'view');
    }

    private function nextReferenceCode(int $tenantId): string
    {
        do {
            $reference = 'PKT-' . strtoupper(Str::random(8));
        } while (FinancePocket::query()->where('tenant_id', $tenantId)->where('reference_code', $reference)->exists());

        return $reference;
    }
}
