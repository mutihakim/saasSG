<?php

namespace App\Policies;

use App\Models\FinanceTransaction;
use App\Models\TenantMember;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FinanceTransactionPolicy
{
    use HandlesAuthorization;

    private function getMember(User $user): ?TenantMember
    {
        return app('currentTenantMember') ?? null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('finance.view');
    }

    public function view(User $user, FinanceTransaction $transaction): bool
    {
        return $user->hasPermissionTo('finance.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('finance.create');
    }

    public function update(User $user, FinanceTransaction $transaction): bool
    {
        $member = $this->getMember($user);
        if (! $member) {
            return false;
        }

        // Check if user is owner of the transaction
        if ((string) $transaction->created_by === (string) $member->id) {
            return true;
        }

        return $user->hasPermissionTo('finance.update');
    }

    public function delete(User $user, FinanceTransaction $transaction): bool
    {
        $member = $this->getMember($user);
        if (! $member) {
            return false;
        }

        if ((string) $transaction->created_by === (string) $member->id) {
            return true;
        }

        return $user->hasPermissionTo('finance.delete');
    }

    public function restore(User $user, FinanceTransaction $transaction): bool
    {
        return $user->hasPermissionTo('finance.delete');
    }

    public function forceDelete(User $user, FinanceTransaction $transaction): bool
    {
        return false; // Only superadmin via artisan
    }
}
