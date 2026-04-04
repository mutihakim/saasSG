<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use Illuminate\Database\Seeder;

class TenantBankAccountSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->each(function (Tenant $tenant) {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->orderBy('id')
                ->get();

            if ($members->isEmpty()) {
                return;
            }

            foreach ($members as $member) {
                $account = TenantBankAccount::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'name' => 'Cash ' . $member->full_name,
                    ],
                    [
                        'owner_member_id' => $member->id,
                        'scope' => 'private',
                        'type' => 'cash',
                        'currency_code' => $tenant->currency_code ?? 'IDR',
                        'opening_balance' => 250000,
                        'current_balance' => 250000,
                        'notes' => 'Akun cash pribadi default',
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                $account->memberAccess()->syncWithoutDetaching([
                    $member->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
                ]);
            }

            $sharedAccounts = [
                ['name' => 'Rekening Keluarga Utama', 'type' => 'bank', 'opening_balance' => 5000000],
                ['name' => 'E-Wallet Keluarga', 'type' => 'ewallet', 'opening_balance' => 750000],
                ['name' => 'PayLater Keluarga', 'type' => 'paylater', 'opening_balance' => 0],
            ];

            foreach ($sharedAccounts as $seed) {
                $account = TenantBankAccount::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'name' => $seed['name'],
                    ],
                    [
                        'owner_member_id' => $members->first()->id,
                        'scope' => 'shared',
                        'type' => $seed['type'],
                        'currency_code' => $tenant->currency_code ?? 'IDR',
                        'opening_balance' => $seed['opening_balance'],
                        'current_balance' => $seed['opening_balance'],
                        'notes' => 'Akun bersama tenant',
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                $account->memberAccess()->sync(
                    $members->mapWithKeys(fn (TenantMember $member) => [
                        $member->id => [
                            'can_view' => true,
                            'can_use' => true,
                            'can_manage' => $member->isPrivilegedFinanceActor(),
                        ],
                    ])->all()
                );
            }
        });
    }
}
