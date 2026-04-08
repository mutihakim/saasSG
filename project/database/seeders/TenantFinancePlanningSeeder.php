<?php

namespace Database\Seeders;

use App\Models\FinancePocket;
use App\Models\FinanceSavingsGoal;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\WalletWish;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;

class TenantFinancePlanningSeeder extends Seeder
{
    public function run(): void
    {
        $planning = FamilyFinanceSeed::planningBlueprints();

        Tenant::query()->where('slug', 'enterprise')->each(function (Tenant $tenant) use ($planning): void {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->get()
                ->keyBy(fn (TenantMember $member) => strtolower($member->full_name));

            $pockets = FinancePocket::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_system', false)
                ->get()
                ->keyBy('name');

            $owner = $members->get('owner');
            $goals = [];

            foreach ($planning['goals'] as $seed) {
                $pocket = $pockets->get($seed['pocket']);
                if (! $pocket) {
                    continue;
                }

                $goal = FinanceSavingsGoal::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'name' => $seed['name'],
                    ],
                    [
                        'pocket_id' => $pocket->id,
                        'owner_member_id' => $owner?->id,
                        'target_amount' => $seed['amount'],
                        'current_amount' => $seed['current'],
                        'target_date' => now()->addMonths($seed['months'])->toDateString(),
                        'status' => 'active',
                        'notes' => 'Goal baseline finance keluarga',
                        'row_version' => 1,
                    ]
                );

                $goals[$seed['name']] = $goal;
            }

            foreach ($planning['wishes'] as $seed) {
                WalletWish::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'title' => $seed['title'],
                    ],
                    [
                        'owner_member_id' => $owner?->id,
                        'goal_id' => $seed['goal'] ? ($goals[$seed['goal']]->id ?? null) : null,
                        'description' => 'Wish baseline finance keluarga',
                        'estimated_amount' => $seed['amount'],
                        'priority' => $seed['priority'],
                        'status' => $seed['status'],
                        'image_url' => null,
                        'notes' => 'Wish baseline finance keluarga',
                        'row_version' => 1,
                    ]
                );
            }
        });
    }
}
