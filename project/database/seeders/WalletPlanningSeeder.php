<?php

namespace Database\Seeders;

use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\WalletWish;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Database\Seeder;

class WalletPlanningSeeder extends Seeder
{
    public function run(): void
    {
        $pockets = app(FinanceWalletService::class);

        Tenant::query()->each(function (Tenant $tenant) use ($pockets) {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->orderBy('id')
                ->get();

            $owner = $members->first();
            if (! $owner) {
                return;
            }

            $accounts = $tenant->bankAccounts()->active()->orderBy('name')->get();
            if ($accounts->isEmpty()) {
                return;
            }

            $primaryWallet = null;
            foreach ($accounts as $account) {
                $wallet = $pockets->ensureMainPocket($account);
                $primaryWallet ??= $wallet;
            }

            if (! $primaryWallet) {
                return;
            }

            $umrohGoal = FinanceSavingsGoal::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Tabungan Umroh',
                ],
                [
                    'wallet_id' => $primaryWallet->id,
                    'owner_member_id' => $owner->id,
                    'target_amount' => 35000000,
                    'current_amount' => 12500000,
                    'target_date' => now()->addMonths(14)->toDateString(),
                    'status' => 'active',
                    'notes' => 'Target keluarga untuk perjalanan ibadah.',
                    'row_version' => 1,
                ]
            );

            FinanceSavingsGoal::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Dana Darurat Keluarga',
                ],
                [
                    'wallet_id' => $primaryWallet->id,
                    'owner_member_id' => $owner->id,
                    'target_amount' => 18000000,
                    'current_amount' => 9200000,
                    'target_date' => now()->addMonths(9)->toDateString(),
                    'status' => 'active',
                    'notes' => 'Cadangan untuk kebutuhan mendadak.',
                    'row_version' => 1,
                ]
            );

            WalletWish::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'title' => 'Laptop Belajar Anak',
                ],
                [
                    'owner_member_id' => $owner->id,
                    'description' => 'Laptop ringan untuk sekolah dan kursus online.',
                    'estimated_amount' => 7200000,
                    'priority' => 'high',
                    'status' => 'approved',
                    'image_url' => null,
                    'notes' => 'Dipertimbangkan untuk semester depan.',
                    'row_version' => 1,
                ]
            );

            WalletWish::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'title' => 'Vacuum Cleaner Cordless',
                ],
                [
                    'owner_member_id' => $owner->id,
                    'description' => 'Perlengkapan rumah tangga agar bersih lebih cepat.',
                    'estimated_amount' => 2400000,
                    'priority' => 'medium',
                    'status' => 'pending',
                    'image_url' => null,
                    'notes' => 'Masih menunggu persetujuan keluarga.',
                    'row_version' => 1,
                ]
            );

            WalletWish::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'title' => 'Paket Liburan Akhir Tahun',
                ],
                [
                    'owner_member_id' => $owner->id,
                    'goal_id' => $umrohGoal->id,
                    'description' => 'Rencana liburan keluarga jika target utama sudah aman.',
                    'estimated_amount' => 9500000,
                    'priority' => 'high',
                    'status' => 'converted',
                    'image_url' => null,
                    'notes' => 'Sudah dipindahkan menjadi komitmen tabungan.',
                    'row_version' => 1,
                ]
            );
        });
    }
}
