<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantBudget;
use App\Models\TenantMember;
use Illuminate\Database\Seeder;

class TenantBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $periodMonth = now()->format('Y-m');

        Tenant::query()->each(function (Tenant $tenant) use ($periodMonth) {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->orderBy('id')
                ->get();

            if ($members->isEmpty()) {
                return;
            }

            $sharedBudgets = [
                ['name' => 'Belanja Rumah', 'code' => 'HOUSEHOLD', 'allocated_amount' => 2500000],
                ['name' => 'Tagihan Bulanan', 'code' => 'BILLS', 'allocated_amount' => 1500000],
                ['name' => 'Transportasi', 'code' => 'TRANSPORT', 'allocated_amount' => 800000],
            ];

            foreach ($sharedBudgets as $seed) {
                $budget = TenantBudget::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'period_month' => $periodMonth,
                        'name' => $seed['name'],
                    ],
                    [
                        'owner_member_id' => $members->first()->id,
                        'code' => $seed['code'],
                        'scope' => 'shared',
                        'allocated_amount' => $seed['allocated_amount'],
                        'spent_amount' => 0,
                        'remaining_amount' => $seed['allocated_amount'],
                        'notes' => 'Budget bersama tenant',
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                $budget->memberAccess()->sync(
                    $members->mapWithKeys(fn (TenantMember $member) => [
                        $member->id => [
                            'can_view' => true,
                            'can_use' => true,
                            'can_manage' => $member->isPrivilegedFinanceActor(),
                        ],
                    ])->all()
                );
            }

            foreach ($members as $member) {
                $budget = TenantBudget::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'period_month' => $periodMonth,
                        'name' => 'Budget Pribadi ' . $member->full_name,
                    ],
                    [
                        'owner_member_id' => $member->id,
                        'code' => 'PERSONAL-' . $member->id,
                        'scope' => 'private',
                        'allocated_amount' => 500000,
                        'spent_amount' => 0,
                        'remaining_amount' => 500000,
                        'notes' => 'Budget pribadi member',
                        'is_active' => true,
                        'row_version' => 1,
                    ]
                );

                $budget->memberAccess()->syncWithoutDetaching([
                    $member->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
                ]);
            }
        });
    }
}
