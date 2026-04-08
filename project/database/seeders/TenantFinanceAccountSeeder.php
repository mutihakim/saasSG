<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantBankAccount;
use App\Models\TenantMember;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;

class TenantFinanceAccountSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->orderBy('id')->each(function (Tenant $tenant): void {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->get()
                ->keyBy(fn (TenantMember $member) => strtolower($member->full_name));

            foreach (FamilyFinanceSeed::accountBlueprints($tenant->slug) as $seed) {
                FamilyFinanceSeed::assertCompactName($seed['name']);

                $owner = $members->get($seed['owner']);

                $account = TenantBankAccount::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'name' => $seed['name'],
                    ],
                    [
                        'owner_member_id' => $owner?->id,
                        'scope' => $seed['scope'],
                        'type' => $seed['type'],
                        'currency_code' => $tenant->currency_code ?: 'IDR',
                        'opening_balance' => $seed['opening_balance'],
                        'current_balance' => $seed['opening_balance'],
                        'notes' => 'Seed baseline finance keluarga',
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                $this->syncAccountAccess($tenant, $account, $members);
            }
        });
    }

    private function syncAccountAccess(Tenant $tenant, TenantBankAccount $account, $members): void
    {
        if ($account->scope === 'private') {
            $sync = [];

            if ($account->owner_member_id) {
                $sync[(int) $account->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
            }

            if ($account->name === 'Bank Anak' || $account->name === 'Tunai Anak' || $account->name === 'eWallet Anak') {
                foreach (['kakak', 'adik'] as $memberKey) {
                    $member = $members->get($memberKey);
                    if ($member) {
                        $sync[(int) $member->id] = [
                            'can_view' => true,
                            'can_use' => true,
                            'can_manage' => (int) $member->id === (int) $account->owner_member_id,
                        ];
                    }
                }
            }

            $account->memberAccess()->sync($sync);

            return;
        }

        $sync = [];
        foreach ($members as $member) {
            $sync[(int) $member->id] = [
                'can_view' => true,
                'can_use' => true,
                'can_manage' => $member->role_code === 'owner',
            ];
        }

        $account->memberAccess()->sync($sync);
    }
}
