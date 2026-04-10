<?php

namespace Database\Seeders;

use App\Models\TenantBudget;
use App\Models\TenantMember;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BudgetAccessMigrationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $budgets = TenantBudget::query()->get();

        foreach ($budgets as $budget) {
            $syncData = [];

            // 1. Owner gets full access
            if ($budget->owner_member_id) {
                $syncData[(int) $budget->owner_member_id] = [
                    'can_view' => true,
                    'can_use' => true,
                    'can_manage' => true,
                ];
            }

            // 2. If shared, all tenant members get view & use access
            if ($budget->scope === 'shared') {
                $tenantMembers = TenantMember::query()
                    ->where('tenant_id', $budget->tenant_id)
                    ->pluck('id')
                    ->all();

                foreach ($tenantMembers as $memberId) {
                    // Don't overwrite owner access if already set
                    if (! isset($syncData[(int) $memberId])) {
                        $syncData[(int) $memberId] = [
                            'can_view' => true,
                            'can_use' => true,
                            'can_manage' => false,
                        ];
                    }
                }
            }

            if (! empty($syncData)) {
                $budget->memberAccess()->sync($syncData);
            }
        }
    }
}
