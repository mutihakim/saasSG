<?php

namespace App\Services;

use App\Models\FinancePocket;
use App\Models\Tenant;
use App\Models\TenantBankAccount;
use Illuminate\Support\Str;

class WalletPocketService
{
    public const MAIN_POCKET_NAME = 'Utama';

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
        return app(\App\Support\SubscriptionEntitlements::class)->can($tenant, 'wallet', 'view');
    }

    private function nextReferenceCode(int $tenantId): string
    {
        do {
            $reference = 'PKT-' . strtoupper(Str::random(8));
        } while (FinancePocket::query()->where('tenant_id', $tenantId)->where('reference_code', $reference)->exists());

        return $reference;
    }
}
