<?php

namespace Database\Seeders\Tenant\Finance\Demo;

use App\Models\Finance\FinanceWallet;
use App\Models\Master\TenantBankAccount;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\Wallet\FinanceWalletService;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo-only wallet/pocket seeder.
 *
 * Creates sample non-system wallets (pockets) from FamilyFinanceSeed blueprints
 * for demo/sample tenants. This runs AFTER the finance baseline has already
 * created accounts and main system wallets.
 *
 * Accounts that don't exist in the tenant are silently skipped, so this seeder
 * is safe to run on any tenant regardless of which baseline accounts are present.
 */
class TenantFinanceWalletSeeder extends Seeder
{
    /**
     * Map wallet names to appropriate icons
     */
    private function getIconForWallet(string $name): string
    {
        $nameLower = strtolower($name);

        $iconMap = [
            // Spending wallets
            'belanja' => 'ri-shopping-bag-line',
            'jajan' => 'ri-cake-line',
            'snack' => 'ri-cake-line',
            'makan' => 'ri-restaurant-line',
            'minum' => 'ri-cup-line',
            'cafe' => 'ri-cup-line',
            'transport' => 'ri-car-line',
            'mobil' => 'ri-car-line',
            'motor' => 'ri-bike-line',
            'bensin' => 'ri-gas-station-line',
            'fashion' => 'ri-t-shirt-line',
            'pakaian' => 'ri-t-shirt-line',
            'baju' => 'ri-t-shirt-line',
            'hiburan' => 'ri-movie-2-line',
            'film' => 'ri-movie-2-line',
            'game' => 'ri-game-line',
            'main' => 'ri-game-line',
            'rumah' => 'ri-home-4-line',
            'dapur' => 'ri-restaurant-2-line',
            'listrik' => 'ri-lightbulb-line',
            'air' => 'ri-water-flash-line',
            'internet' => 'ri-wifi-line',
            'kosmetik' => 'ri-magic-line',
            'makeup' => 'ri-magic-line',
            'sehat' => 'ri-heart-line',
            'kesehatan' => 'ri-heart-line',
            'obat' => 'ri-medicine-bottle-line',
            'dokter' => 'ri-stethoscope-line',
            'edukasi' => 'ri-book-read-line',
            'belajar' => 'ri-book-read-line',
            'sekolah' => 'ri-school-line',
            'bisnis' => 'ri-briefcase-4-line',
            'kerja' => 'ri-briefcase-4-line',

            // Saving wallets
            'tabungan' => 'ri-safe-2-line',
            'tabung' => 'ri-safe-2-line',
            'simpan' => 'ri-safe-2-line',
            'travel' => 'ri-plane-line',
            'liburan' => 'ri-plane-line',
            'vacation' => 'ri-plane-line',
            'jalan' => 'ri-plane-line',
            'ibadah' => 'ri-hand-heart-line',
            'haji' => 'ri-hand-heart-line',
            'umroh' => 'ri-hand-heart-line',
            'masjid' => 'ri-hand-heart-line',
            'zakat' => 'ri-hand-heart-line',
            'infak' => 'ri-hand-heart-line',
            'sedekah' => 'ri-hand-heart-line',
            'donasi' => 'ri-hand-heart-line',
            'gadget' => 'ri-macbook-line',
            'hp' => 'ri-smartphone-line',
            'laptop' => 'ri-macbook-line',
            'furnitur' => 'ri-home-heart-line',
            'mebel' => 'ri-home-heart-line',
            'perabot' => 'ri-home-heart-line',
            'rumah_tangga' => 'ri-home-heart-line',
            'investasi' => 'ri-stock-line',
            'saham' => 'ri-stock-line',
            'dana_darurat' => 'ri-shield-check-line',
            'darurat' => 'ri-shield-check-line',
            'kadoin' => 'ri-gift-2-line',
            'hadiah' => 'ri-gift-2-line',
            'ultah' => 'ri-gift-2-line',
            'arisan' => 'ri-team-line',

            // Income wallets
            'gaji' => 'ri-money-dollar-circle-line',
            'salary' => 'ri-money-dollar-circle-line',
            'pendapatan' => 'ri-money-dollar-circle-line',
            'income' => 'ri-money-dollar-circle-line',
            'bonus' => 'ri-trophy-line',
            'thr' => 'ri-red-packet-line',
            'tunjangan' => 'ri-money-dollar-circle-line',
            'hasil' => 'ri-hand-coin-line',
            'profit' => 'ri-hand-coin-line',
            'keuntungan' => 'ri-hand-coin-line',
        ];

        // Find the best match
        foreach ($iconMap as $keyword => $icon) {
            if (str_contains($nameLower, $keyword)) {
                return $icon;
            }
        }

        return 'ri-wallet-3-line'; // Default
    }

    public function run(): void
    {
        $service = app(FinanceWalletService::class);
        $colors = [
            '#fef08a', '#06b6d4', '#fbcfe8', '#86efac', '#fcd34d', '#93c5fd', '#c4b5fd', '#ffedd5', '#e2e8f0',
        ];

        Tenant::query()->orderBy('id')->each(function (Tenant $tenant) use ($service, $colors): void {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->get()
                ->keyBy(fn (TenantMember $member) => strtolower($member->full_name));

            $accounts = TenantBankAccount::query()
                ->where('tenant_id', $tenant->id)
                ->get()
                ->keyBy('name');

            // Ensure every account has a main system wallet with proper icon/color
            $accounts->each(function (TenantBankAccount $account) use ($service, $colors): void {
                $mainPocket = $service->ensureMainWallet($account);
                if (!$mainPocket->background_color) {
                    $mainPocket->update(['background_color' => $colors[array_rand($colors)]]);
                }
                if (!$mainPocket->icon_key || $mainPocket->icon_key === 'ri-wallet-line') {
                    $mainPocket->update(['icon_key' => 'ri-wallet-3-line']);
                }
            });

            // Create demo pockets from blueprints (skipped if account doesn't exist)
            foreach (FamilyFinanceSeed::pocketBlueprints($tenant->slug) as $accountName => $pockets) {
                $account = $accounts->get($accountName);
                if (! $account) {
                    continue;
                }

                foreach ($pockets as $seed) {
                    FamilyFinanceSeed::assertCompactName($seed['name']);

                    FinanceWallet::query()->firstOrNew([
                        'tenant_id' => $tenant->id,
                        'real_account_id' => $account->id,
                        'name' => $seed['name'],
                    ], [
                        'owner_member_id' => $account->owner_member_id,
                        'slug' => Str::slug($seed['name']),
                        'type' => $seed['type'],
                        'purpose_type' => $seed['purpose_type'] ?? 'spending',
                        'is_system' => false,
                        'scope' => $account->scope,
                        'currency_code' => $account->currency_code,
                        'reference_code' => $this->nextReferenceCode($tenant->id),
                        'icon_key' => $seed['icon_key'] ?? $this->getIconForWallet($seed['name']),
                        'background_color' => $seed['background_color'] ?? $colors[array_rand($colors)],
                        'budget_lock_enabled' => (bool) ($seed['budget_lock'] ?? false),
                        'current_balance' => 0,
                        'notes' => null,
                        'is_active' => true,
                        'row_version' => 1,
                    ])->save();
                }
            }
        });
    }

    private function nextReferenceCode(int $tenantId): string
    {
        do {
            $reference = 'WLT-' . strtoupper(Str::random(8));
        } while (FinanceWallet::query()->where('tenant_id', $tenantId)->where('reference_code', $reference)->exists());

        return $reference;
    }
}
