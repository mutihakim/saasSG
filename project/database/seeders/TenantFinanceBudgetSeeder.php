<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantBudget;
use App\Models\FinanceWallet;
use App\Models\TenantMember;
use Database\Seeders\Support\FamilyFinanceSeed;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TenantFinanceBudgetSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->orderBy('id')->each(function (Tenant $tenant): void {
            $members = TenantMember::query()
                ->where('tenant_id', $tenant->id)
                ->where('profile_status', 'active')
                ->get()
                ->keyBy(fn (TenantMember $member) => strtolower($member->full_name));
            $pockets = FinanceWallet::query()
                ->where('tenant_id', $tenant->id)
                ->with('realAccount:id,name')
                ->get();
            $periodMonths = collect(FamilyFinanceSeed::demoTransactions($tenant->slug))
                ->pluck('transaction_date')
                ->filter()
                ->map(fn (string $date) => substr($date, 0, 7))
                ->unique()
                ->sort()
                ->values();

            if ($periodMonths->isEmpty()) {
                $periodMonths = collect([now()->format('Y-m')]);
            }

            foreach ($periodMonths as $periodMonth) {
                foreach (FamilyFinanceSeed::budgetBlueprints($tenant->slug) as $seed) {
                    FamilyFinanceSeed::assertCompactName($seed['name']);

                    $owner = $members->get($seed['owner']);
                    $lockedPocket = $this->resolveLockedPocket($pockets, $seed);
                    $budgetKey = $this->budgetKey($seed['name']);

                    $budget = TenantBudget::query()->updateOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'period_month' => $periodMonth,
                            'budget_key' => $budgetKey,
                            'owner_member_id' => $owner?->id,
                        ],
                        [
                            'wallet_id' => $lockedPocket?->id,
                            'name' => $seed['name'],
                            'code' => strtoupper(substr(md5($tenant->slug . '|' . $seed['name'] . '|' . $periodMonth), 0, 10)),
                            'scope' => $seed['scope'],
                            'allocated_amount' => $seed['amount'],
                            'spent_amount' => 0,
                            'remaining_amount' => $seed['amount'],
                            'notes' => null,
                            'is_active' => true,
                            'row_version' => 1,
                        ]
                    );

                    foreach ($this->resolveDefaultPockets($pockets, $seed) as $defaultPocket) {
                        $isLocked = $this->isLockedPocket($seed, $defaultPocket);
                        $defaultPocket->forceFill([
                            'default_budget_id' => $periodMonth === now()->format('Y-m') ? $budget->id : $defaultPocket->default_budget_id,
                            'default_budget_key' => $budgetKey,
                            'budget_lock_enabled' => $isLocked || (bool) $defaultPocket->budget_lock_enabled,
                        ])->save();
                    }

                    $this->syncBudgetAccess($budget, $members);
                }
            }
        });
    }

    private function budgetKey(string $name): string
    {
        $key = Str::slug($name, '_');

        return $key !== '' ? $key : 'budget';
    }

    private function resolveLockedPocket($pockets, array $seed): ?FinanceWallet
    {
        $target = $seed['lock_pocket'] ?? null;
        if (! $target) {
            return null;
        }

        return $this->findPocketByMapping($pockets, $target['account'] ?? null, $target['pocket'] ?? null);
    }

    private function resolveDefaultPockets($pockets, array $seed): array
    {
        return collect($seed['default_pockets'] ?? [])
            ->map(fn (array $mapping) => $this->findPocketByMapping($pockets, $mapping['account'] ?? null, $mapping['pocket'] ?? null))
            ->filter()
            ->all();
    }

    private function isLockedPocket(array $seed, FinanceWallet $pocket): bool
    {
        $target = $seed['lock_pocket'] ?? null;

        return $target
            && (string) ($target['account'] ?? '') === (string) ($pocket->realAccount?->name ?? '')
            && (string) ($target['pocket'] ?? '') === (string) $pocket->name;
    }

    private function findPocketByMapping($pockets, ?string $accountName, ?string $pocketName): ?FinanceWallet
    {
        if (! $accountName || ! $pocketName) {
            return null;
        }

        return $pockets->first(function (FinanceWallet $pocket) use ($accountName, $pocketName): bool {
            return (string) ($pocket->realAccount?->name ?? '') === (string) $accountName
                && (string) $pocket->name === (string) $pocketName;
        });
    }

    private function syncBudgetAccess(TenantBudget $budget, $members): void
    {
        if ($budget->scope === 'private') {
            $sync = [];

            if ($budget->owner_member_id) {
                $sync[(int) $budget->owner_member_id] = ['can_view' => true, 'can_use' => true, 'can_manage' => true];
            }

            $budget->memberAccess()->sync($sync);

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

        $budget->memberAccess()->sync($sync);
    }
}
